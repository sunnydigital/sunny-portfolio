"use client";

// Resume rendered as a hill-anchored "field journal" book. One page is visible
// at a time; the user advances pages with swipe / arrow buttons. Pagination:
//   0       cover (download PDF + intro)
//   1..N    one Experience entry per page
//   N+1     Education
//   N+2     Certifications + Languages
//   N+3     Interests
//
// Visual aesthetic matches the rest of the paper-cutout scene: cream paper
// "page" with a dashed brown rule, ink text. Pages turn left/right with a
// subtle slide animation.

import { useEffect, useMemo, useRef, useState } from "react";
import { Award, Briefcase, ChevronLeft, ChevronRight, Download, GraduationCap, Heart, Languages } from "lucide-react";
import { loadResumeData, ResumeData } from "@/data/resume";

const PAPER_FILL = "#f5ead2";
const PAPER_STROKE = "#3a2a1e";
const PAPER_INK = "#1f1a17";
const PAPER_INK_ACCENT = "#0d3a55";
const PAPER_INK_DIM = "rgba(31, 26, 23, 0.65)";

type Page =
  | { kind: "cover" }
  | { kind: "experience"; index: number }
  | { kind: "education" }
  | { kind: "credentials" }
  | { kind: "interests" };

function buildPages(data: ResumeData): Page[] {
  const pages: Page[] = [{ kind: "cover" }];
  data.experience.forEach((_, i) => pages.push({ kind: "experience", index: i }));
  pages.push({ kind: "education" });
  pages.push({ kind: "credentials" });
  pages.push({ kind: "interests" });
  return pages;
}

export default function ResumeJournal() {
  const [data, setData] = useState<ResumeData | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [dragDx, setDragDx] = useState(0);
  const dragStartRef = useRef<{ x: number; pointerId: number } | null>(null);

  // Journal panel position; draggable on the hill. The user can also drag the
  // book itself around so it doesn't fight with foreground cluster elements.
  const [panelOffset, setPanelOffset] = useState({ x: 5, y: 315 });
  const panelDragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  useEffect(() => {
    setData(loadResumeData());
  }, []);

  const pages = useMemo(() => (data ? buildPages(data) : []), [data]);
  if (!data || pages.length === 0) return null;

  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const advance = (dir: 1 | -1) => {
    setPageIdx((i) => i + dir);
    setDragDx(0);
  };
  const page = pages[mod(pageIdx, pages.length)];

  return (
    <div
      className="pointer-events-auto text-left"
      style={{
        position: "fixed",
        top: "32vh",
        left: "50%",
        transform: `translate(calc(-50% + ${panelOffset.x}px), ${panelOffset.y}px)`,
        width: "min(60vw, 720px)",
        background: PAPER_FILL,
        border: `1.5px solid ${PAPER_STROKE}`,
        borderRadius: "10px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        color: PAPER_INK,
        zIndex: 90,
      }}
    >
      {/* Drag handle / page header */}
      <div
        className="flex items-center justify-between mb-2 px-4 pt-3 pb-2 select-none"
        style={{
          cursor: panelDragRef.current ? "grabbing" : "grab",
          touchAction: "none",
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
        <p className="text-xs uppercase tracking-[0.18em] font-bold" style={{ color: PAPER_INK_ACCENT }}>
          Field Journal
        </p>
        <p className="text-[10px] opacity-60">
          page {mod(pageIdx, pages.length) + 1} / {pages.length}
        </p>
      </div>

      {/* Page body — swipe-driven carousel */}
      <div className="relative px-4 pb-4">
        <div
          className="relative overflow-hidden"
          style={{ touchAction: "pan-y" }}
          onPointerDown={(e) => {
            if (e.button !== undefined && e.button !== 0) return;
            const target = e.target as HTMLElement;
            if (target.closest("a, button")) return;
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
            const SWIPE_THRESHOLD = 60;
            if (dx <= -SWIPE_THRESHOLD) advance(1);
            else if (dx >= SWIPE_THRESHOLD) advance(-1);
            else setDragDx(0);
          }}
          onPointerCancel={() => {
            dragStartRef.current = null;
            setDragDx(0);
          }}
        >
          <div
            className="select-none"
            style={{
              transform: `translateX(${dragDx}px)`,
              transition: dragStartRef.current ? "none" : "transform 240ms ease-out",
              cursor: dragStartRef.current ? "grabbing" : "default",
              minHeight: "36vh",
              maxHeight: "52vh",
              overflowY: "auto",
              scrollbarWidth: "thin",
              paddingRight: "0.25rem",
            }}
          >
            <PageContent page={page} data={data} />
          </div>
        </div>

        {/* Prev / next arrows */}
        {pages.length > 1 && (
          <>
            <button
              onClick={() => advance(-1)}
              aria-label="previous page"
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
              onClick={() => advance(1)}
              aria-label="next page"
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

        {/* Page dots */}
        {pages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {pages.map((_, i) => {
              const active = i === mod(pageIdx, pages.length);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setPageIdx(i);
                    setDragDx(0);
                  }}
                  className="block rounded-full transition-all cursor-pointer"
                  style={{
                    width: active ? "12px" : "6px",
                    height: "6px",
                    background: active ? PAPER_INK_ACCENT : "rgba(31,26,23,0.3)",
                    border: 0,
                  }}
                  aria-label={`go to page ${i + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PageContent({ page, data }: { page: Page; data: ResumeData }) {
  if (page.kind === "cover") {
    return (
      <div className="text-center py-4">
        <h3 className="text-xl font-bold mb-2" style={{ color: PAPER_INK_ACCENT }}>
          Field Journal of a Data Scientist
        </h3>
        <p className="text-sm mb-1" style={{ color: PAPER_INK }}>
          Notes from the trail —
        </p>
        <p className="text-xs mb-6" style={{ color: PAPER_INK_DIM }}>
          experiences, study, credentials, and pastimes.
        </p>
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 cursor-pointer transition-transform hover:scale-105"
          style={{
            background: PAPER_INK_ACCENT,
            color: PAPER_FILL,
            border: `1.5px solid ${PAPER_STROKE}`,
            borderRadius: "9999px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
          }}
        >
          <Download className="w-3 h-3" /> Download full PDF
        </a>
        <p className="text-[10px] italic opacity-60 mt-5">
          swipe or use the arrows to turn the page
        </p>
      </div>
    );
  }

  if (page.kind === "experience") {
    const exp = data.experience[page.index];
    return (
      <div>
        <SectionHeader icon={<Briefcase className="w-4 h-4" />} label="Experience" />
        <h4 className="font-bold text-base" style={{ color: PAPER_INK }}>
          {exp.title}
        </h4>
        <p className="text-xs font-semibold mb-0.5" style={{ color: PAPER_INK_ACCENT }}>
          {exp.company} · {exp.location}
        </p>
        <p className="text-[10px] italic mb-3" style={{ color: PAPER_INK_DIM }}>
          {exp.period}
        </p>
        <ul className="space-y-1.5">
          {exp.bullets.map((b, j) => (
            <li key={j} className="text-xs flex gap-2" style={{ color: PAPER_INK }}>
              <span
                className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full"
                style={{ background: PAPER_INK_ACCENT }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (page.kind === "education") {
    return (
      <div>
        <SectionHeader icon={<GraduationCap className="w-4 h-4" />} label="Education" />
        <div className="space-y-4">
          {data.education.map((edu, i) => (
            <div key={i}>
              <h4 className="font-bold text-sm" style={{ color: PAPER_INK }}>
                {edu.degree}
              </h4>
              <p className="text-xs font-semibold" style={{ color: PAPER_INK_ACCENT }}>
                {edu.school}
              </p>
              <p className="text-[10px] italic" style={{ color: PAPER_INK_DIM }}>
                {edu.period}
              </p>
              <p className="text-xs mt-0.5" style={{ color: PAPER_INK }}>
                {edu.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page.kind === "credentials") {
    return (
      <div>
        <SectionHeader icon={<Award className="w-4 h-4" />} label="Credentials" />
        <div className="space-y-3 mb-5">
          {data.certifications.map((c, i) => (
            <div key={i}>
              {c.url ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold hover:underline"
                  style={{ color: PAPER_INK_ACCENT }}
                >
                  {c.title}
                </a>
              ) : (
                <span className="text-xs font-bold" style={{ color: PAPER_INK }}>
                  {c.title}
                </span>
              )}
              <p className="text-[10px]" style={{ color: PAPER_INK_DIM }}>
                {c.org}
              </p>
            </div>
          ))}
        </div>
        <SectionHeader icon={<Languages className="w-4 h-4" />} label="Languages" />
        <ul className="space-y-1">
          {data.languages.map((l) => (
            <li key={l.lang} className="text-xs flex gap-2" style={{ color: PAPER_INK }}>
              <span className="font-semibold">{l.lang}</span>
              <span style={{ color: PAPER_INK_DIM }}>— {l.level}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (page.kind === "interests") {
    return (
      <div>
        <SectionHeader icon={<Heart className="w-4 h-4" />} label="Interests" />
        <p className="text-xs italic mb-3" style={{ color: PAPER_INK_DIM }}>
          things I get up to when the laptop is closed
        </p>
        <div className="flex flex-wrap gap-1.5">
          {data.interests.map((interest) => (
            <span
              key={interest}
              className="text-[11px] px-2.5 py-0.5"
              style={{
                background: PAPER_FILL,
                border: `1px solid ${PAPER_STROKE}`,
                borderRadius: "9999px",
                color: PAPER_INK,
                boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              }}
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span style={{ color: PAPER_INK_ACCENT }}>{icon}</span>
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold" style={{ color: PAPER_INK_ACCENT }}>
        {label}
      </p>
    </div>
  );
}
