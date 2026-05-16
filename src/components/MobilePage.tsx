"use client";

// Mobile fallback page: replicates the original (pre-shadowbox) stacked
// DOM-scroll layout so that touch devices keep the deployed Vercel UX while
// the shadowbox/cloud experience continues to evolve on desktop.

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { mockConcepts, mockProjects, mockSkills, mockPosts, mockPublications } from "@/data/mock";
import { getAllConceptsAsync, invalidateConceptsCache } from "@/lib/concepts";
import { getProjectsAsync, getPostsAsync, getPublicationsAsync, getSkillsAsync, hideInDb } from "@/lib/db";
import Navbar from "@/components/Navbar";
import ThemeToggle from "@/components/ThemeToggle";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Resume from "@/components/Resume";
import Links from "@/components/Links";
import Papers from "@/components/Papers";
import Posts from "@/components/Posts";
import Contact from "@/components/Contact";
import ConceptInput from "@/components/ConceptInput";
import Footer from "@/components/Footer";
import ScrollIndicator from "@/components/ScrollIndicator";

const GalaxyVisualization = dynamic(() => import("@/components/GalaxyVisualization"), { ssr: false });

export default function MobilePage() {
  const [concepts, setConcepts] = useState(mockConcepts);
  const [projects, setProjects] = useState(mockProjects);
  const [posts, setPosts] = useState(mockPosts);
  const [publications, setPublications] = useState(mockPublications);
  const [skills, setSkills] = useState(mockSkills);
  const [galaxyReady, setGalaxyReady] = useState(false);

  const loadData = useCallback(async () => {
    const [c, p, po, pu, s] = await Promise.all([
      getAllConceptsAsync(),
      getProjectsAsync(),
      getPostsAsync(),
      getPublicationsAsync(),
      getSkillsAsync(),
    ]);
    setConcepts(c);
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
    const onFocus = () => {
      invalidateConceptsCache();
      loadData();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadData]);

  const handleConceptAdded = useCallback(() => {
    invalidateConceptsCache();
    getAllConceptsAsync().then(setConcepts).catch(() => {});
  }, []);

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

  return (
    <main className="relative">
      <Navbar />
      <ThemeToggle />
      <div className="relative">
        <GalaxyVisualization concepts={concepts} onReady={() => setGalaxyReady(true)} />
        <ScrollIndicator />
      </div>
      {galaxyReady && (
        <div className="relative z-10" style={{ background: "var(--bg)" }}>
          <About />
          <Projects projects={projects} onDelete={handleDeleteProject} />
          <Papers publications={publications} onDelete={handleDeletePublication} />
          <Posts posts={posts} onDelete={handleDeletePost} />
          <Skills skills={skills} projects={projects} />
          <Resume />
          <Links />
          <Contact />
          <Footer />
        </div>
      )}
      {galaxyReady && <ConceptInput onConceptAdded={handleConceptAdded} />}
    </main>
  );
}
