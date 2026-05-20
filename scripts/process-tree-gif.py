"""
Strip the solid-black background from public/shadowbox/tree.gif and emit
two transparent variants:

  - tree.gif  : 1-bit alpha (palette-mode) — what Shadowbox loads.
  - tree.webp : true 8-bit alpha animated WebP (handy fallback).

Run from the repo root:
    python scripts/process-tree-gif.py
"""
from __future__ import annotations
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageSequence
from scipy import ndimage

SRC = Path(__file__).resolve().parent.parent / "public" / "shadowbox" / "tree.gif"
OUT_GIF = SRC
OUT_WEBP = SRC.with_suffix(".webp")

BLACK_MAX = 32
MONO_TOL = 21


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


def feather(alpha: np.ndarray, sigma: float = 0.8, low: int = 24) -> np.ndarray:
    a = alpha.astype(np.float32) / 255.0
    blurred = ndimage.gaussian_filter(a, sigma=sigma)
    out = np.where(a > 0.95, a, blurred)
    out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    out[out < low] = 0
    return out


def process_frame(frame: Image.Image) -> Image.Image:
    rgba = np.array(frame.convert("RGBA"))
    bg = background_mask(rgba[:, :, :3].astype(np.int16))
    # Don't restrict to corner-connected — interior black blobs (dark shadow
    # cores, anti-aliased fringes inside the silhouette) need to go too.
    # Grow the mask by 1px to mop up halo fringe around each blob.
    bg = ndimage.binary_dilation(bg, iterations=1)
    alpha = rgba[:, :, 3].copy()
    alpha[bg] = 0
    alpha = feather(alpha)
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def main() -> int:
    if not SRC.exists():
        print(f"missing source: {SRC}", file=sys.stderr)
        return 1

    src = Image.open(SRC)
    n = getattr(src, "n_frames", 1)
    duration = src.info.get("duration", 80)
    loop = src.info.get("loop", 0)
    print(f"tree.gif: {src.size}  {n} frames  duration={duration}ms  loop={loop}")

    rgba_frames: list[Image.Image] = []
    for i, frame in enumerate(ImageSequence.Iterator(src)):
        rgba_frames.append(process_frame(frame))
        if (i + 1) % 20 == 0:
            print(f"  processed {i+1}/{n}")

    rgba_frames[0].save(
        OUT_WEBP,
        format="WEBP",
        save_all=True,
        append_images=rgba_frames[1:],
        duration=duration,
        loop=loop,
        quality=85,
        method=6,
        allow_mixed=True,
    )
    print(f"  -> {OUT_WEBP}  ({OUT_WEBP.stat().st_size // 1024}KB)")

    gif_frames: list[Image.Image] = []
    for f in rgba_frames:
        rgb = f.convert("RGB").quantize(colors=255, method=Image.MEDIANCUT)
        alpha = np.array(f.split()[3])
        palette_arr = np.array(rgb)
        palette_arr[alpha == 0] = 255
        new = Image.fromarray(palette_arr, "P")
        new.putpalette(rgb.getpalette())
        new.info["transparency"] = 255
        gif_frames.append(new)

    gif_frames[0].save(
        OUT_GIF,
        format="GIF",
        save_all=True,
        append_images=gif_frames[1:],
        duration=duration,
        loop=loop,
        transparency=255,
        disposal=2,
        optimize=False,
    )
    print(f"  -> {OUT_GIF}  ({OUT_GIF.stat().st_size // 1024}KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
