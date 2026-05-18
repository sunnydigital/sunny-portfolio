"""
Chroma-key the wooden-sign PNGs against their solid-black background.

The wooden grain itself is near-monochrome (warm tan / cool walnut / cedar),
so we CAN'T reuse the generic `near-grey` mask used for the figure / hills.
Instead we kill pixels that are simultaneously (a) near-monochrome and
(b) very dark (luma < 30). That preserves the wood while stripping the
background and any deep shadow seams that bled into the canvas.

Run from the repo root:
    python scripts/process-sign-pngs.py
"""
from __future__ import annotations
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

SHADOWBOX_DIR = Path(__file__).resolve().parent.parent / "public" / "shadowbox"
NAMES = [
    "sign-1.png", "sign-2.png", "sign-3.png",
    "paper-1.png", "paper-2.png", "paper-3.png",
]
MAX_DIM = 1400

MONO_TOL = 16
BLACK_MAX = 30


def background_mask(rgb: np.ndarray) -> np.ndarray:
    R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    near_mono = np.maximum.reduce([np.abs(R - G), np.abs(G - B), np.abs(R - B)]) < MONO_TOL
    near_black = np.maximum.reduce([R, G, B]) < BLACK_MAX
    return near_mono & near_black


def corner_flood(bg: np.ndarray) -> np.ndarray:
    h, w = bg.shape
    edges = np.zeros_like(bg)
    edges[0, :] = True; edges[-1, :] = True
    edges[:, 0] = True; edges[:, -1] = True
    seeds = bg & edges
    if not seeds.any():
        return bg
    labels, _ = ndimage.label(bg, structure=np.ones((3, 3), dtype=bool))
    keep = np.unique(labels[seeds])
    keep = keep[keep > 0]
    return np.isin(labels, keep)


def feather(alpha: np.ndarray, sigma: float = 1.0, low: int = 20) -> np.ndarray:
    a = alpha.astype(np.float32) / 255.0
    blurred = ndimage.gaussian_filter(a, sigma=sigma)
    out = np.where(a > 0.95, a, blurred)
    out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    out[out < low] = 0
    return out


def process(name: str) -> None:
    src = SHADOWBOX_DIR / name
    if not src.exists():
        print(f"  ! missing {name}, skipping")
        return
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int16)

    bg = background_mask(rgb)
    bg = corner_flood(bg)
    bg = ndimage.binary_opening(bg, iterations=1)

    alpha = arr[:, :, 3].copy()
    alpha[bg] = 0

    # Drop small isolated specks (< 400px).
    opaque = alpha > 0
    labels, n = ndimage.label(opaque)
    if n > 0:
        sizes = ndimage.sum(opaque, labels, range(1, n + 1))
        small = np.where(sizes < 400)[0] + 1
        alpha[np.isin(labels, small)] = 0

    alpha = feather(alpha)
    arr[:, :, 3] = alpha
    out = Image.fromarray(arr, "RGBA")

    # Crop to content
    bbox = out.split()[3].getbbox()
    if bbox:
        out = out.crop(bbox)

    # Resize
    bw, bh = out.size
    m = max(bw, bh)
    if m > MAX_DIM:
        s = MAX_DIM / m
        out = out.resize((int(bw * s), int(bh * s)), Image.LANCZOS)

    out.save(src, "PNG", optimize=True)
    out.save(src.with_suffix(".webp"), "WEBP", quality=88, method=6)
    print(f"  {name}: {out.size}  PNG {src.stat().st_size // 1024}KB  WebP {src.with_suffix('.webp').stat().st_size // 1024}KB")


def main() -> int:
    if not SHADOWBOX_DIR.is_dir():
        print(f"shadowbox dir not found: {SHADOWBOX_DIR}", file=sys.stderr)
        return 1
    print(f"Processing wooden signs in {SHADOWBOX_DIR}")
    for n in NAMES:
        process(n)
    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
