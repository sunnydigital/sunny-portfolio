"use client";

import { useState } from "react";
import { Menu, X, Sun, Moon, LogIn, LogOut, Settings } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useShadowbox, SectionId } from "@/lib/shadowbox";

const links: { label: string; id: SectionId }[] = [
  { label: "About", id: "about" },
  { label: "Projects", id: "projects" },
  { label: "Papers", id: "papers" },
  { label: "Posts", id: "posts" },
  { label: "Skills", id: "skills" },
  { label: "Resume", id: "resume" },
  { label: "Contact", id: "contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();
  const { goToSectionId } = useShadowbox();

  const handleNavClick = (id: SectionId) => (e: React.MouseEvent) => {
    e.preventDefault();
    goToSectionId(id);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)", borderBottom: "1px solid var(--border)" }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <a href="/" className="text-sm flex items-center gap-2 mr-auto transition-colors" style={{ color: "var(--text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-mid)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
          <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f31e/512.gif" alt="🌞" width="28" height="28" />
          Sunny Son
        </a>
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={handleNavClick(l.id)}
              className="text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-mid)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {l.label}
            </a>
          ))}

          {session && (
            <Link
              href="/settings"
              className="text-sm transition-colors flex items-center gap-1"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-mid)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
          )}

          <button
            onClick={toggle}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {session && (
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <Image src={session.user.image} alt="" width={28} height={28} className="rounded-full" />
              )}
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-md transition-colors cursor-pointer"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <button className="md:hidden" style={{ color: "var(--text-muted)" }} onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden backdrop-blur-md px-4 py-3 flex flex-col gap-3" style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)", borderTop: "1px solid var(--border)" }}>
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => { setOpen(false); handleNavClick(l.id)(e); }}
              className="text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              {l.label}
            </a>
          ))}
          {session && (
            <Link href="/settings" onClick={() => setOpen(false)} className="text-sm flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
          )}
          <button onClick={toggle} className="flex items-center gap-2 text-sm py-2 transition-colors" style={{ color: "var(--text-muted)" }}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          {session && (
            <button onClick={() => signOut()} className="flex items-center gap-2 text-sm py-2" style={{ color: "var(--text-muted)" }}>
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
