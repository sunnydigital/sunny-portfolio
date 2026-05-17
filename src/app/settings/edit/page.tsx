"use client";

// Editing view for content sections. Renders the original DOM-scrolled stack
// (About, Projects, Papers, Posts, Skills, Resume) so that all of the
// existing in-component edit affordances (Edit / Save / Add / Delete buttons
// gated by useSession) are usable without the shadowbox layout getting in the
// way. Only accessible when logged in — anonymous visitors are bounced back
// to the public site.

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { mockProjects, mockSkills, mockPosts, mockPublications } from "@/data/mock";
import { invalidateConceptsCache } from "@/lib/concepts";
import { getProjectsAsync, getPostsAsync, getPublicationsAsync, getSkillsAsync, hideInDb } from "@/lib/db";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Papers from "@/components/Papers";
import Posts from "@/components/Posts";
import Skills from "@/components/Skills";
import Resume from "@/components/Resume";

export default function EditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState(mockProjects);
  const [posts, setPosts] = useState(mockPosts);
  const [publications, setPublications] = useState(mockPublications);
  const [skills, setSkills] = useState(mockSkills);

  const loadData = useCallback(async () => {
    const [p, po, pu, s] = await Promise.all([
      getProjectsAsync(),
      getPostsAsync(),
      getPublicationsAsync(),
      getSkillsAsync(),
    ]);
    setProjects(p);
    setPosts(po);
    setPublications(pu);
    setSkills(s);
  }, []);

  useEffect(() => {
    loadData();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        invalidateConceptsCache();
        loadData();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", loadData);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", loadData);
    };
  }, [loadData]);

  const handleDeletePost = useCallback((id: string) => {
    hideInDb("posts", id).catch(() => {});
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);
  const handleDeletePublication = useCallback((id: string) => {
    hideInDb("publications", id).catch(() => {});
    setPublications((prev) => prev.filter((p) => p.id !== id));
  }, []);
  const handleDeleteProject = useCallback((id: string) => {
    hideInDb("projects", id).catch(() => {});
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>
            You must be logged in to edit content.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Admin header bar */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2 text-sm cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-mid)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft className="w-4 h-4" /> Settings
          </button>
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "var(--accent-mid)" }}
          >
            Editing mode
          </span>
          <button
            onClick={() => router.push("/")}
            className="text-xs cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            View public site →
          </button>
        </div>
      </header>

      {/* Stacked editable sections — the in-component Edit/Save/Add/Delete
          buttons are session-gated and already work; we just render them here
          without the shadowbox layout. */}
      <div className="relative">
        <About />
        <Projects projects={projects} onDelete={handleDeleteProject} />
        <Papers publications={publications} onDelete={handleDeletePublication} />
        <Posts posts={posts} onDelete={handleDeletePost} />
        <Skills skills={skills} projects={projects} />
        <Resume />
      </div>
    </main>
  );
}
