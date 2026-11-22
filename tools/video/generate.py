"""Generate the site's video clips with Gemini Omni (Interactions API), then encode them for scroll scrubbing.

  GEMINI_API_KEY=... python3 tools/video/generate.py [name ...]

Writes public/video/<name>.mp4: H.264, every frame a keyframe, no audio, so
setting video.currentTime from the scroll position lands on an exact frame.
"""

import base64
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

MODEL = "gemini-omni-1.2-flash"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "video")

STYLE = "Smooth stabilised camera, one continuous shot, no cuts, no text, no logos, photoreal, natural colour."

CLIPS = {
    "cabin-to-sky": (
        "8 second cinematic video, 16:9: a slow continuous camera push from inside a private jet cabin "
        "(off-white leather seats, walnut veneer, navy carpet) toward a large oval window, passing through the "
        "window into bright open sky above a sea of white clouds, late morning sun."
    ),
    "flyby": (
        "8 second cinematic aerial video, 16:9: above a sea of white clouds in bright late-morning sun, a white "
        "long-range business jet with a cobalt blue T-tail, cobalt blue winglets and two rear-mounted engines "
        "glides into frame from the left while the camera tracks alongside, ending on a clean side profile of the "
        "jet in the centre of frame against deep blue sky."
    ),
    "landing": (
        "8 second cinematic video, 16:9, at dusk: a white business jet with a cobalt blue T-tail descends through "
        "a thin layer of golden clouds, then flies a short final approach over a calm lake toward a runway with "
        "snow-capped Alps behind, touching down softly with a light puff of tyre smoke. Camera tracks from the "
        "side. Warm orange and deep blue evening sky."
    ),
}


def generate(name: str, key: str) -> None:
    body = {"model": MODEL, "input": f"{CLIPS[name]} {STYLE}", "response_modalities": ["video"]}
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    with urllib.request.urlopen(req, timeout=900) as res:
        data = json.load(res)
    raw = None
    for step in data.get("steps", []):
        for c in step.get("content") or []:
            if c.get("type") == "video":
                raw = base64.b64decode(c["data"])
    if raw is None:
        print(f"[vid] {name}: no video returned: {json.dumps(data)[:300]}")
        return
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(raw)
    path = os.path.join(OUT, f"{name}.mp4")
    subprocess.run(
        [
            "ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, "-an",
            "-vf", "scale=1280:-2", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
            "-g", "1", "-keyint_min", "1", "-pix_fmt", "yuv420p", "-movflags", "+faststart", path,
        ],
        check=True,
    )
    os.unlink(tmp.name)
    print(f"[vid] {name} -> {path}")


if __name__ == "__main__":
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("GEMINI_API_KEY is not set")
    os.makedirs(OUT, exist_ok=True)
    for n in sys.argv[1:] or list(CLIPS):
        try:
            generate(n, key)
        except Exception as e:
            print(f"[vid] {n}: {e}")
