"use client";

// Resume rendered as a hill-anchored "field journal" book. The book starts
// CLOSED on its front leather cover; clicking the right edge opens it.
// react-pageflip handles real page-turn physics. Following the simpler
// pattern from Hank-D-Tank/react-page-flip: each page is a plain <div className="page">
// with content inside — no forwardRef wrappers, no data-density attributes,
// no per-page state machinery. CSS styles each page and cover.

import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { Award, Briefcase, Download, GraduationCap, Heart, Languages } from "lucide-react";
import { loadResumeData, ResumeData } from "@/data/resume";

const PAPER_FILL = "#f5ead2";
const PAPER_STROKE = "#3a2a1e";
const PAPER_INK = "#1f1a17";
const PAPER_INK_ACCENT = "#0d3a55";
const PAPER_INK_DIM = "rgba(31, 26, 23, 0.65)";

type Page =
  | { kind: "intro" }
  | { kind: "experience"; index: number }
  | { kind: "education" }
  | { kind: "credentials" }
  | { kind: "interests" };

function buildContentPages(data: ResumeData): Page[] {
  const pages: Page[] = [{ kind: "intro" }];
  data.experience.forEach((_, i) => pages.push({ kind: "experience", index: i }));
  pages.push({ kind: "education" });
  pages.push({ kind: "credentials" });
  pages.push({ kind: "interests" });
  return pages;
}

const BOOK_WIDTH = 460;
const BOOK_HEIGHT = 620;

function padToEven<T>(items: T[], filler: T): T[] {
  return items.length % 2 === 0 ? items : [...items, filler];
}

export default function ResumeJournal() {
  const [data, setData] = useState<ResumeData | null>(null);
  const flipBookRef = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void; getCurrentPageIndex: () => number; getPageCount: () => number } } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 250 });
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

  if (!data) return null;

  const contentPages = buildContentPages(data);
  const paddedContent = padToEven<Page | "blank">(contentPages, "blank");
  // Page count inside the flipbook:
  //   front cover + inside-front blank + paddedContent + inside-back blank + back cover.
  const totalPages = 1 + 1 + paddedContent.length + 1 + 1;
  // Closed states: front cover visible on the right (page 0), back cover
  // visible on the left (last page index).
  const closedFront = currentPage <= 0;
  const closedBack = currentPage >= totalPages - 1;
  const isClosed = closedFront || closedBack;

  return (
    <div
      className="pointer-events-auto"
      style={{
        position: "fixed",
        top: "30vh",
        left: "50%",
        // Two-page spread layout — wrapper is twice the page width.
        width: BOOK_WIDTH * 2,
        height: BOOK_HEIGHT,
        // When closed, only one page is visible (front on the right, back on
        // the left). Shift the wrapper so that visible page sits in the
        // viewport center. When open, the spread is naturally centered.
        transform: `translate(calc(-50% + ${panelOffset.x + (closedFront ? -BOOK_WIDTH / 2 : closedBack ? BOOK_WIDTH / 2 : 0)
          }px), ${panelOffset.y}px)`,
        transition: isClosed ? "transform 350ms ease 200ms" : "transform 350ms ease",
        zIndex: 90,
        filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.45))",
      }}
    >
      {/* Per-component styles for pages + leather covers. Scoped via the
          `.resume-journal` parent class to avoid colliding with anything else. */}
      <style>{`
        .resume-journal .page {
          background: ${PAPER_FILL};
          color: ${PAPER_INK};
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .resume-journal .page-content {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 1.4rem 1.2rem;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
          word-break: break-word;
          overflow-wrap: break-word;
          scrollbar-width: thin;
        }
        .resume-journal .cover {
          background-color: #4a2e1a;
          background-image:
            radial-gradient(120% 120% at 30% 25%, rgba(255,235,200,0.10) 0%, rgba(0,0,0,0) 45%),
            radial-gradient(140% 140% at 80% 95%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 60%),
            repeating-radial-gradient(circle at 30% 30%, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px),
            linear-gradient(135deg, #6a4427 0%, #4a2e1a 50%, #5b3a22 100%);
          color: #f5ead2;
          /* width/height 100% needed because react-pageflip's hardpage
             wrapper doesn't force the page's own box to fill it — without
             these the cover collapses to its content height and the
             title plate sits near the top instead of centering. */
          width: 100%;
          height: 100%;
          display: flex;
          align-items: stretch;
          overflow: hidden;
        }
        /* Directional shadow per cover side (front gets shadow on its inner
           (spine) edge from the LEFT; back from the right) — matches the PIMR
           pattern, gives the cover a sense of weight & direction during flip. */
        .resume-journal .cover.front {
          box-shadow:
            inset 0 0 30px rgba(36,10,3,0.5),
            -2px 0 5px 2px rgba(0,0,0,0.4);
        }
        .resume-journal .cover.back {
          flex-direction: row-reverse;
          box-shadow:
            inset 0 0 30px rgba(36,10,3,0.5),
            10px 0 8px 0px rgba(0,0,0,0.4);
        }
        .resume-journal .cover-spine {
          flex: 0 0 12%;
          position: relative;
          background: linear-gradient(90deg, #2c1c10 0%, #3e2814 35%, #4a3220 60%, rgba(0,0,0,0.4) 100%);
          box-shadow: inset -2px 0 6px rgba(0,0,0,0.6);
        }
        .resume-journal .cover.back .cover-spine {
          background: linear-gradient(270deg, #2c1c10 0%, #3e2814 35%, #4a3220 60%, rgba(0,0,0,0.4) 100%);
          box-shadow: inset 2px 0 6px rgba(0,0,0,0.6);
        }
        .resume-journal .cover-band {
          position: absolute; left: 0; right: 0; height: 12px;
          background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(255,220,180,0.10) 45%, rgba(0,0,0,0.55) 100%);
          box-shadow: 0 1px 1px rgba(0,0,0,0.5);
        }
        .resume-journal .cover-body {
          flex: 1 1 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .resume-journal .cover-plate {
          width: 85%;
          padding: 0.4rem 1.2rem;
          text-align: center;
          font-family: Georgia, 'Times New Roman', serif;
        }
        /* Embossed gold lettering: a base gold gradient + animated shimmer
           sweep gives the glittery look without a heavy texture. */
        .resume-journal .cover-plate .title,
        .resume-journal .cover-plate .name {
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          line-height: 1.15;
          background: linear-gradient(
            100deg,
            #a87726 0%,
            #f6d56b 20%,
            #fff3b8 35%,
            #f6d56b 50%,
            #a87726 70%,
            #fff3b8 85%,
            #a87726 100%
          );
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          text-shadow:
            0 1px 0 rgba(60,40,10,0.35),
            0 0 8px rgba(255,215,120,0.18);
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.55));
          animation: cover-glitter 10s linear infinite;
        }
        .resume-journal .cover-plate .title {
          font-size: 1.45rem;
        }
        .resume-journal .cover-plate .subtitle {
          margin-top: 0.55rem;
          font-size: 0.82rem;
          font-style: italic;
          letter-spacing: 0.06em;
          color: #d4a94a;
          opacity: 0.9;
          text-shadow: 0 1px 1px rgba(0,0,0,0.45);
        }
        .resume-journal .cover-plate .divider {
          margin: 0.9rem auto 0.7rem auto;
          width: 38%;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(214,170,80,0.85) 50%, transparent 100%);
        }
        .resume-journal .cover-plate .name {
          font-size: 1.05rem;
          letter-spacing: 0.22em;
        }
        @keyframes cover-glitter {
          0%   { background-position: 0% 50%; }
          100% { background-position: 220% 50%; }
        }
      `}</style>

      {/* Open-book chrome removed: with usePortrait=true the book renders as
          a single page at a time, so the two-page-spread cream backdrop and
          center gutter shadow no longer apply. Each page now carries its own
          background via the .page CSS class. */}


      {/* Drag handle */}
      <div
        className="select-none"
        style={{
          position: "absolute",
          top: "-1.5rem",
          left: 0,
          right: 0,
          height: "1.5rem",
          cursor: panelDragRef.current ? "grabbing" : "grab",
          touchAction: "none",
          zIndex: 2,
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
        title="drag to move"
      />

      <div className="resume-journal">
        <HTMLFlipBook
          ref={flipBookRef}
          width={BOOK_WIDTH}
          height={BOOK_HEIGHT}
          size="fixed"
          minWidth={340}
          maxWidth={620}
          minHeight={460}
          maxHeight={840}
          showCover={true}
          usePortrait={false}
          mobileScrollSupport={true}
          flippingTime={500}
          maxShadowOpacity={0.5}
          drawShadow={true}
          startPage={0}
          useMouseEvents={true}
          clickEventForward={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
          startZIndex={0}
          autoSize={false}
          renderOnlyPageLengthChange={false}
          className=""
          style={{ position: "relative", zIndex: 1 }}
          onFlip={(e: { data: number }) => {
            setCurrentPage(e.data ?? 0);
          }}
        >
          {/* Front cover — title plate lives inside the cover-body so it
              rotates with the page during the flip. No onClick handler here:
              react-pageflip's own click-to-turn handles opening. */}
          <div className="page cover front">
            <div className="cover-spine">
              <div className="cover-band" style={{ top: "calc(28% - 6px)" }} />
              <div className="cover-band" style={{ top: "calc(72% - 6px)" }} />
            </div>
            <div className="cover-body">
              <div className="cover-plate">
                <div className="title">Field Journal</div>
                <div className="subtitle">of a Curious Human</div>
                <div className="divider" />
                <div className="name">Sunny Son</div>
              </div>
            </div>
          </div>

          {/* Inside front cover (blank). Pairs with the hard front cover so
              the first content page lands on the right side of the next spread. */}
          <div className="page" key="inside-front">
            <div className="page-content" />
          </div>

          {/* Content pages */}
          {paddedContent.map((page, i) => (
            <div className="page" key={i}>
              <div className="page-content">
                {page === "blank" ? null : <PageContent page={page} data={data} />}
              </div>
            </div>
          ))}

          {/* Inside back cover (blank) */}
          <div className="page" key="inside-back">
            <div className="page-content" />
          </div>

          {/* Back cover */}
          <div className="page cover back">
            <div className="cover-spine">
              <div className="cover-band" style={{ top: "calc(28% - 6px)" }} />
              <div className="cover-band" style={{ top: "calc(72% - 6px)" }} />
            </div>
            <div className="cover-body" />
          </div>
        </HTMLFlipBook>
      </div>

      {/* Hint shown only at the front cover */}
      {closedFront && (
        <div
          className="absolute pointer-events-none text-center select-none"
          style={{
            bottom: "-1.5rem",
            left: 0,
            right: 0,
            color: PAPER_INK_DIM,
            fontSize: "10px",
            fontStyle: "italic",
            opacity: 0.7,
          }}
        >
          click to open the journal
        </div>
      )}
    </div>
  );
}

function PageContent({ page, data }: { page: Page; data: ResumeData }) {
  if (page.kind === "intro") {
    return (
      <div className="text-center py-4">
        <h3 className="text-xl font-bold mb-2" style={{ color: PAPER_INK_ACCENT }}>
          Field Journal of a Curious Human
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
          turn the page to read on
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
