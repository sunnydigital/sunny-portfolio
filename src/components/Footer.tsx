"use client";

export default function Footer() {
  return (
    <footer className="py-8 px-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
      <p className="text-sm inline-flex items-center justify-center gap-2 flex-wrap" style={{ color: "var(--text-muted)" }}>
        <span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>&lt;/&gt;</span>
          {" "}with ❤️, Three.js, and ☕️ by{" "}
          <a
            href="https://www.linkedin.com/in/sunny-son/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors"
            style={{ color: "var(--accent-mid)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent-mid)")}
          >
            Sunny Son
          </a>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://visitor-badge.laobi.icu/badge?page_id=sunnyson.dev.v2"
          alt="visitor count"
          className="opacity-60 hover:opacity-100 transition-opacity align-middle"
        />
      </p>
    </footer>
  );
}
