"""
Post-process nano-banana-pro generated shadowbox PNGs:
  - Strip painted-on background ("transparency" rendered as checker / white) per layer.
  - Crop to tight content bbox.
  - Resize down to a sensible web size and emit final PNG + WebP.

Run from the repo root:
    python scripts/process-shadowbox.py
"""
from __future__ import annotations
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

SHADOWBOX_DIR = Path(__file__).resolve().parent.parent / "public" / "shadowbox"
MAX_DIM = 1600


def near_monochrome(rgb: np.ndarray, tol: int = 12) -> np.ndarray:
    R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return np.maximum.reduce([np.abs(R - G), np.abs(G - B), np.abs(R - B)]) < tol


def luma(rgb: np.ndarray) -> np.ndarray:
    return rgb.mean(axis=2)


def flood_from_corners(bg_mask: np.ndarray, rgb: np.ndarray, tol: int = 25) -> np.ndarray:
    """Extend bg_mask to include connected components touching any image edge
    that are visually similar to that edge's pixels."""
    h, w = bg_mask.shape
    out = bg_mask.copy()
    # All edge pixels that look like bg
    edge_pixels = np.zeros_like(bg_mask)
    edge_pixels[0, :] = True
    edge_pixels[-1, :] = True
    edge_pixels[:, 0] = True
    edge_pixels[:, -1] = True
    # Seed: edge pixels that are currently flagged as bg
    seeds = bg_mask & edge_pixels
    if not seeds.any():
        return out
    # Find connected components of bg_mask reachable from seeds
    structure = np.ones((3, 3), dtype=bool)
    labels, _ = ndimage.label(bg_mask, structure=structure)
    seed_labels = np.unique(labels[seeds])
    seed_labels = seed_labels[seed_labels > 0]
    reachable = np.isin(labels, seed_labels)
    return out | reachable


def color_flood_from_corners(rgb: np.ndarray, tol: int = 35) -> np.ndarray:
    """Flood-fill from each corner using RGB color similarity. Useful when the
    background uses colors that overlap with content (e.g. mountains)."""
    h, w = rgb.shape[:2]
    seeds = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    bg = np.zeros((h, w), dtype=bool)
    # For each seed, mark all pixels in the same connected component (by color
    # similarity) — multiple seeds union together.
    for sy, sx in seeds:
        seed_color = rgb[sy, sx].astype(np.int16)
        diff = np.abs(rgb.astype(np.int16) - seed_color).max(axis=2)
        similar = diff < tol
        labels, _ = ndimage.label(similar)
        lab = labels[sy, sx]
        if lab > 0:
            bg |= (labels == lab)
    return bg


def feather_edges(alpha: np.ndarray, radius: int = 2, threshold: int = 16) -> np.ndarray:
    """Soften the transition between solid alpha and transparency, but keep
    fully-transparent regions fully transparent (no stray feather alpha)."""
    a = alpha.astype(np.float32) / 255.0
    blurred = ndimage.gaussian_filter(a, sigma=radius)
    out = np.where(a > 0.95, a, blurred)
    out = (np.clip(out, 0, 1) * 255).astype(np.uint8)
    # Any feathered alpha below threshold becomes fully transparent so getbbox
    # doesn't pick up wisps.
    out[out < threshold] = 0
    return out


def process_layer(name: str, *, mode: str, do_crop: bool) -> None:
    """
    mode:
      - 'sky'        : keep as-is (back wall, full opaque)
      - 'grey-bg'    : kill near-grey pixels (any luma) — for moon, tree, figure, hill-1
      - 'white-bg'   : kill near-white pixels (luma > 230) — for telescope, hill-2..7
      - 'mountain'   : kill only very near-white (luma > 235 AND near-grey) — content itself is grey
    """
    src = SHADOWBOX_DIR / name
    if not src.exists():
        print(f"  ! missing {name}, skipping")
        return
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]

    if mode == "sky":
        bg = np.zeros((h, w), dtype=bool)
    else:
        rgb = arr[:, :, :3].astype(np.int16)
        nm = near_monochrome(rgb, tol=12)
        L = luma(rgb)
        if mode == "grey-bg":
            bg = nm  # any near-grey, regardless of luma — kills both checker and dot patterns
        elif mode == "white-bg":
            bg = nm  # same as grey-bg; nano-banana paints "transparent" as a grey dot pattern
        elif mode == "mountain":
            # Mountain content is itself near-grey at luma ~167 (slightly blue).
            # Kill near-grey at extreme luma (white squares of the checker, or
            # pure black), then add a color-flood from corners to scoop up the
            # connected components of bg. Avoids eating the mountain (luma ~167).
            extreme_grey = nm & ((L > 195) | (L < 60))
            corner_flood = color_flood_from_corners(rgb, tol=25)
            bg = extreme_grey | corner_flood
        else:
            raise ValueError(mode)
        if mode != "mountain":
            # Extend via corner flood (catches non-grey wisps connected to bg)
            bg = flood_from_corners(bg, rgb, tol=25)
        # Small morphological close to remove pinholes inside content
        bg = ndimage.binary_opening(bg, iterations=1)

    new_alpha = arr[:, :, 3].copy()
    new_alpha[bg] = 0
    if mode != "sky":
        # Drop small isolated specks left over from chroma-key (less than ~200px).
        opaque = new_alpha > 0
        labels, n = ndimage.label(opaque)
        if n > 0:
            sizes = ndimage.sum(opaque, labels, range(1, n + 1))
            small = np.where(sizes < 400)[0] + 1
            mask_small = np.isin(labels, small)
            new_alpha[mask_small] = 0
    # Feather along the new alpha edges so edges don't look jagged
    new_alpha = feather_edges(new_alpha, radius=2)
    arr[:, :, 3] = new_alpha

    img = Image.fromarray(arr, "RGBA")
    if do_crop:
        a = img.split()[3]
        bbox = a.getbbox()
        if bbox:
            img = img.crop(bbox)
    # Resize
    bw, bh = img.size
    m = max(bw, bh)
    if m > MAX_DIM:
        scale = MAX_DIM / m
        img = img.resize((int(bw * scale), int(bh * scale)), Image.LANCZOS)
    img.save(src, "PNG", optimize=True)
    img.save(src.with_suffix(".webp"), "WEBP", quality=88, method=6)
    print(f"  {name}: {img.size}  PNG {src.stat().st_size // 1024}KB  WebP {src.with_suffix('.webp').stat().st_size // 1024}KB")


def main() -> int:
    if not SHADOWBOX_DIR.is_dir():
        print(f"shadowbox dir not found: {SHADOWBOX_DIR}", file=sys.stderr)
        return 1

    plan = [
        ("sky.png",          "sky",       False),
        ("mountains.png",    "mountain",  True),
        ("moon.png",         "grey-bg",   True),
        ("tree.png",         "grey-bg",   True),
        ("figure.png",       "grey-bg",   True),
        ("telescope.png",    "white-bg",  True),
        ("galaxy-paper.png", "grey-bg",   True),
        ("hill-1.png",       "grey-bg",   True),
        ("hill-2.png",       "white-bg",  True),
        ("hill-3.png",       "white-bg",  True),
        ("hill-4.png",       "white-bg",  True),
        ("hill-5.png",       "white-bg",  True),
        ("hill-6.png",       "white-bg",  True),
        ("hill-7.png",       "white-bg",  True),
    ]
    print(f"Processing {SHADOWBOX_DIR}")
    for name, mode, do_crop in plan:
        process_layer(name, mode=mode, do_crop=do_crop)
    print("done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
