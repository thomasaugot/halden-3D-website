"""Generate the flight as one chain of Gemini Omni clips, then cut each into a frame sequence.

  GEMINI_API_KEY=... python3 tools/video/chain.py [clip ...]

Each clip that names `after` opens on the last frame of that clip, so the
footage reads as one continuous camera move. Raw clips land in
tools/video/raw/ (kept, they are the masters); frame sequences in
public/seq/<clip>/0001.jpg and a manifest in public/seq/manifest.json.
"""

import base64
import json
import os
import subprocess
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
RAW = os.path.join(ROOT, "tools", "video", "raw")
SEQ = os.path.join(ROOT, "public", "seq")
MODEL = "gemini-omni-1.2-flash"

FPS = 15
WIDTH = 1600

JET = (
    "a white long-range business jet with a cobalt blue T-tail, cobalt blue winglets, two engines mounted on "
    "the rear fuselage, a long row of large oval cabin windows"
)
CABIN = (
    "a private jet cabin with off-white quilted leather seats, dark walnut veneer, a deep navy carpet, brushed "
    "nickel trim and large oval windows"
)
STYLE = (
    "Photoreal, shot on a large-sensor cinema camera, natural light, crisp detail, one continuous shot with a "
    "smooth stabilised camera, no cuts, no text, no logos, no people."
)

CLIPS = {
    "c1-cabin": {
        "duration": 10,
        "prompt": f"Inside {CABIN} at cruise altitude in late-morning sun. The camera glides slowly down the aisle "
        "toward one large oval window, the window grows to fill the frame and the camera passes through it into "
        "open sky above a sea of white clouds, deep blue sky above.",
    },
    "c2-flyby": {
        "after": "c1-cabin",
        "duration": 8,
        "prompt": f"Continue from the first image, the same sky and cloud sea. {JET} glides into frame from the "
        "left, slightly below the camera, while the camera tracks alongside it, ending on a clean side profile of "
        "the jet, nose pointing right, in the centre of frame.",
    },
    "c3-orbit": {
        "after": "c2-flyby",
        "duration": 8,
        "prompt": f"Continue from the first image: the same jet, {JET}, flying above the clouds. The camera arcs "
        "smoothly around the aircraft from its side profile to a front three-quarter view, then drifts close to "
        "the forward cabin windows.",
    },
    "c4-inside": {
        "after": "c3-orbit",
        "duration": 12,
        "prompt": f"Continue from the first image: the camera moves through a cabin window into {CABIN}, then glides "
        "aft in one continuous move: past four club seats facing each other, past a walnut dining table set for two "
        "beside a long leather divan, through an open walnut door into a stateroom with a made double bed with "
        "white linen and a cobalt blue throw, ending looking at the stateroom window.",
    },
    "c5-climb": {
        "after": "c4-inside",
        "duration": 8,
        "prompt": f"Continue from the first image: the camera moves out through the stateroom window into the sky "
        f"and pulls far back to reveal {JET} climbing steeply, small in frame. The sky deepens from blue to dark "
        "navy and then almost black with the first stars, the curve of the earth faint on the horizon.",
    },
    "c6-landing": {
        "duration": 10,
        "prompt": f"At dusk, {JET} descends through a thin layer of golden clouds, flies a short final approach over "
        "a calm lake toward a runway with snow-capped Alps behind, and touches down softly with a light puff of "
        "tyre smoke. The camera tracks from the side. Warm orange and deep blue evening sky.",
    },
}


def call(body: dict, key: str) -> bytes:
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    with urllib.request.urlopen(req, timeout=1200) as res:
        data = json.load(res)
    video = data.get("output_video") or {}
    if video.get("data"):
        return base64.b64decode(video["data"])
    for step in data.get("steps", []):
        for c in step.get("content") or []:
            if c.get("type") == "video":
                return base64.b64decode(c["data"])
    raise RuntimeError(f"no video in response: {json.dumps(data)[:300]}")


def last_frame(name: str) -> str:
    out = os.path.join(RAW, f"{name}-last.jpg")
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-sseof", "-0.1", "-i", os.path.join(RAW, f"{name}.mp4"),
         "-frames:v", "1", "-q:v", "2", out],
        check=True,
    )
    return out


def generate(name: str, key: str) -> None:
    clip = CLIPS[name]
    parts = []
    if "after" in clip:
        with open(last_frame(clip["after"]), "rb") as f:
            parts.append({"type": "image", "data": base64.b64encode(f.read()).decode(), "mime_type": "image/jpeg"})
        parts.append({"type": "text", "text": f"Use the image as the exact first frame. {clip['prompt']} {STYLE}"})
    else:
        parts.append({"type": "text", "text": f"{clip['prompt']} {STYLE}"})
    body = {
        "model": MODEL,
        "input": parts,
        "response_format": {"type": "video", "aspect_ratio": "16:9", "resolution": "1080p", "duration": f"{clip['duration']}s"},
    }
    raw = call(body, key)
    with open(os.path.join(RAW, f"{name}.mp4"), "wb") as f:
        f.write(raw)
    print(f"[chain] {name} generated", flush=True)


def to_frames(name: str) -> int:
    out = os.path.join(SEQ, name)
    os.makedirs(out, exist_ok=True)
    for old in os.listdir(out):
        os.unlink(os.path.join(out, old))
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", os.path.join(RAW, f"{name}.mp4"),
         "-vf", f"fps={FPS},scale={WIDTH}:-2:flags=lanczos", "-q:v", "3", os.path.join(out, "%04d.jpg")],
        check=True,
    )
    return len(os.listdir(out))


def write_manifest() -> None:
    manifest = {}
    for name in CLIPS:
        d = os.path.join(SEQ, name)
        if os.path.isdir(d):
            manifest[name] = {"frames": len([f for f in os.listdir(d) if f.endswith(".jpg")]), "fps": FPS}
    with open(os.path.join(SEQ, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)


if __name__ == "__main__":
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("GEMINI_API_KEY is not set")
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(SEQ, exist_ok=True)
    for n in sys.argv[1:] or list(CLIPS):
        try:
            generate(n, key)
            print(f"[chain] {n}: {to_frames(n)} frames", flush=True)
        except Exception as e:
            print(f"[chain] {n} failed: {e}", flush=True)
            if any(CLIPS[m].get("after") == n for m in CLIPS):
                sys.exit(1)
    write_manifest()
