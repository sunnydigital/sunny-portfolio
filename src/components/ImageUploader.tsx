"use client";

import { useState, useRef } from "react";
import { Plus, X, Loader2, Copy, Check } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const copyUrl = (url: string, index: number) => {
    navigator.clipboard.writeText(`![image](${url})`);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const { url } = await res.json();
          newUrls.push(url);
        }
      }
      onChange([...images, ...newUrls]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-4">
      <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--text-muted)" }}>
        Images
      </label>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div
                className="relative w-20 h-20 rounded-lg overflow-hidden group"
                style={{ border: "1px solid var(--border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <button
                    onClick={() => copyUrl(src, i)}
                    className="p-1 rounded cursor-pointer"
                    style={{ color: "#fff" }}
                    title="Copy markdown"
                  >
                    {copied === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => removeImage(i)}
                    className="p-1 rounded cursor-pointer"
                    style={{ color: "#fff" }}
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <span className="text-xs text-center" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>
                {copied === i ? "Copied!" : "hover to copy"}
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              style={{ border: "1px dashed var(--border)", color: "var(--text-muted)" }}
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </button>
            <span className="text-xs text-center" style={{ color: "transparent", fontSize: "0.6rem" }}>·</span>
          </div>
        </div>
        {images.length > 0 && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Hover an image and click <Copy className="w-3 h-3 inline mx-0.5" /> to copy its markdown tag — then paste it anywhere in your content.
          </p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
