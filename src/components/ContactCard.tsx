"use client";

// All-in-one paper-cutout card for the Contact section: combines the contact
// form, social links, and footer signature into a single panel anchored on the
// hill. Matches the aesthetic of the Skills "Projects using" card and the
// Resume journal.

import { useRef, useState } from "react";
import { BookOpen, Github, Linkedin, Mail, Send } from "lucide-react";

const PAPER_FILL = "#f5ead2";
const PAPER_STROKE = "#3a2a1e";
const PAPER_INK = "#1f1a17";
const PAPER_INK_ACCENT = "#0d3a55";
const PAPER_INK_DIM = "rgba(31, 26, 23, 0.65)";

const SOCIAL_LINKS = [
  { label: "GitHub", href: "https://github.com/sunnydigital", icon: Github },
  { label: "LinkedIn", href: "https://linkedin.com/in/sunny-son", icon: Linkedin },
  { label: "Google Scholar", href: "https://scholar.google.com/citations?user=sunny-son", icon: BookOpen },
  { label: "Email", href: "mailto:sunnys2327@gmail.com", icon: Mail },
];

export default function ContactCard() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  // Draggable position: user grabs the header strip and the whole card follows.
  const [panelOffset, setPanelOffset] = useState({ x: 4, y: 354 });
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
    "w-full px-3 py-2 rounded text-xs focus:outline-none transition-colors";
  const inputStyle = {
    background: "rgba(255, 250, 235, 0.7)",
    border: `1px solid ${PAPER_STROKE}`,
    color: PAPER_INK,
  };

  return (
    <div
      className="pointer-events-auto text-left px-5 py-4"
      style={{
        position: "fixed",
        top: "30vh",
        left: "50%",
        transform: `translate(calc(-50% + ${panelOffset.x}px), ${panelOffset.y}px)`,
        width: "min(56vw, 600px)",
        maxHeight: "60vh",
        overflowY: "auto",
        background: PAPER_FILL,
        border: `1.5px solid ${PAPER_STROKE}`,
        borderRadius: "10px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        color: PAPER_INK,
        zIndex: 90,
      }}
    >
      {/* Heading — also acts as the drag handle for repositioning the card. */}
      <div
        className="mb-3 pb-2 select-none"
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
        <p className="text-xs uppercase tracking-[0.18em] font-bold" style={{ color: PAPER_INK_ACCENT }}>
          Drop a line
        </p>
        <p className="text-[11px] italic mt-0.5" style={{ color: PAPER_INK_DIM }}>
          I read everything that comes in.
        </p>
      </div>

      {/* Contact form */}
      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
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
        </div>
        <textarea
          placeholder="Your message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          rows={4}
          className={inputClass + " resize-y"}
          style={inputStyle}
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 cursor-pointer transition-transform hover:scale-105"
          style={{
            background: PAPER_INK_ACCENT,
            color: PAPER_FILL,
            border: `1.5px solid ${PAPER_STROKE}`,
            borderRadius: "9999px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          <Send className="w-3 h-3" />
          Send message
        </button>
      </form>

      {/* Social links */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-1.5" style={{ color: PAPER_INK_ACCENT }}>
          Or find me here
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SOCIAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 transition-transform hover:scale-105"
                style={{
                  background: PAPER_FILL,
                  border: `1.5px solid ${PAPER_STROKE}`,
                  borderRadius: "9999px",
                  color: PAPER_INK,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                }}
              >
                <Icon className="w-3 h-3" />
                {link.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Footer signature */}
      <div className="pt-2" style={{ borderTop: `1px dashed ${PAPER_STROKE}` }}>
        <p className="text-[10px] text-center" style={{ color: PAPER_INK_DIM }}>
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
      </div>
    </div>
  );
}
