"use client";

// Skills section: each category is rendered as its own hand-painted wooden
// sign that can be dragged independently around the hill. The three sign
// silhouettes (post + plank, walnut arrow, cedar stake) are reused in
// rotation across all category signs. Selecting a skill chip on a sign opens
// the matching-projects carousel anchored at the top of the viewport.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, ExternalLink, Github, Lightbulb, X } from "lucide-react";
import { Skill, Project } from "@/types";
import { saveToDb } from "@/lib/db";

// Single ordered list of categories. Also used by the unmatched-tag editor's
// Category dropdown.
const ALL_CATEGORIES = [
  "Programming Languages",
  "AI / ML Frameworks",
  "Data & Compute",
  "Cloud & Infrastructure",
  "MLOps & Tools",
  "Specializations",
  "Other",
];

// Three reusable torn-paper-sheet silhouettes generated via nano-banana-2
// and chroma-keyed. Each paper has a different shape + rotation feel, with
// per-variant inset percentages that describe the usable inner writable area
// — i.e. how far the chips should stay back from the torn deckled edges so
// the lettering doesn't fall off the paper.
type PaperVariant = {
  src: string;
  // Inner writable inset as % of the silhouette's bounding box. Larger insets
  // pull chips farther in from the torn edge.
  insetTopPct: number;
  insetBottomPct: number;
  insetLeftPct: number;
  insetRightPct: number;
  // Ink colour used for the hand-painted category title on this paper variant.
  inkColor: string;
  // A small CSS rotation applied to the whole card so each paper sits at a
  // slightly different angle, like loose pages dropped on a desk.
  rotateDeg: number;
};
const PAPER_VARIANTS: PaperVariant[] = [
  // paper-1: wide landscape sepia sheet, lots of breathing room inside.
  { src: "/shadowbox/paper-1.webp", insetTopPct: 12, insetBottomPct: 12, insetLeftPct: 8, insetRightPct: 8, inkColor: "#3a2a1e", rotateDeg: -1.5 },
  // paper-2: square-ish parchment, slightly larger insets because the torn
  // edges are more irregular.
  { src: "/shadowbox/paper-2.webp", insetTopPct: 14, insetBottomPct: 14, insetLeftPct: 12, insetRightPct: 12, inkColor: "#4a3320", rotateDeg: 2 },
  // paper-3: notebook-torn sheet with a curled corner — keep right inset
  // bigger so chips don't run under the curl.
  { src: "/shadowbox/paper-3.webp", insetTopPct: 12, insetBottomPct: 14, insetLeftPct: 14, insetRightPct: 18, inkColor: "#3a2a1e", rotateDeg: -2.5 },
];

// Default position of each paper within the skills band. Tuned so the seven
// category sheets fan out across the hillside like scattered pages.
// Users can drag each one freely afterwards.
const PAPER_DEFAULT_POSITIONS: Record<string, { x: number; y: number; variant: number; widthPx: number; pinColor: string }> = {
  "Programming Languages": { x: -940, y: 599, variant: 0, widthPx: 480, pinColor: "#c83737" }, // red
  "AI / ML Frameworks": { x: 201, y: 288, variant: 2, widthPx: 480, pinColor: "#e0a020" }, // amber
  "Data & Compute": { x: 98, y: 540, variant: 1, widthPx: 400, pinColor: "#3a8a3a" }, // green
  "Cloud & Infrastructure": { x: -734, y: 396, variant: 1, widthPx: 450, pinColor: "#2b6cb0" }, // blue
  "MLOps & Tools": { x: -282, y: 303, variant: 0, widthPx: 450, pinColor: "#7a3aa2" }, // purple
  "Specializations": { x: -401, y: 589, variant: 2, widthPx: 575, pinColor: "#d05a8a" }, // pink
  "Other": { x: 630, y: 361, variant: 1, widthPx: 360, pinColor: "#3a3a3a" }, // graphite
};

function exactMatch(a: string, b: string): boolean {
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}
function matchTerms(s: Skill): string[] {
  const parts = s.name.split(/\s*\/\s*/).map((x) => x.trim());
  return [...parts, ...(s.tags ?? [])];
}
function projectsForSkill(s: Skill, all: Project[]): Project[] {
  const terms = matchTerms(s);
  return all.filter((p) => p.tech.some((t) => terms.some((term) => exactMatch(t, term))));
}
function techMatchesSkill(t: string, s: Skill | null): boolean {
  if (!s) return false;
  return matchTerms(s).some((term) => exactMatch(t, term));
}
function techMatchesAny(t: string, skills: Skill[]): boolean {
  return skills.some((s) => matchTerms(s).some((term) => exactMatch(t, term)));
}

// Clean rounded-pill chips matching the desktop Skills.tsx layout: full-radius
// ovals around each word, with the paper-cutout colour palette so they still
// fit the scene. `seed` is unused but kept in the signature so callers don't
// need to change; the chip is intentionally identical across instances.
const PAPER_FILL = "#f5ead2";
const PAPER_FILL_ACTIVE = "#0d3a55";
const PAPER_STROKE = "#3a2a1e";
const PAPER_INK = "#1f1a17";
const PAPER_INK_ACCENT = "#0d3a55";

function paperOvalStyle(_seed: number, active: boolean): React.CSSProperties {
  void _seed;
  return {
    background: active ? PAPER_FILL_ACTIVE : PAPER_FILL,
    border: `1.5px solid ${active ? PAPER_INK_ACCENT : PAPER_STROKE}`,
    borderRadius: "9999px",
    color: active ? PAPER_FILL : PAPER_INK,
    boxShadow: active
      ? "0 2px 4px rgba(0,0,0,0.25)"
      : "0 1px 2px rgba(0,0,0,0.15)",
  };
}

// Hash a string deterministically into a seed integer.
function strSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function SkillsHillEmbed({ skills, projects }: { skills: Skill[]; projects: Project[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);

  // Edit form state for unmatched tags
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("Other");
  const [editLevel, setEditLevel] = useState(50);
  const [editTags, setEditTags] = useState("");

  // Project carousel state. `carouselIdx` can grow unbounded — we wrap with
  // modulo when indexing. Reset to 0 whenever the selected skill changes so a
  // new skill always starts on its first matched project. `dragDx` tracks the
  // in-flight pointer offset for the live drag preview.
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [dragDx, setDragDx] = useState(0);
  const dragStartRef = useRef<{ x: number; pointerId: number } | null>(null);

  // Panel position offset in pixels from its default anchor. User can grab
  // the panel header and drag it anywhere on the screen. Persisted only for
  // the lifetime of the selection — reset on skill change so a new selection
  // recentres the panel.
  const [panelOffset, setPanelOffset] = useState({ x: 694, y: 562 });

  // Live paper offsets — populated as the signed-in dev drags papers around.
  // Used by the dev preview overlay below to show current vs default positions
  // and emit an updated PAPER_DEFAULT_POSITIONS block ready to paste back in.
  const [liveOffsets, setLiveOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [showDevPreview, setShowDevPreview] = useState(false);
  const panelDragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);



  // Auto-bucket any project tech tag that doesn't match a real skill into "Other"
  const { allSkills, unmatchedTags } = useMemo(() => {
    const techTags = new Set<string>();
    projects.forEach((p) => p.tech.forEach((t) => techTags.add(t)));
    const unmatched: string[] = [];
    techTags.forEach((tag) => {
      if (!techMatchesAny(tag, skills)) unmatched.push(tag);
    });
    const orphans: Skill[] = unmatched.map((tag) => ({ name: tag, level: 50, category: "Other" }));
    return { allSkills: [...skills, ...orphans], unmatchedTags: unmatched };
  }, [skills, projects]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const s of allSkills) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [allSkills]);

  const selectedSkill = useMemo(
    () => (selectedSkillName ? allSkills.find((s) => s.name === selectedSkillName) ?? null : null),
    [selectedSkillName, allSkills]
  );
  const matchedProjects = useMemo(
    () => (selectedSkill ? projectsForSkill(selectedSkill, projects) : []),
    [selectedSkill, projects]
  );

  // Reset carousel to first card whenever the selected skill changes so each
  // new skill begins on its own project list rather than continuing the prior
  // skill's offset.
  useEffect(() => {
    setCarouselIdx(0);
    setDragDx(0);
    setPanelOffset({ x: 694, y: 562 });
  }, [selectedSkillName]);

  // Modulo helper that handles negative values (JS `%` keeps sign of dividend).
  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const currentProject =
    matchedProjects.length > 0
      ? matchedProjects[mod(carouselIdx, matchedProjects.length)]
      : null;
  const advanceCarousel = (dir: 1 | -1) => {
    setCarouselIdx((i) => i + dir);
    setDragDx(0);
  };

  const allCategories = ALL_CATEGORIES;

  const handleSaveUnmatched = () => {
    if (!editingTag) return;
    const skill: Skill = {
      name: editingTag,
      level: editLevel,
      category: editCategory,
      tags: editTags.trim() ? editTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    };
    const skillId = editingTag.toLowerCase().replace(/\s+/g, "-");
    saveToDb("skills", { id: skillId, ...skill, is_user_created: true }).catch(() => { });
    setEditingTag(null);
    setEditCategory("Other");
    setEditLevel(50);
    setEditTags("");
    window.location.reload();
  };

  return (
    // Anchored across the lower portion of the Shadowbox Stage so the papers
    // sit in front of (and on top of) the hills. z=80 (between hills and
    // cluster) so the figure cluster still renders in front of the painted
    // skill list. Top 30% gives the papers a tall enough band that their
    // pixel-offset layout (designed against the 1600x900 stage) fits
    // comfortably without spilling off the bottom of the canvas.
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none"
      style={{ top: "30%", zIndex: 80 }}
    >
      {/* Torn-paper-sheet field: each category is its own absolutely-positioned
          draggable sheet of paper anchored to the centre of the hill band.
          Drag any sheet by its paper body — the skill chips themselves stay
          clickable. Variants cycle through the three paper silhouettes so the
          grouping reads as a stack of scattered notebook pages. The "Other"
          category always renders so users can see where unmatched/new tech
          tags will land, even when currently empty. */}
      <div
        className="relative w-full h-full pointer-events-auto"
        style={{ color: PAPER_INK, overflow: "visible" }}
      >
        {ALL_CATEGORIES.map((cat) => {
          const list = byCategory.get(cat) ?? [];
          // Skip empty non-"Other" categories. Always render "Other" as a
          // visible placeholder so newly-unmatched tags have a clear home.
          if (list.length === 0 && cat !== "Other") return null;
          const cfg = PAPER_DEFAULT_POSITIONS[cat] ?? {
            x: 0, y: 0, variant: 0, widthPx: 360, pinColor: "#c83737",
          };
          const variant = PAPER_VARIANTS[cfg.variant % PAPER_VARIANTS.length];
          return (
            <DraggablePaper
              key={cat}
              category={cat}
              skills={list}
              projects={projects}
              variant={variant}
              widthPx={cfg.widthPx}
              pinColor={cfg.pinColor}
              initialOffset={{ x: cfg.x, y: cfg.y }}
              selectedSkillName={selectedSkillName}
              onSelectSkill={(name: string) =>
                setSelectedSkillName((cur) => (cur === name ? null : name))
              }
              onOffsetChange={(o) => setLiveOffsets((prev) => ({ ...prev, [cat]: o }))}
            />
          );
        })}
        {!selectedSkill && (
          <p
            className="absolute left-1/2 -translate-x-1/2 text-xs italic opacity-60 pointer-events-none"
            style={{ top: "calc(122% + 0.5rem)" }}
          >
            click a skill chip to see matching projects · drag any sheet to rearrange
          </p>
        )}
      </div>

      {/* Projects-for-selected-skill panel. Rendered separately from the
          middle column and anchored to the upper portion of the stage so
          the card list isn't crammed into the same low band as the skill
          chips. */}
      {selectedSkill && (
        <div
          className="pointer-events-auto px-5 py-4 text-left"
          style={{
            // Was `position: fixed` (viewport-anchored). Inside the Stage's
            // CSS-transform-scaled subtree, switching to absolute keeps the
            // panel anchored to the design canvas so it scales with the rest
            // of the scene rather than escaping to viewport pixels.
            position: "absolute",
            top: 0,
            left: "50%",
            // Combine the default centering translate(-50%, 0) with the
            // user-driven panelOffset so the panel can be dragged anywhere.
            transform: `translate(calc(-50% + ${panelOffset.x}px), ${panelOffset.y}px)`,
            width: 640,
            background: PAPER_FILL,
            border: `1.5px solid ${PAPER_STROKE}`,
            borderRadius: "10px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
            color: PAPER_INK,
            zIndex: 90,
            // No CSS transition on transform — we update it directly on
            // every pointermove, which would fight with a transition.
          }}
        >
          {/* Drag handle: header row. Pointer events here only — the card
              body below still owns swipe-to-cycle. `pointerEvents: auto`
              explicit so it isn't lost if a parent is `pointer-events: none`.
              Slight bottom padding gives a chunkier hit target. */}
          <div
            className="flex items-center justify-between mb-2 px-2 py-1 select-none"
            style={{
              cursor: panelDragRef.current ? "grabbing" : "grab",
              touchAction: "none",
              pointerEvents: "auto",
              borderBottom: `1px dashed ${PAPER_STROKE}`,
            }}
            onPointerDown={(e) => {
              if (e.button !== undefined && e.button !== 0) return;
              (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
              panelDragRef.current = {
                pointerId: e.pointerId,
                startClientX: e.clientX,
                startClientY: e.clientY,
                startOffsetX: panelOffset.x,
                startOffsetY: panelOffset.y,
              };
            }}
            onPointerMove={(e) => {
              const drag = panelDragRef.current;
              if (!drag || drag.pointerId !== e.pointerId) return;
              setPanelOffset({
                x: drag.startOffsetX + (e.clientX - drag.startClientX),
                y: drag.startOffsetY + (e.clientY - drag.startClientY),
              });
            }}
            onPointerUp={(e) => {
              if (!panelDragRef.current || panelDragRef.current.pointerId !== e.pointerId) return;
              panelDragRef.current = null;
              (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
            }}
            onPointerCancel={() => {
              panelDragRef.current = null;
            }}
          >
            <p className="text-sm uppercase tracking-wider opacity-80">
              Projects using{" "}
              <span className="font-bold" style={{ color: PAPER_INK_ACCENT }}>
                {selectedSkill.name}
              </span>
            </p>
            <button
              onClick={() => setSelectedSkillName(null)}
              className="p-0.5 cursor-pointer opacity-60 hover:opacity-100"
              aria-label="close"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {matchedProjects.length === 0 || !currentProject ? (
            <p className="text-xs italic opacity-60 px-2">no matching projects yet</p>
          ) : (
            <div className="relative px-2 pb-2">
              {/* Carousel: single card that responds to horizontal swipe.
                  Loops infinitely via modulo indexing. */}
              <div
                className="relative overflow-hidden"
                style={{ touchAction: "pan-y" }}
                onPointerDown={(e) => {
                  if (e.button !== undefined && e.button !== 0) return;
                  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                  dragStartRef.current = { x: e.clientX, pointerId: e.pointerId };
                  setDragDx(0);
                }}
                onPointerMove={(e) => {
                  const start = dragStartRef.current;
                  if (!start || start.pointerId !== e.pointerId) return;
                  setDragDx(e.clientX - start.x);
                }}
                onPointerUp={(e) => {
                  const start = dragStartRef.current;
                  if (!start || start.pointerId !== e.pointerId) return;
                  const dx = e.clientX - start.x;
                  dragStartRef.current = null;
                  (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
                  // Threshold: > 60px in either direction commits to a slide.
                  const SWIPE_THRESHOLD = 60;
                  if (dx <= -SWIPE_THRESHOLD) advanceCarousel(1);
                  else if (dx >= SWIPE_THRESHOLD) advanceCarousel(-1);
                  else setDragDx(0);
                }}
                onPointerCancel={() => {
                  dragStartRef.current = null;
                  setDragDx(0);
                }}
              >
                <div
                  className="p-4 select-none"
                  style={{
                    background: "rgba(255, 250, 235, 0.75)",
                    border: `1px dashed ${PAPER_STROKE}`,
                    borderRadius: "10px",
                    transform: `translateX(${dragDx}px)`,
                    transition: dragStartRef.current ? "none" : "transform 240ms ease-out",
                    cursor: dragStartRef.current ? "grabbing" : "grab",
                  }}
                >
                  <button
                    onClick={() => currentProject.id && router.push(`/project/${currentProject.id}`)}
                    className="text-base font-bold mb-1 cursor-pointer hover:underline text-left"
                    style={{ color: PAPER_INK }}
                  >
                    {currentProject.title}
                  </button>
                  <p className="text-xs mb-2 opacity-80" style={{ color: PAPER_INK }}>
                    {currentProject.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {currentProject.tech.map((t) => {
                      const isMatch = techMatchesSkill(t, selectedSkill);
                      return (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: isMatch ? "rgba(13,58,85,0.18)" : "rgba(31,26,23,0.08)",
                            color: isMatch ? PAPER_INK_ACCENT : PAPER_INK,
                            border: `1px solid ${isMatch ? "rgba(13,58,85,0.35)" : "rgba(31,26,23,0.2)"}`,
                            fontWeight: isMatch ? 700 : 500,
                          }}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    {currentProject.link && (
                      <a
                        href={currentProject.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] flex items-center gap-1"
                        style={{ color: PAPER_INK_ACCENT }}
                      >
                        <ExternalLink className="w-3 h-3" /> Live
                      </a>
                    )}
                    {currentProject.github && (
                      <a
                        href={currentProject.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] flex items-center gap-1"
                        style={{ color: PAPER_INK_ACCENT }}
                      >
                        <Github className="w-3 h-3" /> Code
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Prev / next arrow buttons (only shown when >1 project so the
                  loop is meaningful). */}
              {matchedProjects.length > 1 && (
                <>
                  <button
                    onClick={() => advanceCarousel(-1)}
                    aria-label="previous project"
                    className="absolute top-1/2 -translate-y-1/2 cursor-pointer p-1 hover:scale-110 transition-transform"
                    style={{
                      left: "-1.25rem",
                      background: PAPER_FILL,
                      border: `1.5px solid ${PAPER_STROKE}`,
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      color: PAPER_INK,
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => advanceCarousel(1)}
                    aria-label="next project"
                    className="absolute top-1/2 -translate-y-1/2 cursor-pointer p-1 hover:scale-110 transition-transform"
                    style={{
                      right: "-1.25rem",
                      background: PAPER_FILL,
                      border: `1.5px solid ${PAPER_STROKE}`,
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      color: PAPER_INK,
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Position indicator: "2 / 5" + tiny dot row. */}
              {matchedProjects.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-[10px] opacity-60">
                    {mod(carouselIdx, matchedProjects.length) + 1} / {matchedProjects.length}
                  </span>
                  <div className="flex gap-1">
                    {matchedProjects.map((_, i) => {
                      const active = i === mod(carouselIdx, matchedProjects.length);
                      return (
                        <span
                          key={i}
                          className="block rounded-full transition-all"
                          style={{
                            width: active ? "10px" : "5px",
                            height: "5px",
                            background: active ? PAPER_INK_ACCENT : "rgba(31,26,23,0.3)",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dev paper-position preview (signed-in only). Toggle button hangs in
          the top-left corner of the skills band; when expanded it lists each
          paper's live offset and offers a "Copy block" action that emits the
          updated PAPER_DEFAULT_POSITIONS source ready to paste back into
          this file. */}
      {session && (
        <div
          className="absolute pointer-events-auto"
          style={{ left: 12, top: 12, zIndex: 95 }}
        >
          <button
            onClick={() => setShowDevPreview((v) => !v)}
            className="text-[11px] px-2 py-1 cursor-pointer"
            style={{
              background: PAPER_FILL,
              border: `1.5px solid ${PAPER_STROKE}`,
              borderRadius: 6,
              color: PAPER_INK,
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
            }}
          >
            {showDevPreview ? "hide" : "show"} paper positions
          </button>
          {showDevPreview && (
            <div
              className="mt-2 p-3 text-[11px] space-y-1"
              style={{
                background: PAPER_FILL,
                border: `1.5px solid ${PAPER_STROKE}`,
                borderRadius: 8,
                color: PAPER_INK,
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                maxWidth: 360,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold uppercase tracking-wider">paper positions</span>
                <button
                  onClick={() => {
                    const src = ALL_CATEGORIES.map((cat) => {
                      const def = PAPER_DEFAULT_POSITIONS[cat];
                      if (!def) return null;
                      const live = liveOffsets[cat];
                      const x = Math.round(live?.x ?? def.x);
                      const y = Math.round(live?.y ?? def.y);
                      const padCat = `"${cat}":`.padEnd(26, " ");
                      const padX = `x: ${String(x).padStart(5)}`;
                      const padY = `y: ${String(y).padStart(5)}`;
                      return `  ${padCat} { ${padX}, ${padY}, variant: ${def.variant}, widthPx: ${def.widthPx}, pinColor: "${def.pinColor}" },`;
                    }).filter(Boolean).join("\n");
                    const block = `const PAPER_DEFAULT_POSITIONS: Record<string, { x: number; y: number; variant: number; widthPx: number; pinColor: string }> = {\n${src}\n};`;
                    const panelLine = `// projects panel default: { x: ${Math.round(panelOffset.x)}, y: ${Math.round(panelOffset.y)} }`;
                    navigator.clipboard?.writeText(`${panelLine}\n${block}`);
                  }}
                  className="text-[10px] px-2 py-0.5 cursor-pointer"
                  style={paperOvalStyle(0, false)}
                >
                  copy block
                </button>
              </div>
              {ALL_CATEGORIES.map((cat) => {
                const def = PAPER_DEFAULT_POSITIONS[cat];
                if (!def) return null;
                const live = liveOffsets[cat];
                const x = Math.round(live?.x ?? def.x);
                const y = Math.round(live?.y ?? def.y);
                const moved = live && (Math.round(live.x) !== def.x || Math.round(live.y) !== def.y);
                return (
                  <div
                    key={cat}
                    className="flex items-center gap-2"
                    style={{ opacity: moved ? 1 : 0.7 }}
                  >
                    <span
                      aria-hidden
                      className="inline-block rounded-full"
                      style={{ width: 8, height: 8, background: def.pinColor }}
                    />
                    <span className="flex-1 truncate">{cat}</span>
                    <span style={{ color: moved ? PAPER_INK_ACCENT : PAPER_INK }}>
                      {x.toString().padStart(5)}, {y.toString().padStart(5)}
                    </span>
                  </div>
                );
              })}
              {/* Projects-using-<skill> panel position. Only shows when a
                  skill is selected (the panel only exists then). Defaults
                  are baked into setPanelOffset's initial value above. */}
              {(() => {
                const PANEL_DEFAULT = { x: 694, y: 562 };
                const x = Math.round(panelOffset.x);
                const y = Math.round(panelOffset.y);
                const moved = x !== PANEL_DEFAULT.x || y !== PANEL_DEFAULT.y;
                return (
                  <div
                    className="flex items-center gap-2 mt-2 pt-2"
                    style={{
                      opacity: selectedSkill ? 1 : 0.4,
                      borderTop: `1px dashed ${PAPER_STROKE}`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="inline-block"
                      style={{
                        width: 8,
                        height: 8,
                        background: PAPER_INK_ACCENT,
                        borderRadius: 2,
                      }}
                    />
                    <span className="flex-1 truncate">
                      projects panel{selectedSkill ? ` (${selectedSkill.name})` : " (select a skill)"}
                    </span>
                    <span style={{ color: moved && selectedSkill ? PAPER_INK_ACCENT : PAPER_INK }}>
                      {x.toString().padStart(5)}, {y.toString().padStart(5)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Unmatched tags panel (signed-in only) — spans full width below the
          three columns. Mirrors the Skills.tsx editor: pill row + edit form. */}
      {session && unmatchedTags.length > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto px-4 py-3"
          style={{
            bottom: "1%",
            width: 880,
            background: PAPER_FILL,
            border: `1.5px solid ${PAPER_STROKE}`,
            borderRadius: "52% 48% 46% 54% / 12% 14% 12% 14%",
            color: PAPER_INK,
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
          }}
        >
          <p className="text-xs flex items-center gap-1.5 mb-2 justify-center">
            <Lightbulb className="w-3.5 h-3.5" style={{ color: PAPER_INK_ACCENT }} />
            Unmatched tech tags auto-added as skills. Click to customize:
          </p>
          <div className="flex flex-wrap gap-1.5 mb-1 justify-center">
            {unmatchedTags.map((tag) => {
              const active = editingTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setEditingTag(active ? null : tag);
                    setEditCategory("Other");
                    setEditLevel(50);
                    setEditTags("");
                  }}
                  className="text-[11px] px-2.5 py-0.5 cursor-pointer transition-transform"
                  style={paperOvalStyle(strSeed(tag), active)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {editingTag && (
            <div
              className="mt-3 p-3 space-y-2 text-left"
              style={{
                background: "rgba(255, 250, 235, 0.7)",
                border: `1px dashed ${PAPER_STROKE}`,
                borderRadius: "10px",
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1 opacity-80">Name</label>
                  <input
                    value={editingTag}
                    readOnly
                    className="w-full px-2 py-1 rounded text-xs opacity-70"
                    style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${PAPER_STROKE}`, color: PAPER_INK }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1 opacity-80">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-2 py-1 rounded text-xs focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${PAPER_STROKE}`, color: PAPER_INK }}
                  >
                    {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1 opacity-80">Level: {editLevel}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editLevel}
                  onChange={(e) => setEditLevel(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1 opacity-80">Tags (comma-separated)</label>
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-2 py-1 rounded text-xs focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${PAPER_STROKE}`, color: PAPER_INK }}
                  placeholder="optional extra tags"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveUnmatched}
                  className="text-xs px-3 py-1 cursor-pointer"
                  style={paperOvalStyle(strSeed("save-" + editingTag), true)}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingTag(null)}
                  className="text-xs px-3 py-1 cursor-pointer"
                  style={paperOvalStyle(strSeed("cancel-" + editingTag), false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Wraps a child node and lets the user grab any non-interactive spot inside
// it (i.e. anywhere that isn't a <button> or <a>) to drag the whole block
// around. Position is local state, so each instance is independent. The
// click-vs-drag threshold prevents chip click events from being eaten if the
// user only nudges the cursor a couple pixels. `onOffsetChange` lets the
// parent observe the live offset (currently used for a debug logger).
// One torn-paper sheet rendered as its own independently-draggable card.
// The paper silhouette is the visual background; the inset area (defined by
// `variant.insetTopPct/insetBottomPct/insetLeftPct/insetRightPct`) hosts the
// category title and skill chips so they appear hand-lettered onto the paper.
//
// Drag is initiated by pointer-down on any non-interactive part of the sheet
// (anywhere outside a chip button) — that means the paper body itself is the
// drag handle and chip clicks pass through untouched.
function DraggablePaper({
  category,
  skills,
  projects,
  variant,
  widthPx,
  pinColor,
  initialOffset,
  selectedSkillName,
  onSelectSkill,
  onOffsetChange,
}: {
  category: string;
  skills: Skill[];
  projects: Project[];
  variant: {
    src: string;
    insetTopPct: number;
    insetBottomPct: number;
    insetLeftPct: number;
    insetRightPct: number;
    inkColor: string;
    rotateDeg: number;
  };
  widthPx: number;
  pinColor: string;
  initialOffset: { x: number; y: number };
  selectedSkillName: string | null;
  onSelectSkill: (name: string) => void;
  onOffsetChange?: (offset: { x: number; y: number }) => void;
}) {
  const [offset, setOffset] = useState(initialOffset);
  useEffect(() => {
    onOffsetChange?.(offset);
  }, [offset, onOffsetChange]);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  } | null>(null);
  const DRAG_THRESHOLD_PX = 5;

  // Writable inner area as % of the sheet's bounding box. Used both for
  // positioning the inner content and for deriving a minimum paper height
  // so the sheet auto-grows when more skills are added.
  const innerH = 100 - variant.insetTopPct - variant.insetBottomPct;

  // Estimate the inner content height so the sheet auto-grows when more
  // skills are added. Header line + ceil(skills/3) chip rows * row height,
  // with a comfortable minimum so a near-empty category (like "Other"
  // before any tags drop in) still reads as a real piece of paper.
  const estimatedRows = Math.max(2, Math.ceil(Math.max(skills.length, 1) / 3));
  const estimatedContentHeight = 28 /* header */ + estimatedRows * 32 + 16 /* padding */;
  // Solve: innerH% of paperHeight >= estimatedContentHeight + ~8px breathing room
  const minPaperHeight = Math.ceil((estimatedContentHeight + 8) / (innerH / 100));
  const minPaperWidth = widthPx;

  const isEmpty = skills.length === 0;

  return (
    <div
      className="absolute"
      style={{
        left: "50%",
        top: 0,
        transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px) rotate(${variant.rotateDeg}deg)`,
        width: minPaperWidth,
        minHeight: minPaperHeight,
        touchAction: "none",
        cursor: dragRef.current?.moved ? "grabbing" : "grab",
        filter: "drop-shadow(0 5px 9px rgba(0,0,0,0.4))",
      }}
      onPointerDown={(e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, select, textarea")) return;
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        dragRef.current = {
          pointerId: e.pointerId,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startOffsetX: offset.x,
          startOffsetY: offset.y,
          moved: false,
        };
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        const dx = e.clientX - drag.startClientX;
        const dy = e.clientY - drag.startClientY;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        drag.moved = true;
        setOffset({
          x: drag.startOffsetX + dx,
          y: drag.startOffsetY + dy,
        });
      }}
      onPointerUp={(e) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        dragRef.current = null;
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
    >
      {/* Paper silhouette — fills the bounding box and stretches to match
          the content. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={variant.src}
        alt={`${category} paper sheet`}
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />

      {/* Single push-pin at the top-center of the sheet, with a tiny
          metallic shaft poking out the upper-left of the head so it reads as
          a real pin pierced through the paper. */}
      <Pushpin color={pinColor} top="4px" left="50%" centerX />

      {/* Inset writable area. Positioned inside the paper's deckled edges so
          the text/chips read as hand-painted onto the page. */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          top: `${variant.insetTopPct}%`,
          bottom: `${variant.insetBottomPct}%`,
          left: `${variant.insetLeftPct}%`,
          right: `${variant.insetRightPct}%`,
          padding: "0.4rem 0.5rem 0.55rem 0.5rem",
          overflow: "visible",
        }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.18em] font-bold mb-1.5 text-center select-none"
          style={{
            color: variant.inkColor,
            // Subtle ink-bleed shadow so the hand-painted lettering reads
            // against the warm paper without looking like flat web type.
            textShadow: "0 1px 0 rgba(0,0,0,0.08)",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {category}
        </p>
        {isEmpty ? (
          <p
            className="text-[10px] italic text-center px-2 select-none"
            style={{ color: variant.inkColor, opacity: 0.55 }}
          >
            (new tech tags that don&apos;t match an existing skill land here)
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-1.5 gap-y-1.5 justify-center">
            {skills.map((s) => {
              const active = selectedSkillName === s.name;
              const hasProjects = projectsForSkill(s, projects).length > 0;
              return (
                <button
                  key={s.name}
                  onClick={() => onSelectSkill(s.name)}
                  className="text-[11px] px-2.5 py-0.5 cursor-pointer transition-transform hover:scale-105 inline-flex items-center gap-1"
                  style={paperOvalStyle(strSeed(s.name), active)}
                >
                  <span>{s.name}</span>
                  {hasProjects && (
                    <span
                      aria-hidden
                      className="inline-block rounded-full"
                      style={{
                        width: 5,
                        height: 5,
                        background: active ? PAPER_FILL : PAPER_INK_ACCENT,
                        opacity: active ? 0.9 : 0.7,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// A single CSS-rendered push-pin. The dome is a radial gradient (light
// highlight on top, darker rim) so the pin reads as a glossy hemisphere
// pressed into the paper. A small angled metallic shaft pokes out the
// upper-left of the head, suggesting the pin is actually pierced through
// the paper into the surface behind. Position is set by passing any of
// `top/right/bottom/left`; pass `centerX` to combine `left: 50%` with a
// `translateX(-50%)` so the pin centres horizontally on its anchor.
function Pushpin({
  color,
  top,
  right,
  bottom,
  left,
  centerX = false,
  size = 18,
  rotateDeg = 0,
}: {
  color: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  centerX?: boolean;
  size?: number;
  rotateDeg?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top,
        right,
        bottom,
        left,
        width: size,
        height: size,
        transform: `${centerX ? "translateX(-50%) " : ""}rotate(${rotateDeg}deg)`,
        pointerEvents: "none",
        zIndex: 3,
        // Pin cast-shadow on the paper below.
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.55))",
      }}
    >
      {/* Metallic shaft — short angled silver sliver protruding from the
          upper-left of the head. Renders behind the dome (lower z) so the
          dome appears to sit on top of the pin's stem. */}
      <div
        style={{
          position: "absolute",
          top: `${size * 0.05}px`,
          left: `${size * 0.05}px`,
          width: `${size * 0.55}px`,
          height: `${size * 0.16}px`,
          background:
            "linear-gradient(180deg, #f4f4f4 0%, #c9c9c9 40%, #8a8a8a 80%, #4a4a4a 100%)",
          border: "0.5px solid rgba(0,0,0,0.55)",
          borderRadius: "1px",
          transform: "rotate(-38deg)",
          transformOrigin: "100% 50%",
          boxShadow: "0 1px 1px rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      />
      {/* Pin head — glossy dome. Sits above the metallic shaft. */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.25) 18%, ${color} 50%, rgba(0,0,0,0.45) 100%)`,
          border: "1px solid rgba(0,0,0,0.45)",
          boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.4)",
          zIndex: 2,
        }}
      />
      {/* Tiny inner glint to sell the gloss. */}
      <div
        style={{
          position: "absolute",
          top: `${size * 0.18}px`,
          left: `${size * 0.28}px`,
          width: `${size * 0.22}px`,
          height: `${size * 0.16}px`,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.85)",
          filter: "blur(0.6px)",
          zIndex: 3,
        }}
      />
    </div>
  );
}
