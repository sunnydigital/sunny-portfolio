# Shadowbox asset prompts for nano-banana-2 (stitched 21:9)

Each mountain and each hill is rendered as **two 16:9 panels** (a "left half" and a
"right half"). When placed side-by-side they form one continuous ~32:9 (≈3.55:1)
silhouette that's wider than the 21:9 limit nano-banana-pro / nano-banana-2 can
emit natively.

**Common style notes** (applies to every prompt below):

- Aspect ratio: **16:9**
- Background: **solid pure black `#000000`** edge-to-edge (no checker, no white
  border, no pink, no extras). The downstream chroma-key strips solid black to
  alpha, so anything that isn't the silhouette must be black.
- Style: hand-cut paper-cutout, matte paper texture, slightly torn deckled top
  edge, soft hand-painted matte feel matching a shadowbox composition.
- The silhouette must **reach the LEFT or RIGHT image edge at full-height** so
  the two panels join cleanly when stitched. The seam height should be roughly
  consistent between the matching `-left.png` and `-right.png` panels.

## File-naming convention

Save each generated image as:

- `mountain-left-a.png` + `mountain-left-b.png`
- `mountain-middle-a.png` + `mountain-middle-b.png`
- `mountain-right-a.png` + `mountain-right-b.png`
- `hill-1-a.png` + `hill-1-b.png`
- … through …
- `hill-7-a.png` + `hill-7-b.png`

The `-a` panel is the **LEFT half** of the silhouette, `-b` is the **RIGHT half**.

---

## Mountains

All mountains: **pale grey paper `#b0b0b8`**.

### mountain-left-a (far-left half of the left mountain)

```
A single isolated paper-cutout mountain silhouette on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The mountain is soft pale grey paper (color #b0b0b8). This image is the LEFT HALF of a wider mountain composition: the silhouette enters the frame from the LEFT EDGE near the bottom-left corner, sweeps gently upward toward a low rounded peak that sits at about the right side of this panel (so the peak almost touches the RIGHT edge of the frame at mid-height), and the silhouette continues at near full-height OFF the right edge so it can connect to a matching right-half panel. Hand-cut paper-cutout aesthetic with slightly torn deckled top edge, matte paper texture. Everything above the mountain is SOLID PURE BLACK with no other elements, no other mountains, no pink, no checker, no white, no debris.
```

### mountain-left-b (continuation, right half of the left mountain)

```
A single isolated paper-cutout mountain silhouette on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The mountain is soft pale grey paper (color #b0b0b8). This image is the RIGHT HALF of a wider mountain composition. The silhouette enters this frame from the LEFT EDGE at near full-height (continuing from a matching left-half panel where the peak sat near that panel's right edge), slopes gently downward across the panel, and reaches the BOTTOM-RIGHT corner at zero height. Hand-cut paper-cutout aesthetic with slightly torn deckled top edge, matte paper texture. Everything above the mountain is SOLID PURE BLACK with no other elements, no other mountains, no pink, no checker, no white, no debris.
```

### mountain-middle-a (left half of the tall central mountain)

```
A single isolated paper-cutout mountain silhouette on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The mountain is soft pale grey paper (color #b0b0b8). This image is the LEFT HALF of a TALL central mountain. The silhouette enters from the BOTTOM-LEFT corner at zero height, sweeps steeply upward toward a tall rounded peak that sits at about the RIGHT EDGE of this panel at roughly 75% of the frame height. The silhouette continues off the right edge at that 75%-height level so it can connect to a matching right-half panel. Hand-cut paper-cutout aesthetic with slightly torn deckled top edge, matte paper texture. Everything above the mountain is SOLID PURE BLACK with no other elements, no other mountains, no pink, no checker, no white, no debris.
```

### mountain-middle-b (right half of the tall central mountain)

```
A single isolated paper-cutout mountain silhouette on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The mountain is soft pale grey paper (color #b0b0b8). This image is the RIGHT HALF of a TALL central mountain. The silhouette enters from the LEFT EDGE at roughly 75% of the frame height (continuing from a matching left-half panel where the peak sat at that panel's right edge), slopes steeply downward, and reaches the BOTTOM-RIGHT corner at zero height. Hand-cut paper-cutout aesthetic with slightly torn deckled top edge, matte paper texture. Everything above the mountain is SOLID PURE BLACK with no other elements, no other mountains, no pink, no checker, no white, no debris.
```

### mountain-right-a (left half of the right mountain)

```
A single isolated paper-cutout mountain silhouette on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The mountain is soft pale grey paper (color #b0b0b8). This image is the LEFT HALF of a wider mountain composition. The silhouette enters this frame from the BOTTOM-LEFT corner at zero height, sweeps gently upward, and reaches the RIGHT EDGE at near full-height (about 60% of the frame height) so it can continue into a matching right-half panel. Hand-cut paper-cutout aesthetic with slightly torn deckled top edge, matte paper texture. Everything above the mountain is SOLID PURE BLACK with no other elements, no other mountains, no pink, no checker, no white, no debris.
```

### mountain-right-b (right half of the right mountain)

```
A single isolated paper-cutout mountain silhouette on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The mountain is soft pale grey paper (color #b0b0b8). This image is the RIGHT HALF of a wider mountain composition. The silhouette enters this frame from the LEFT EDGE at about 60% of the frame height (continuing from a matching left-half panel), reaches a low rounded peak near the left-third of this panel, then slopes gently downward and exits at the RIGHT EDGE near the bottom-right corner. Hand-cut paper-cutout aesthetic with slightly torn deckled top edge, matte paper texture. Everything above the mountain is SOLID PURE BLACK with no other elements, no other mountains, no pink, no checker, no white, no debris.
```

---

## Hills

All hills are wide low semicircular arcs. Each hill gets its own color from the
gradient below, and a "rise" amount (how tall the peak is). Pattern: hills go
from least-tall in section 0 to tallest in section 6.

| Section | File prefix | Color hex     | Color description    | Peak rise |
| ------- | ----------- | ------------- | -------------------- | --------- |
| 0       | `hill-1`    | `#f6c7d4`     | LIGHT PINK           | 80%       |
| 1       | `hill-2`    | `#f0b3c4`     | LIGHT-MEDIUM PINK    | 75%       |
| 2       | `hill-3`    | `#e8a0b8`     | MEDIUM PINK          | 70%       |
| 3       | `hill-4`    | `#d88aa6`     | MEDIUM-DEEP PINK     | 65%       |
| 4       | `hill-5`    | `#c47892`     | DEEP MAUVE-PINK      | 60%       |
| 5       | `hill-6`    | `#b06880`     | DEEP DUSTY MAUVE     | 55%       |
| 6       | `hill-7`    | `#9c5870`     | DARKEST MAUVE        | 50%       |

For each hill, generate **two panels** using the templates below. Substitute:

- `{COLOR_HEX}` → the hex from the table (e.g. `#f6c7d4`)
- `{COLOR_NAME}` → the color description from the table (e.g. `LIGHT PINK`)
- `{PEAK_PERCENT}` → the rise from the table (e.g. `80`)

### Template `hill-N-a` (LEFT half of one hill arc)

```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in {COLOR_NAME} (color {COLOR_HEX}) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about {PEAK_PERCENT}% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

### Template `hill-N-b` (RIGHT half of the same hill arc)

```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in {COLOR_NAME} (color {COLOR_HEX}) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about {PEAK_PERCENT}% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

---

## Per-hill prompts (already substituted, ready to copy)

### hill-1 (LIGHT PINK, 80% rise)

**hill-1-a:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in LIGHT PINK (color #f6c7d4) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about 80% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

**hill-1-b:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in LIGHT PINK (color #f6c7d4) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about 80% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

### hill-2 (LIGHT-MEDIUM PINK, 75% rise)

**hill-2-a:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in LIGHT-MEDIUM PINK (color #f0b3c4) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about 75% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

**hill-2-b:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in LIGHT-MEDIUM PINK (color #f0b3c4) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about 75% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

### hill-3 (MEDIUM PINK, 70% rise)

**hill-3-a:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in MEDIUM PINK (color #e8a0b8) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about 70% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

**hill-3-b:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in MEDIUM PINK (color #e8a0b8) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about 70% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

### hill-4 (MEDIUM-DEEP PINK, 65% rise)

**hill-4-a:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in MEDIUM-DEEP PINK (color #d88aa6) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about 65% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

**hill-4-b:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in MEDIUM-DEEP PINK (color #d88aa6) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about 65% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

### hill-5 (DEEP MAUVE-PINK, 60% rise)

**hill-5-a:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in DEEP MAUVE-PINK (color #c47892) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about 60% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

**hill-5-b:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in DEEP MAUVE-PINK (color #c47892) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about 60% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

### hill-6 (DEEP DUSTY MAUVE, 55% rise)

**hill-6-a:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in DEEP DUSTY MAUVE (color #b06880) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about 55% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

**hill-6-b:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in DEEP DUSTY MAUVE (color #b06880) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about 55% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

### hill-7 (DARKEST MAUVE, 50% rise)

**hill-7-a:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in DARKEST MAUVE (color #9c5870) with a slightly torn deckled top edge. This image is the LEFT HALF of a wider hill arc. The arc enters from the BOTTOM-LEFT corner at zero height and curves gently upward, reaching the RIGHT EDGE of this panel at about 50% of the frame height (this is the crest, which continues into a matching right-half panel). Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

**hill-7-b:**
```
A single isolated paper-cutout hill arc on a SOLID PURE BLACK BACKGROUND (#000000). Wide 16:9 landscape orientation. The hill is matte paper in DARKEST MAUVE (color #9c5870) with a slightly torn deckled top edge. This image is the RIGHT HALF of a wider hill arc. The arc enters from the LEFT EDGE of this panel at about 50% of the frame height (continuing from a matching left-half panel where the crest sat at that panel's right edge), curves gently downward, and reaches the BOTTOM-RIGHT corner at zero height. Everything above the arc is SOLID PURE BLACK with absolutely no other elements, no tree, no moon, no stars, no debris, no smudges, no extra hills.
```

---

## After generation

1. Save each image as the matching filename above (e.g. `mountain-left-a.png`) into `public/shadowbox/`.
2. Tell me when all 20 panels are saved.
3. I'll process them (chroma-key the black BG to alpha + crop + WebP) and update `Shadowbox.tsx` to render each pair as a stitched widescreen layer.
