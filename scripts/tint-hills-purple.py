"""
Re-tint the existing hill PNGs to a gradient of purples, preserving paper
texture (per-pixel luma variation) and the existing alpha mask.

Front (hill-1) -> warm/saturated purple. Back (hill-7) -> cool/desaturated,
slightly dustier purple, mimicking atmospheric perspective.

Run from the repo root:
    python scripts/tint-hills-purple.py
"""
from __future__ import annotations
from pathlib import Path
import numpy as np
from PIL import Image

SHADOWBOX_DIR = Path(__file__).resolve().parent.parent / "public" / "shadowbox"

# Target mean RGB for each hill (1..7). Front is deepest/warmest, back fades
# into a cooler dusty lavender. Picked by eye on the HSL wheel:
#   H ~ 285 -> 270 (magenta-purple -> blue-purple)
#   S decreasing toward back
#   L increasing toward back
TARGETS = {
    "hill-1.png": (96,  58, 110),   # deep plum
    "hill-2.png": (118, 76, 140),   # rich purple
    "hill-3.png": (138, 100, 165),  # medium purple
    "hill-4.png": (156, 124, 185),  # lavender
    "hill-5.png": (170, 145, 198),  # soft lavender
    "hill-6.png": (182, 165, 208),  # dusty lavender
    "hill-7.png": (190, 180, 215),  # pale misty purple
}


def retint(path: Path, target_rgb: tuple[int, int, int]) -> None:
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3]

    opaque = alpha > 0
    if not opaque.any():
        print(f"  ! {path.name}: no opaque pixels")
        return

    # Use luma of existing content to drive a luma-preserving recolor: keep
    # each pixel's brightness relative to the mean, but recenter on the target.
    luma = rgb.mean(axis=2)
    mean_luma = luma[opaque].mean()
    delta = luma - mean_luma  # per-pixel brightness deviation (signed)

    tr, tg, tb = target_rgb
    new = np.empty_like(rgb)
    new[:, :, 0] = tr + delta
    new[:, :, 1] = tg + delta
    new[:, :, 2] = tb + delta
    new = np.clip(new, 0, 255).astype(np.uint8)

    # Only touch opaque pixels — leave transparent ones at original RGB so
    # feathered edges don't pick up odd colors.
    out = arr.copy()
    out[opaque, :3] = new[opaque]

    Image.fromarray(out, "RGBA").save(path, "PNG", optimize=True)
    webp = path.with_suffix(".webp")
    Image.fromarray(out, "RGBA").save(webp, "WEBP", quality=88, method=6)
    print(f"  {path.name} -> target {target_rgb}  PNG {path.stat().st_size // 1024}KB  WebP {webp.stat().st_size // 1024}KB")


def main() -> int:
    print(f"Tinting hills in {SHADOWBOX_DIR}")
    for name, target in TARGETS.items():
        p = SHADOWBOX_DIR / name
        if not p.exists():
            print(f"  ! missing {name}")
            continue
        retint(p, target)
    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
