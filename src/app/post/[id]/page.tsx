"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { ArrowLeft, Edit3, Trash2, Save, X } from "lucide-react";
import { mockPosts } from "@/data/mock";
import { Post } from "@/types";
import ImageGallery from "@/components/ImageGallery";
import ImageUploader from "@/components/ImageUploader";
import { saveToDb, hideInDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1.15rem;font-weight:700;margin:1.5rem 0 0.5rem;color:var(--text)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.35rem;font-weight:700;margin:2rem 0 0.75rem;color:var(--text)">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:1.75rem;font-weight:800;margin:0 0 1rem;color:var(--text)">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:var(--border);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:1.5rem;list-style:disc;margin-bottom:0.25rem">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:1.5rem;list-style:decimal;margin-bottom:0.25rem">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:1rem;line-height:1.8">')
    .replace(/^/, '<p style="margin-bottom:1rem;line-height:1.8">')
    .concat("</p>");
}

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [dbPost, setDbPost] = useState<Post | null>(null);
  const basePost = mockPosts.find((p) => p.id === params.id) || dbPost;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // Fetch from Supabase (for user-created posts or overrides)
  useEffect(() => {
    const id = params.id as string;
    supabase.from("posts").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setDbPost(data as unknown as Post);
      }
    });
  }, [params.id]);

  useEffect(() => {
    if (!basePost) return;
    setTitle(basePost.title);
    setExcerpt(basePost.excerpt);
    setContent(basePost.content);
    setDate(basePost.date);
    setTags([...basePost.tags]);
    setImages(basePost.images ?? []);
    // Apply DB overrides
    supabase.from("posts").select("*").eq("id", basePost.id).single().then(({ data }) => {
      if (data) {
        if (data.title) setTitle(data.title);
        if (data.excerpt) setExcerpt(data.excerpt);
        if (data.content) setContent(data.content);
        if (data.date) setDate(data.date);
        if (data.tags) setTags(data.tags);
        if (data.images) setImages(data.images);
      }
    });
  }, [basePost]);

  if (!basePost) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>Post not found.</p>
      </div>
    );
  }

  const handleSave = () => {
    saveToDb("posts", { id: basePost.id, title, excerpt, content, date, tags, images }).catch(() => {});
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(basePost.title);
    setExcerpt(basePost.excerpt);
    setContent(basePost.content);
    setDate(basePost.date);
    setTags([...basePost.tags]);
    setImages(basePost.images ?? []);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    hideInDb("posts", basePost.id).catch(() => {});
    router.push("/#posts");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));
  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setNewTag("");
  };

  return (
    <div className="min-h-screen px-4 py-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/#posts")}
          className="flex items-center gap-2 mb-8 text-sm transition-colors cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-mid)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          {editing ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-mono cursor-pointer"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "6px", padding: "2px 6px" }}
            />
          ) : (
            new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          )}
        </div>

        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-4xl font-bold mb-4 w-full bg-transparent focus:outline-none"
            style={{ color: "var(--text)", borderBottom: "1px solid var(--border)" }}
          />
        ) : (
          <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--text)" }}>
            {title}
          </h1>
        )}

        {editing ? (
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="text-sm mb-4 w-full bg-transparent focus:outline-none resize-y p-2 rounded-lg"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            placeholder="Excerpt..."
          />
        ) : null}

        {editing ? (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(2,132,199,0.1)", color: "var(--accent-mid)", border: "1px solid rgba(2,132,199,0.2)" }}
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-400 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add tag + Enter"
              className="text-xs px-2 py-1 rounded-lg bg-transparent focus:outline-none"
              style={{ color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(2,132,199,0.1)", color: "var(--accent-mid)", border: "1px solid rgba(2,132,199,0.2)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {session && !editing && (
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-colors cursor-pointer"
              style={{ color: "var(--accent-mid)", border: "1px solid var(--border)" }}
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-colors cursor-pointer"
              style={{ color: "#ff6464", border: "1px solid rgba(255,100,100,0.3)" }}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}

        {editing && (
          <div className="flex gap-2 mb-8">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Save className="w-3 h-3" /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg cursor-pointer"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        )}

        {editing && (
          <ImageUploader images={images} onChange={setImages} />
        )}

        {!editing && images.length > 0 && (
          <ImageGallery images={images} />
        )}

        {editing ? (
          <div className="rounded-xl p-6 mt-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-y font-mono"
              style={{ color: "var(--text)", lineHeight: 1.8 }}
              placeholder="Post content (supports markdown)..."
            />
          </div>
        ) : (
          <div className="rounded-xl p-6 mt-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div
              className="text-sm"
              style={{ color: "var(--text)", lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
