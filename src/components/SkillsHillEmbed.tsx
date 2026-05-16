"use client";

// Skills embedded onto the front hill. Single-column stacked list of all
// categories (Programming Languages → Other), with paper-oval chips for each
// skill. Selecting a skill opens a horizontal carousel of matching projects
// anchored at the top of the viewport (swipe / arrow buttons / infinite loop).

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, ExternalLink, Github, Lightbulb, X } from "lucide-react";
import { Skill, Project } from "@/types";
import { saveToDb } from "@/lib/db";

// Single ordered list of categories rendered top → bottom inside one
// draggable stack. Also used by the unmatched-tag editor's Category dropdown.
const ALL_CATEGORIES = [
  "Programming Languages",
  "AI / ML Frameworks",
  "Data & Compute",
  "Cloud & Infrastructure",
  "MLOps & Tools",
  "Specializations",
  "Other",
];

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
  const [panelOffset, setPanelOffset] = useState({ x: 504, y: 211 });
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
    setPanelOffset({ x: 504, y: 211 });
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
    // Anchored to the front hill: bottom-aligned, full width, top 50vh from
    // the page top. z=80 (between hills and cluster) so the cluster still
    // renders in front of the embedded text, like the figure is silhouetted
    // against the painted skill list.
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none"
      style={{ top: "76vh", zIndex: 80 }}
    >
      {/* Single stacked list of all categories inside one draggable wrapper.
          Easier to manage than two independent columns. */}
      <div
        className="relative w-full h-full pl-[20vw] pr-[4vw] pt-[3vh] pb-[8vh] pointer-events-auto"
        style={{ color: PAPER_INK, overflow: "visible" }}
      >
        <DraggableStack initialOffset={{ x: 140, y: -190 }}>
          <SkillsList
            categories={ALL_CATEGORIES}
            byCategory={byCategory}
            selectedSkillName={selectedSkillName}
            onSelect={(name) => setSelectedSkillName((cur) => (cur === name ? null : name))}
            projects={projects}
          />
        </DraggableStack>
        {!selectedSkill && (
          <p className="text-xs italic opacity-60 mt-3 text-center">
            click a skill to see matching projects
          </p>
        )}
      </div>

      {/* Projects-for-selected-skill panel. Rendered separately from the
          middle column and anchored to the upper portion of the viewport so
          the card list isn't crammed into the same low band as the skill
          chips. position: fixed bypasses the parent's `top: 76vh`. */}
      {selectedSkill && (
        <div
          className="pointer-events-auto px-5 py-4 text-left"
          style={{
            position: "fixed",
            top: "60vh",
            left: "50%",
            // Combine the default centering translate(-50%, 0) with the
            // user-driven panelOffset so the panel can be dragged anywhere.
            transform: `translate(calc(-50% + ${panelOffset.x}px), ${panelOffset.y}px)`,
            width: "min(56vw, 640px)",
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

      {/* Unmatched tags panel (signed-in only) — spans full width below the
          three columns. Mirrors the Skills.tsx editor: pill row + edit form. */}
      {session && unmatchedTags.length > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto px-4 py-3"
          style={{
            bottom: "1vh",
            width: "min(64vw, 880px)",
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
function DraggableStack({
  children,
  onOffsetChange,
  initialOffset,
}: {
  children: React.ReactNode;
  onOffsetChange?: (x: number, y: number) => void;
  initialOffset?: { x: number; y: number };
}) {
  const [offset, _setOffset] = useState(initialOffset ?? { x: 0, y: 0 });
  const setOffset = (o: { x: number; y: number }) => {
    _setOffset(o);
    onOffsetChange?.(o.x, o.y);
  };
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
    moved: boolean;
  } | null>(null);
  const DRAG_THRESHOLD_PX = 5;

  return (
    <div
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        touchAction: "none",
        cursor: dragRef.current?.moved ? "grabbing" : "grab",
      }}
      onPointerDown={(e) => {
        if (e.button !== undefined && e.button !== 0) return;
        // Skip when the press originated on a real interactive element so
        // chip clicks aren't hijacked.
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
      {children}
    </div>
  );
}

function SkillsList({
  categories,
  byCategory,
  selectedSkillName,
  onSelect,
  projects,
}: {
  categories: string[];
  byCategory: Map<string, Skill[]>;
  selectedSkillName: string | null;
  onSelect: (name: string) => void;
  projects: Project[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => {
        const list = byCategory.get(cat);
        if (!list || list.length === 0) return null;
        return (
          <div key={cat}>
            <p
              className="text-[11px] uppercase tracking-[0.2em] font-bold mb-2 text-left"
              style={{ color: PAPER_INK_ACCENT }}
            >
              {cat}
            </p>
            <div className="flex flex-wrap gap-x-2 gap-y-2">
              {list.map((s) => {
                const active = selectedSkillName === s.name;
                const hasProjects = projectsForSkill(s, projects).length > 0;
                return (
                  <button
                    key={s.name}
                    onClick={() => onSelect(s.name)}
                    className="text-xs px-3 py-1 cursor-pointer transition-transform hover:scale-105 inline-flex items-center gap-1.5"
                    style={paperOvalStyle(strSeed(s.name), active)}
                  >
                    <span>{s.name}</span>
                    {hasProjects && (
                      <span
                        aria-hidden
                        className="inline-block rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: active ? PAPER_FILL : PAPER_INK_ACCENT,
                          opacity: active ? 0.9 : 0.7,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
