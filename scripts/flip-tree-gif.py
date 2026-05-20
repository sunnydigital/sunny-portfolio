"""
Horizontally flip public/shadowbox/tree.gif and tree.webp in place,
preserving all frames, durations, loop count, and per-frame transparency.
No re-keying — just a mirror.

Run from the repo root:
    python scripts/flip-tree-gif.py
"""
from __future__ import annotations
import sys
from pathlib import Path
from PIL import Image, ImageSequence

SHADOWBOX = Path(__file__).resolve().parent.parent / "public" / "shadowbox"
GIF = SHADOWBOX / "tree.gif"
WEBP = SHADOWBOX / "tree.webp"


def flip_animation(path: Path) -> None:
    if not path.exists():
        print(f"  ! missing {path.name}")
        return
    src = Image.open(path)
    n = getattr(src, "n_frames", 1)
    duration = src.info.get("duration", 80)
    loop = src.info.get("loop", 0)
    print(f"{path.name}: {src.size}  {n} frames")

    frames = []
    for frame in ImageSequence.Iterator(src):
        # For GIFs, keep palette mode so we don't blow up file size by
        # promoting to RGBA. transpose preserves the palette + transparency.
        flipped = frame.copy().transpose(Image.FLIP_LEFT_RIGHT)
        frames.append(flipped)

    save_kwargs = dict(
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=loop,
    )
    if path.suffix.lower() == ".gif":
        # Preserve transparent palette index + restore-to-bg disposal.
        transparency = src.info.get("transparency")
        if transparency is not None:
            save_kwargs["transparency"] = transparency
        save_kwargs["disposal"] = 2
        save_kwargs["optimize"] = False
        frames[0].save(path, format="GIF", **save_kwargs)
    else:
        save_kwargs["quality"] = 85
        save_kwargs["method"] = 6
        save_kwargs["allow_mixed"] = True
        frames[0].save(path, format="WEBP", **save_kwargs)
    print(f"  -> {path}  ({path.stat().st_size // 1024}KB)")


def main() -> int:
    if not GIF.exists() and not WEBP.exists():
        print("no tree assets found", file=sys.stderr)
        return 1
    flip_animation(GIF)
    flip_animation(WEBP)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
