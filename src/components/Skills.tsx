"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, X, Plus, Lightbulb } from "lucide-react";
import { useSession } from "next-auth/react";
import { Skill, Project } from "@/types";
import { saveToDb } from "@/lib/db";

// Map skill names to project tech tags (exact case-insensitive matching + tags)
function exactMatch(a: string, b: string): boolean {
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

function getMatchTerms(skill: Skill): string[] {
  // Combine skill name parts + any extra tags
  const nameParts = skill.name.split(/\s*\/\s*/).map((s) => s.trim());
  const tags = skill.tags ?? [];
  return [...nameParts, ...tags];
}

function getProjectsForSkill(skill: Skill, projects: Project[]): Project[] {
  const terms = getMatchTerms(skill);
  return projects.filter((p) =>
    p.tech.some((t) => terms.some((term) => exactMatch(t, term)))
  );
}

function techMatchesSkill(techTag: string, skill: Skill): boolean {
  const terms = getMatchTerms(skill);
  return terms.some((term) => exactMatch(techTag, term));
}

function techMatchesAnySkill(techTag: string, skills: Skill[]): boolean {
  return skills.some((skill) => techMatchesSkill(techTag, skill));
}

export default function Skills({ skills, projects }: { skills: Skill[]; projects: Project[] }) {
  const { data: session } = useSession();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newLevel, setNewLevel] = useState(50);
  const [newTags, setNewTags] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("Other");
  const [editLevel, setEditLevel] = useState(50);
  const [editTags, setEditTags] = useState("");

  // Auto-generate skills for unmatched project tech tags
  const { allSkills, unmatchedTags } = useMemo(() => {
    const allTechTags = new Set<string>();
    projects.forEach((p) => p.tech.forEach((t) => allTechTags.add(t)));

    const unmatched: string[] = [];
    allTechTags.forEach((tag) => {
      if (!techMatchesAnySkill(tag, skills)) {
        unmatched.push(tag);
      }
    });

    const autoSkills: Skill[] = unmatched.map((tag) => ({
      name: tag,
      level: 50,
      category: "Other",
    }));

    return {
      allSkills: [...skills, ...autoSkills],
      unmatchedTags: unmatched,
    };
  }, [skills, projects]);

  const categories = [...new Set(allSkills.map((s) => s.category))].sort((a, b) =>
    a === "Other" ? 1 : b === "Other" ? -1 : 0
  );

  const handleAddSkill = () => {
    if (!newName.trim()) return;
    const cat = newCategory || categories[0] || "Other";
    const skill: Skill = {
      name: newName.trim(),
      level: newLevel,
      category: cat,
      tags: newTags.trim() ? newTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    };
    const skillId = newName.trim().toLowerCase().replace(/\s+/g, "-");
    saveToDb("skills", { id: skillId, ...skill, is_user_created: true }).catch(() => { });
    setNewName(""); setNewCategory(""); setNewLevel(50); setNewTags(""); setShowNewForm(false);
    window.location.reload();
  };

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
    setEditingTag(null); setEditCategory("Other"); setEditLevel(50); setEditTags("");
    window.location.reload();
  };

  const selectedSkillObj = selectedSkill ? allSkills.find((s) => s.name === selectedSkill) ?? null : null;
  const matchedProjects = selectedSkillObj ? getProjectsForSkill(selectedSkillObj, projects) : [];

  return (
    <section id="skills" className="py-24 px-4 max-w-4xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="text-3xl font-bold mb-4"
        style={{ color: "var(--accent)" }}
      >
        <span className="flex items-center gap-3">
          Skills
          {session && (
            <button
              onClick={() => setShowNewForm((v) => !v)}
              className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
              style={{ color: "var(--accent-mid)", border: "1px solid var(--border)" }}
            >
              <Plus className="w-3.5 h-3.5" /> New Skill
            </button>
          )}
        </span>
      </motion.h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Click a skill to see where I&apos;ve used it.
      </p>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Name</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2 rounded-lg text-sm focus:outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} placeholder="Skill name" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-2 rounded-lg text-sm focus:outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                    {[...categories, "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Level: {newLevel}</label>
                <input type="range" min={0} max={100} value={newLevel} onChange={(e) => setNewLevel(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Tags (comma-separated)</label>
                <input value={newTags} onChange={(e) => setNewTags(e.target.value)} className="w-full p-2 rounded-lg text-sm focus:outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} placeholder="tag1, tag2" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddSkill} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
                <button onClick={() => setShowNewForm(false)} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer" style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {categories.map((cat, catIdx) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: catIdx * 0.08 }}
            viewport={{ once: true }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              {cat}
            </h3>
            <div className="flex flex-wrap gap-2">
              {allSkills
                .filter((s) => s.category === cat)
                .map((skill) => {
                  const isSelected = selectedSkill === skill.name;
                  const hasProjects = getProjectsForSkill(skill, projects).length > 0;
                  return (
                    <button
                      key={skill.name}
                      onClick={() => setSelectedSkill(isSelected ? null : skill.name)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                      style={{
                        background: isSelected
                          ? "var(--accent)"
                          : "rgba(2,132,199,0.08)",
                        color: isSelected ? "#fff" : "var(--text)",
                        border: isSelected
                          ? "1px solid var(--accent)"
                          : hasProjects
                            ? "1px solid rgba(2,132,199,0.25)"
                            : "1px solid var(--border)",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {skill.name}
                      {hasProjects && !isSelected && (
                        <span
                          className="ml-1.5 text-[9px] opacity-50"
                        >
                          ●
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Unmatched Tags Banner */}
      {session && unmatchedTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-4 rounded-xl"
          style={{ background: "rgba(2,132,199,0.05)", border: "1px solid rgba(2,132,199,0.15)" }}
        >
          <p className="text-xs flex items-center gap-1.5 mb-2" style={{ color: "var(--text-muted)" }}>
            <Lightbulb className="w-3.5 h-3.5" style={{ color: "var(--accent-mid)" }} />
            Unmatched tech tags auto-added as skills. Click to customize:
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {unmatchedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setEditingTag(editingTag === tag ? null : tag); setEditCategory("Other"); setEditLevel(50); setEditTags(""); }}
                className="text-[11px] px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                style={{
                  background: editingTag === tag ? "var(--accent)" : "rgba(2,132,199,0.12)",
                  color: editingTag === tag ? "#fff" : "var(--accent-mid)",
                  border: "1px solid rgba(2,132,199,0.25)",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <AnimatePresence>
            {editingTag && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg p-4 mt-2 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Name</label>
                      <input value={editingTag} readOnly className="w-full p-2 rounded-lg text-sm opacity-60" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Category</label>
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full p-2 rounded-lg text-sm focus:outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
                        {[...categories, ...(categories.includes("Other") ? [] : ["Other"])].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Level: {editLevel}</label>
                    <input type="range" min={0} max={100} value={editLevel} onChange={(e) => setEditLevel(Number(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>Tags (comma-separated)</label>
                    <input value={editTags} onChange={(e) => setEditTags(e.target.value)} className="w-full p-2 rounded-lg text-sm focus:outline-none" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} placeholder="optional extra tags" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSaveUnmatched} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
                    <button onClick={() => setEditingTag(null)} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer" style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Linked Projects Panel */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-10 overflow-hidden"
          >
            <div
              className="p-6 rounded-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Projects using{" "}
                  <span style={{ color: "var(--accent-mid)" }}>{selectedSkill}</span>
                </h3>
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="p-1 rounded-md transition-colors cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {matchedProjects.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No linked projects yet — this skill was developed through coursework and research.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {matchedProjects.map((project) => (
                    <div
                      key={project.title}
                      className="p-4 rounded-lg transition-colors"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                    >
                      <h4 className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                        {project.title}
                      </h4>
                      <p
                        className="text-xs mb-3 line-clamp-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {project.tech.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.5 rounded-full"
                            style={{
                              ...(() => {
                                const isMatch = selectedSkillObj ? techMatchesSkill(t, selectedSkillObj) : false;
                                return {
                                  background: isMatch ? "rgba(2,132,199,0.2)" : "rgba(255,255,255,0.05)",
                                  color: isMatch ? "var(--accent-mid)" : "var(--text-muted)",
                                  border: "1px solid rgba(2,132,199,0.15)",
                                };
                              })(),
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] flex items-center gap-1"
                            style={{ color: "var(--accent-mid)" }}
                          >
                            <ExternalLink className="w-3 h-3" /> Live
                          </a>
                        )}
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] flex items-center gap-1"
                            style={{ color: "var(--accent-mid)" }}
                          >
                            <Github className="w-3 h-3" /> Code
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
