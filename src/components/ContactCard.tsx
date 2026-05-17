"use client";

// Contact section rendered as a vintage postcard: cream paper, a perforated
// stamp in the top-right, postmark rings, an "address" column with social
// links, and a "message" column with the contact form. Acts as the
// paper-cutout counterpart to the Resume journal.

import { useRef, useState } from "react";
import { BookOpen, Github, Linkedin, Mail, Send } from "lucide-react";

const PAPER_FILL = "#f5ead2";
const PAPER_STROKE = "#3a2a1e";
const PAPER_INK = "#1f1a17";
const PAPER_INK_ACCENT = "#0d3a55";
const PAPER_INK_DIM = "rgba(31, 26, 23, 0.65)";
const STAMP_RED = "#a8323a";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/sunnydigital", icon: Github },
  { label: "LinkedIn", href: "https://linkedin.com/in/sunny-son", icon: Linkedin },
  { label: "Scholar", href: "https://scholar.google.com/citations?user=sunny-son", icon: BookOpen },
  { label: "Email", href: "mailto:sunnys2327@gmail.com", icon: Mail },
];

export default function ContactCard() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  // Draggable position: user grabs the header strip and the whole card follows.
  const [panelOffset, setPanelOffset] = useState({ x: 4, y: 280 });
  const panelDragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio Contact from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:sunnys2327@gmail.com?subject=${subject}&body=${body}`;
  };

  const inputClass =
    "w-full px-2.5 py-1.5 text-xs focus:outline-none transition-colors";
  const inputStyle = {
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${PAPER_STROKE}`,
    color: PAPER_INK,
    fontFamily: "Georgia, 'Times New Roman', serif",
  };

  return (
    <div
      className="pointer-events-auto text-left"
      style={{
        position: "fixed",
        top: "30vh",
        left: "50%",
        transform: `translate(calc(-50% + ${panelOffset.x}px), ${panelOffset.y}px)`,
        width: "min(64vw, 720px)",
        // Postcard aspect ≈ 7:5 — slightly wider than tall, like a real card.
        aspectRatio: "7 / 5",
        maxHeight: "62vh",
        background: PAPER_FILL,
        // Subtle paper grain + warm vignette + tilted shadow give the
        // postcard a hand-held feel without overwhelming the form fields.
        backgroundImage: `
          radial-gradient(160% 120% at 50% 50%, rgba(255,250,235,0) 60%, rgba(120,80,40,0.18) 100%),
          repeating-linear-gradient(45deg, rgba(120,80,40,0.025) 0px, rgba(120,80,40,0.025) 1px, transparent 1px, transparent 5px),
          linear-gradient(180deg, #f8efd6 0%, #f0e3c1 100%)
        `,
        border: `1.5px solid ${PAPER_STROKE}`,
        borderRadius: "4px",
        boxShadow: "0 12px 28px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)",
        color: PAPER_INK,
        zIndex: 90,
        overflow: "hidden",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Postcard back layout: left column (sender/message area) and right
          column (stamp + address area), separated by a thin vertical rule. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "1.2fr 1px 1fr",
          padding: "1.1rem 1.2rem 0.9rem 1.2rem",
        }}
      >
        {/* ─── Message column (left) ─────────────────────────────────────── */}
        <div className="flex flex-col h-full min-h-0">
          {/* Heading — also acts as the drag handle for repositioning the card. */}
          <div
            className="select-none pb-1 mb-2"
            style={{
              borderBottom: `1px dashed ${PAPER_STROKE}`,
              cursor: panelDragRef.current ? "grabbing" : "grab",
              touchAction: "none",
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
            <p
              className="text-[10px] uppercase tracking-[0.22em] font-bold"
              style={{ color: PAPER_INK_ACCENT }}
            >
              From the trail —
            </p>
            <p className="text-sm italic mt-0.5" style={{ color: PAPER_INK }}>
              Drop a line
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className={inputClass}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className={inputClass}
              style={inputStyle}
            />
            <textarea
              placeholder="Your message..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              className={inputClass + " flex-1 resize-none"}
              style={{ ...inputStyle, minHeight: "60px" }}
            />
            <div className="flex items-center justify-between mt-1.5" style={{ paddingRight: "0.5rem" }}>
              <span
                className="text-[10px] italic"
                style={{ color: PAPER_INK_DIM, fontFamily: "Georgia, serif" }}
              >
                — I read everything that comes in.
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 cursor-pointer transition-transform hover:scale-105"
                style={{
                  background: PAPER_INK_ACCENT,
                  color: PAPER_FILL,
                  border: `1.5px solid ${PAPER_STROKE}`,
                  borderRadius: "9999px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontFamily: "Georgia, serif",
                }}
              >
                <Send className="w-3 h-3" />
                Send
              </button>
            </div>
          </form>
        </div>

        {/* ─── Vertical divider (postcard rule) ──────────────────────────── */}
        <div
          aria-hidden
          style={{
            background: PAPER_STROKE,
            opacity: 0.55,
            margin: "0.4rem 0",
          }}
        />

        {/* ─── Address / stamp column (right) ────────────────────────────── */}
        <div
          className="relative flex flex-col h-full"
          style={{ paddingLeft: "0.9rem" }}
        >
          {/* Stamp — perforated edge via filter:url-less mask; here we use
              a stepped radial-gradient repeating along all four sides to
              approximate perforation cheaply without an SVG. */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "78px",
              height: "92px",
              padding: "4px",
              background: PAPER_FILL,
              backgroundImage: `radial-gradient(circle at 4px 4px, ${PAPER_FILL} 3px, transparent 3.5px)`,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              transform: "rotate(3deg)",
              transformOrigin: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(160deg, ${STAMP_RED} 0%, #862229 100%)`,
                border: `1px solid rgba(0,0,0,0.4)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: PAPER_FILL,
                textAlign: "center",
                padding: "4px",
                boxShadow: "inset 0 0 6px rgba(0,0,0,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: 0.85,
                }}
              >
                Curious
              </span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  lineHeight: 1,
                  margin: "2px 0",
                  fontFamily: "Georgia, serif",
                }}
              >
                ✦
              </span>
              <span
                style={{
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: 0.85,
                }}
              >
                Human
              </span>
            </div>
          </div>

          {/* Postmark — concentric arcs overlapping the stamp's lower-left. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "76px",
              right: "62px",
              width: "84px",
              height: "84px",
              border: `1.2px solid ${PAPER_INK}`,
              opacity: 0.35,
              borderRadius: "50%",
              transform: "rotate(-12deg)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "84px",
              right: "70px",
              width: "68px",
              height: "68px",
              border: `1px dashed ${PAPER_INK}`,
              opacity: 0.3,
              borderRadius: "50%",
              transform: "rotate(-12deg)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "108px",
              right: "78px",
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: PAPER_INK,
              opacity: 0.5,
              transform: "rotate(-12deg)",
              pointerEvents: "none",
              fontFamily: "Georgia, serif",
            }}
          >
            ✦ NYC · 2026 ✦
          </div>

          {/* Address block — pushed below the stamp area. */}
          <div style={{ marginTop: "120px" }}>
            <p
              className="text-[10px] uppercase tracking-[0.22em] font-bold mb-2"
              style={{ color: PAPER_INK_ACCENT }}
            >
              Or find me at —
            </p>
            <div className="flex flex-col gap-1.5">
              {SOCIAL_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs hover:underline"
                    style={{
                      color: PAPER_INK,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: PAPER_INK_ACCENT }} />
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Signature line + visitor badge — bottom-right corner of the postcard. */}
      <div
        style={{
          position: "absolute",
          bottom: "6px",
          right: "10px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          pointerEvents: "auto",
        }}
      >
        <p
          className="text-[10px]"
          style={{
            color: PAPER_INK_DIM,
            fontFamily: "Georgia, 'Times New Roman', serif",
            margin: 0,
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>&lt;/&gt;</span>{" "}
          with ❤️, Three.js, and ☕️ by{" "}
          <a
            href="https://www.linkedin.com/in/sunny-son/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: PAPER_INK_ACCENT }}
          >
            Sunny Son
          </a>
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://visitor-badge.laobi.icu/badge?page_id=sunnyson.dev.v2"
          alt="visitor count"
          style={{ height: "16px", opacity: 0.7 }}
        />
      </div>
    </div>
  );
}
