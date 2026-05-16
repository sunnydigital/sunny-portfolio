"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import MobilePage from "@/components/MobilePage";
import CloudLayer, { TitleCloud } from "@/components/CloudLayer";
import { ProjectCloudCard, PaperCloudCard, PostCloudCard } from "@/components/SectionCloudCards";
import SkillsHillEmbed from "@/components/SkillsHillEmbed";

// Mobile detection: pointer:coarse OR viewport <= 768px wide. Touch tablets
// (iPad, etc.) get the mobile layout because the shadowbox UX assumes a
// pointer + wide viewport.
function useIsMobileDevice() {
  const [mobile, setMobile] = useState<null | boolean>(null);
  useEffect(() => {
    const test = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth <= 768;
      setMobile(coarse || narrow);
    };
    test();
    window.addEventListener("resize", test);
    return () => window.removeEventListener("resize", test);
  }, []);
  return mobile;
}
import { mockConcepts, mockProjects, mockSkills, mockPosts, mockPublications } from "@/data/mock";
import { invalidateConceptsCache, getAllConceptsAsync } from "@/lib/concepts";
import { getProjectsAsync, getPostsAsync, getPublicationsAsync, getSkillsAsync, hideInDb } from "@/lib/db";
import { SectionId } from "@/lib/shadowbox";
import Navbar from "@/components/Navbar";
import ThemeToggle from "@/components/ThemeToggle";
import About from "@/components/About";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import ResumeJournal from "@/components/ResumeJournal";
import Papers from "@/components/Papers";
import Posts from "@/components/Posts";
import ContactCard from "@/components/ContactCard";
import ConceptInput from "@/components/ConceptInput";
import ScrollIndicator from "@/components/ScrollIndicator";

const GalaxyVisualization = dynamic(() => import("@/components/GalaxyVisualization"), { ssr: false });
const Shadowbox = dynamic(() => import("@/components/Shadowbox"), { ssr: false });

export default function Home() {
  const isMobile = useIsMobileDevice();
  if (isMobile === null) {
    // First client-side render before resize handler resolves. Render nothing
    // to avoid a flash of the wrong layout.
    return <main className="min-h-screen" style={{ background: "var(--bg)" }} />;
  }
  if (isMobile) {
    return <MobilePage />;
  }
  return <DesktopHome />;
}

function DesktopHome() {
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

  const sectionContent = useMemo<Record<SectionId, React.ReactNode>>(() => ({
    // About: one slow-drifting LARGE cloud carrying the entire About content.
    // Sits BELOW the cluster (around top 60vh) so it occupies the hill band,
    // and at z=80 it renders behind the tree/figure/telescope cluster (z=100)
    // but above the hills and stars.
    about: (
      <>
        <TitleCloud title="About Me" />
        <CloudLayer
          items={[<About key="about" hideHeader />]}
          slots={1}
          baseDurationS={160}
          decorative={3}
          widthVw={70}
          topRange={[36, 36]}
        />
      </>
    ),
    projects: (
      <>
        <TitleCloud title="Projects" />
        <CloudLayer
          items={projects.map((p) => (
            <ProjectCloudCard key={p.id || p.title} project={p} />
          ))}
          // Cap content clouds at 6 max; never more slots than items so empty
          // clouds don't appear when there are few projects.
          slots={Math.min(6, Math.max(1, projects.length))}
          baseDurationS={85}
          decorative={4}
          widthVw={36}
          topRange={[48, 60]}
        />
      </>
    ),
    papers: (
      <>
        <TitleCloud title="Publications" />
        <CloudLayer
          items={publications.map((p) => (
            <PaperCloudCard key={p.id || p.title} publication={p} />
          ))}
          slots={Math.min(6, Math.max(1, publications.length))}
          baseDurationS={85}
          decorative={4}
          widthVw={36}
          topRange={[48, 60]}
        />
      </>
    ),
    posts: (
      <>
        <TitleCloud title="Posts" />
        <CloudLayer
          items={posts.map((p) => (
            <PostCloudCard key={p.id || p.title} post={p} />
          ))}
          slots={Math.min(6, Math.max(1, posts.length))}
          baseDurationS={85}
          decorative={4}
          widthVw={36}
          topRange={[48, 60]}
        />
      </>
    ),
    skills: (
      <>
        <TitleCloud title="Skills" subtitle="click a skill to see where I've used it" />
        <SkillsHillEmbed skills={skills} projects={projects} />
        <CloudLayer items={[]} slots={0} baseDurationS={120} decorative={5} />
      </>
    ),
    resume: (
      <>
        <TitleCloud title="Resume" subtitle="swipe or use the arrows to turn the page" />
        <ResumeJournal />
        <CloudLayer items={[]} slots={0} baseDurationS={120} decorative={4} />
      </>
    ),
    contact: (
      <>
        <TitleCloud title="Get in Touch" subtitle="send a note or find me on the socials" />
        <ContactCard />
        <CloudLayer items={[]} slots={0} baseDurationS={120} decorative={4} />
      </>
    ),
  }), [projects, publications, posts, skills, handleDeleteProject, handleDeletePublication, handleDeletePost]);

  return (
    <main className="relative min-h-screen">
      <Navbar />
      <ThemeToggle />
      <GalaxyVisualization concepts={concepts} onReady={() => setGalaxyReady(true)} />
      {galaxyReady && (
        <>
          <Shadowbox sectionContent={sectionContent} />
          <ScrollIndicator />
          <ConceptInput onConceptAdded={handleConceptAdded} />
        </>
      )}
    </main>
  );
}
