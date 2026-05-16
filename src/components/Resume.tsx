"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Download, Briefcase, GraduationCap, Award, Heart, Edit3, Save, X, Plus, Trash2 } from "lucide-react";
import {
  Experience,
  Education,
  Certification,
  Language,
  ResumeData,
  DEFAULT_EXPERIENCE,
  DEFAULT_EDUCATION,
  DEFAULT_CERTIFICATIONS,
  DEFAULT_LANGUAGES,
  DEFAULT_INTERESTS,
  RESUME_STORAGE_KEY,
  loadResumeData,
} from "@/data/resume";

const inputClass = "w-full p-2 rounded-lg text-sm focus:outline-none";
const inputStyle = { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" };

export default function Resume() {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<ResumeData>({ experience: DEFAULT_EXPERIENCE, education: DEFAULT_EDUCATION, certifications: DEFAULT_CERTIFICATIONS, languages: DEFAULT_LANGUAGES, interests: DEFAULT_INTERESTS });
  const [draft, setDraft] = useState<ResumeData>(data);

  useEffect(() => {
    const loaded = loadResumeData();
    setData(loaded);
  }, []);

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(data))); setEditing(true); };
  const handleSave = () => { setData(draft); localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(draft)); setEditing(false); };
  const handleCancel = () => { setEditing(false); };

  // Draft updaters
  const updateExp = (i: number, field: keyof Experience, value: string | string[]) => {
    setDraft(d => { const n = { ...d, experience: d.experience.map((e, idx) => idx === i ? { ...e, [field]: value } : e) }; return n; });
  };
  const addExp = () => {
    setDraft(d => ({ ...d, experience: [...d.experience, { title: "", company: "", location: "", period: "", bullets: [""] }] }));
  };
  const removeExp = (i: number) => { setDraft(d => ({ ...d, experience: d.experience.filter((_, idx) => idx !== i) })); };

  const updateEdu = (i: number, field: keyof Education, value: string) => {
    setDraft(d => ({ ...d, education: d.education.map((e, idx) => idx === i ? { ...e, [field]: value } : e) }));
  };
  const addEdu = () => { setDraft(d => ({ ...d, education: [...d.education, { degree: "", school: "", period: "", detail: "" }] })); };
  const removeEdu = (i: number) => { setDraft(d => ({ ...d, education: d.education.filter((_, idx) => idx !== i) })); };

  const updateCert = (i: number, field: keyof Certification, value: string) => {
    setDraft(d => ({ ...d, certifications: d.certifications.map((c, idx) => idx === i ? { ...c, [field]: value } : c) }));
  };
  const addCert = () => { setDraft(d => ({ ...d, certifications: [...d.certifications, { title: "", org: "", url: "" }] })); };
  const removeCert = (i: number) => { setDraft(d => ({ ...d, certifications: d.certifications.filter((_, idx) => idx !== i) })); };

  const updateLang = (i: number, field: keyof Language, value: string) => {
    setDraft(d => ({ ...d, languages: d.languages.map((l, idx) => idx === i ? { ...l, [field]: value } : l) }));
  };
  const addLang = () => { setDraft(d => ({ ...d, languages: [...d.languages, { lang: "", level: "" }] })); };
  const removeLang = (i: number) => { setDraft(d => ({ ...d, languages: d.languages.filter((_, idx) => idx !== i) })); };

  const { experience, education, certifications, languages, interests } = editing ? draft : data;

  return (
    <section id="resume" className="py-24 px-4 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
            <span className="flex items-center gap-3">
              Resume
              {session && !editing && (
                <button
                  onClick={startEdit}
                  className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                  style={{ color: "var(--accent-mid)", border: "1px solid var(--border)" }}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              {editing && (
                <span className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </span>
              )}
            </span>
          </h2>
          <a
            href="/resume.pdf"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "rgba(2,132,199,0.1)", color: "var(--accent-mid)", border: "1px solid rgba(2,132,199,0.3)" }}
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        {/* Experience */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="w-5 h-5" style={{ color: "var(--accent-mid)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Experience</h3>
            {editing && (
              <button onClick={addExp} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer" style={{ color: "var(--accent-mid)", border: "1px solid var(--border)" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
          <div className="space-y-6 pl-6" style={{ borderLeft: "2px solid var(--border-strong)" }}>
            {experience.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full" style={{ background: "var(--accent)", border: "2px solid var(--bg)" }} />
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={exp.title} onChange={e => updateExp(i, "title", e.target.value)} placeholder="Title" className={inputClass} style={inputStyle} />
                      <button onClick={() => removeExp(i)} className="flex-shrink-0 cursor-pointer" style={{ color: "var(--text-muted)" }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2">
                      <input value={exp.company} onChange={e => updateExp(i, "company", e.target.value)} placeholder="Company" className={inputClass} style={inputStyle} />
                      <input value={exp.location} onChange={e => updateExp(i, "location", e.target.value)} placeholder="Location" className={inputClass} style={inputStyle} />
                    </div>
                    <input value={exp.period} onChange={e => updateExp(i, "period", e.target.value)} placeholder="Period" className={inputClass} style={inputStyle} />
                    <textarea
                      value={exp.bullets.join("\n")}
                      onChange={e => updateExp(i, "bullets", e.target.value.split("\n"))}
                      placeholder="Bullets (one per line)"
                      rows={Math.max(3, exp.bullets.length + 1)}
                      className={inputClass + " resize-y"}
                      style={inputStyle}
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold" style={{ color: "var(--text)" }}>{exp.title}</h4>
                    <p className="text-sm" style={{ color: "var(--accent-mid)" }}>{exp.company} · {exp.location}</p>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{exp.period}</p>
                    <ul className="space-y-1">
                      {exp.bullets.map((b, j) => (
                        <li key={j} className="text-sm flex gap-2" style={{ color: "var(--text-muted)" }}>
                          <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full" style={{ background: "var(--accent-mid)" }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5" style={{ color: "var(--accent-mid)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Education</h3>
            {editing && (
              <button onClick={addEdu} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer" style={{ color: "var(--accent-mid)", border: "1px solid var(--border)" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
          <div className="space-y-6 pl-6" style={{ borderLeft: "2px solid var(--border-strong)" }}>
            {education.map((edu, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full" style={{ background: "var(--accent-mid)", border: "2px solid var(--bg)" }} />
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={edu.degree} onChange={e => updateEdu(i, "degree", e.target.value)} placeholder="Degree" className={inputClass} style={inputStyle} />
                      <button onClick={() => removeEdu(i)} className="flex-shrink-0 cursor-pointer" style={{ color: "var(--text-muted)" }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <input value={edu.school} onChange={e => updateEdu(i, "school", e.target.value)} placeholder="School" className={inputClass} style={inputStyle} />
                    <div className="flex gap-2">
                      <input value={edu.period} onChange={e => updateEdu(i, "period", e.target.value)} placeholder="Period" className={inputClass} style={inputStyle} />
                      <input value={edu.detail} onChange={e => updateEdu(i, "detail", e.target.value)} placeholder="Detail (GPA etc.)" className={inputClass} style={inputStyle} />
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold" style={{ color: "var(--text)" }}>{edu.degree}</h4>
                    <p className="text-sm" style={{ color: "var(--accent-mid)" }}>{edu.school}</p>
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{edu.period}</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{edu.detail}</p>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5" style={{ color: "var(--accent-mid)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Certifications</h3>
            {editing && (
              <button onClick={addCert} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer" style={{ color: "var(--accent-mid)", border: "1px solid var(--border)" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
          <div className="space-y-3 pl-6">
            {certifications.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input value={c.title} onChange={e => updateCert(i, "title", e.target.value)} placeholder="Title" className={inputClass} style={inputStyle} />
                    <input value={c.org} onChange={e => updateCert(i, "org", e.target.value)} placeholder="Org" className={inputClass + " max-w-[200px]"} style={inputStyle} />
                    <input value={c.url} onChange={e => updateCert(i, "url", e.target.value)} placeholder="URL" className={inputClass + " max-w-[200px]"} style={inputStyle} />
                    <button onClick={() => removeCert(i)} className="flex-shrink-0 cursor-pointer" style={{ color: "var(--text-muted)" }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium transition-colors" style={{ color: "var(--text)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-mid)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}>{c.title}</a>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.title}</span>
                    )}
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>— {c.org}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Languages & Interests */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5" style={{ color: "var(--accent-mid)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Languages & Interests</h3>
          </div>
          <div className="pl-6 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Languages</p>
              {editing ? (
                <div className="space-y-2">
                  {languages.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={l.lang} onChange={e => updateLang(i, "lang", e.target.value)} placeholder="Language" className={inputClass + " max-w-[200px]"} style={inputStyle} />
                      <input value={l.level} onChange={e => updateLang(i, "level", e.target.value)} placeholder="Level" className={inputClass + " max-w-[200px]"} style={inputStyle} />
                      <button onClick={() => removeLang(i)} className="flex-shrink-0 cursor-pointer" style={{ color: "var(--text-muted)" }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={addLang} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer" style={{ color: "var(--accent-mid)", border: "1px solid var(--border)" }}>
                    <Plus className="w-3 h-3" /> Add Language
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  {languages.map((l) => (
                    <span key={l.lang} className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {l.lang} <span className="text-xs opacity-70">({l.level})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Interests</p>
              {editing ? (
                <textarea
                  value={interests.join(", ")}
                  onChange={e => setDraft(d => ({ ...d, interests: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                  rows={3}
                  placeholder="Comma-separated interests"
                  className={inputClass + " resize-y"}
                  style={inputStyle}
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(2,132,199,0.05)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
