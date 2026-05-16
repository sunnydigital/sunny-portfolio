"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Edit3, Save, X } from "lucide-react";
import { getAboutAsync, saveToDb } from "@/lib/db";

const DEFAULT_INTRO = `Hi, I'm Sunny Son — an MS Data Science candidate at NYU Center for Data Science (class of 2026), former AI Engineer Intern at Amazon, and a data scientist with 2+ years at NYU Langone Health building deep learning pipelines for biomedical research.`;

const DEFAULT_BODY_1 = `I've engineered enterprise-scale RAG systems serving 15,000+ tables, implemented U-Net CNNs for microscopy image segmentation, and contributed bioinformatics analysis to a Nature Immunology publication. My work at NYU Langone helped secure over $1M in research funding through biomarker discovery. I hold a BS from NYU Stern and an MLOps Specialization from DeepLearning.AI.`;

const DEFAULT_BODY_2 = `Outside of work, I'm an Overwatch Top 500 player, a runner, photographer, archer, and a professional-grade whistler (taking requests). I also speak Mandarin and am picking up Spanish. Always down for street food adventures and boarding.`;

function highlightText(text: string) {
  // Bold keywords wrapped in **...**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-semibold" style={{ color: "var(--accent-mid)" }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

export default function About({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [body1, setBody1] = useState(DEFAULT_BODY_1);
  const [body2, setBody2] = useState(DEFAULT_BODY_2);
  const [editIntro, setEditIntro] = useState("");
  const [editBody1, setEditBody1] = useState("");
  const [editBody2, setEditBody2] = useState("");

  useEffect(() => {
    getAboutAsync().then((data) => {
      if (data) {
        if (data.intro) setIntro(data.intro);
        if (data.body1) setBody1(data.body1);
        if (data.body2) setBody2(data.body2);
      }
    });
  }, []);

  const startEditing = () => {
    setEditIntro(intro);
    setEditBody1(body1);
    setEditBody2(body2);
    setEditing(true);
  };

  const handleSave = () => {
    setIntro(editIntro);
    setBody1(editBody1);
    setBody2(editBody2);
    setEditing(false);
    saveToDb("about", { id: "main", intro: editIntro, body1: editBody1, body2: editBody2 }).catch(() => {});
  };

  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <section id="about" className="py-24 px-4 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        {!hideHeader && (
          <h2 className="text-3xl font-bold mb-8" style={{ color: "var(--accent)" }}>
            <span className="flex items-center gap-3">
              About Me
              {session && !editing && (
                <button
                  onClick={startEditing}
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
        )}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--border-strong)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/profile.jpg" alt="Sunny Son" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-4 flex-1">
            {editing ? (
              <>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>
                    Introduction (use **text** for highlights)
                  </label>
                  <textarea
                    value={editIntro}
                    onChange={(e) => setEditIntro(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-lg text-sm leading-relaxed focus:outline-none resize-y"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>
                    Experience & Background
                  </label>
                  <textarea
                    value={editBody1}
                    onChange={(e) => setEditBody1(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-lg text-sm leading-relaxed focus:outline-none resize-y"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: "var(--text-muted)" }}>
                    Personal & Interests
                  </label>
                  <textarea
                    value={editBody2}
                    onChange={(e) => setEditBody2(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg text-sm leading-relaxed focus:outline-none resize-y"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Playful: each paragraph leans the opposite direction of
                    the previous one, like handwritten notes scattered together. */}
                <p
                  className="text-lg leading-relaxed"
                  style={{
                    color: "inherit",
                    transform: "rotate(-1.5deg)",
                    transformOrigin: "left center",
                  }}
                >
                  {highlightText(intro)}
                </p>
                <p
                  className="leading-relaxed italic"
                  style={{
                    color: "inherit",
                    opacity: 0.85,
                    transform: "rotate(1.2deg)",
                    transformOrigin: "right center",
                    marginLeft: "1.5rem",
                  }}
                >
                  {highlightText(body1)}
                </p>
                <p
                  className="leading-relaxed"
                  style={{
                    color: "inherit",
                    opacity: 0.85,
                    transform: "rotate(-1deg)",
                    transformOrigin: "left center",
                    marginRight: "1.5rem",
                  }}
                >
                  {highlightText(body2)}
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
