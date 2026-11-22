"""Generate the site's photographs with Gemini image models.

  GEMINI_API_KEY=... python3 tools/images/generate.py [name ...]

Writes public/images/<name>.jpg. Prompts live in SHOTS below.
"""

import base64
import json
import os
import subprocess
import sys
import urllib.request

MODEL = "gemini-3-pro-image"
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "images")

LOOK = (
    "Editorial photograph for a private aviation company, shot on a medium format camera, natural light, "
    "tack sharp, fine detail in leather grain and wood veneer, high dynamic range, "
    "true-to-life colour, quiet and expensive, no people looking at camera, no text, no logos, no watermark. "
    "Cabin palette: off-white quilted leather, dark walnut veneer, deep navy carpet, brushed nickel trim, "
    "one muted cobalt blue cushion or throw as the only colour accent."
)

SHOTS = {
    "cabin-club": (
        "Interior of a long-range business jet cabin at cruise altitude, four off-white leather club seats facing "
        "each other in pairs around walnut side ledges, large oval windows on both sides with bright cloud tops "
        "and deep blue sky outside, late morning sun casting soft window-shaped light on the seats. Eye level, "
        "looking aft down the aisle.",
        "4:5",
    ),
    "cabin-dining": (
        "Dining area inside a private jet: a walnut table set for two with white porcelain, linen napkins and a "
        "carafe of water, a long off-white leather divan along the opposite wall, two oval windows showing a "
        "sunset over a sea of clouds, warm low light. Three-quarter view at seated eye level.",
        "4:5",
    ),
    "cabin-stateroom": (
        "Aft stateroom of a private jet: a made double bed with crisp white linen and one cobalt blue folded "
        "throw, walnut headboard and nightstand, two oval windows with a deep night sky and the first light of "
        "dawn on the horizon, a reading light on. Calm, intimate.",
        "4:5",
    ),
    "boarding": (
        "A white long-range business jet with a cobalt blue tail fin and blue winglets, two rear-mounted engines, "
        "T-tail, parked on a wet apron at dusk at a small European airport with snow-capped Alps in the distance, "
        "airstair door open with warm cabin light spilling out, a black sedan parked at the foot of the stairs. "
        "Low wide shot from the front quarter.",
        "16:9",
    ),
}


def generate(name: str, key: str) -> None:
    prompt, ratio = SHOTS[name]
    body = {
        "contents": [{"parts": [{"text": f"{prompt} {LOOK}"}]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": ratio, "imageSize": "2K"}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    with urllib.request.urlopen(req, timeout=300) as res:
        data = json.load(res)
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline:
                raw = os.path.join(OUT, f"{name}.source")
                with open(raw, "wb") as f:
                    f.write(base64.b64decode(inline["data"]))
                path = os.path.join(OUT, f"{name}.jpg")
                # high-quality JPEG, long edge capped at 2400 px, never upscaled
                subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "90", "-Z", "2400", raw, "--out", path],
                               check=True, capture_output=True)
                os.unlink(raw)
                print(f"[img] {name} -> {path}")
                return
    print(f"[img] {name}: no image returned: {json.dumps(data)[:300]}")


if __name__ == "__main__":
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("GEMINI_API_KEY is not set")
    os.makedirs(OUT, exist_ok=True)
    for n in sys.argv[1:] or list(SHOTS):
        try:
            generate(n, key)
        except Exception as e:  # keep going with the other shots
            print(f"[img] {n}: {e}")
