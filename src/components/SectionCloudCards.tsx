"use client";

// Compact single-item cards used inside floating clouds. Each renders one
// project / publication / post sized to fit inside a paper cloud silhouette.
// Click navigates to the item's detail page (same as the legacy grid card).

import { ExternalLink, Github } from "lucide-react";
import { useRouter } from "next/navigation";
import LatexText from "@/components/LatexText";
import { Project, Publication, Post } from "@/types";
import { parseLocalDate } from "@/lib/date";

function shortDate(s: string) {
  try {
    const d = parseLocalDate(s);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return s;
  }
}

const HEADING_COLOR = "#0d3a55"; // dark accent for cream paper readability
const META_COLOR = "#5a4a3a";

export function ProjectCloudCard({ project }: { project: Project }) {
  const router = useRouter();
  return (
    <div
      className="cursor-pointer select-none"
      onClick={() => project.id && router.push(`/project/${project.id}`)}
    >
      <h3 className="text-base font-semibold mb-1 leading-tight" style={{ color: HEADING_COLOR }}>
        {project.title}
      </h3>
      <LatexText
        as="p"
        className="text-xs mb-2 leading-snug"
        style={{ color: META_COLOR }}
      >
        {project.description.length > 220 ? project.description.slice(0, 217) + "…" : project.description}
      </LatexText>
      <div className="flex flex-wrap justify-center gap-1 mb-2">
        {project.tech.slice(0, 4).map((t) => (
          <span
            key={t}
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(13,58,85,0.1)",
              color: HEADING_COLOR,
              border: "1px solid rgba(13,58,85,0.25)",
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: META_COLOR }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: META_COLOR }}
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function PaperCloudCard({ publication }: { publication: Publication }) {
  const router = useRouter();
  return (
    <div
      className="cursor-pointer select-none"
      onClick={() => publication.id && router.push(`/publication/${publication.id}`)}
    >
      <h3 className="text-sm font-semibold mb-1 leading-tight" style={{ color: HEADING_COLOR }}>
        {publication.title}
      </h3>
      <p className="text-[11px] italic mb-1" style={{ color: META_COLOR }}>
        {publication.journal} · {publication.date}
      </p>
      <p className="text-xs mb-2 leading-snug line-clamp-3" style={{ color: META_COLOR }}>
        {publication.contribution}
      </p>
      {publication.url && (
        <a
          href={publication.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px]"
          style={{ color: HEADING_COLOR, textDecoration: "underline" }}
        >
          View paper <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

export function PostCloudCard({ post }: { post: Post }) {
  const router = useRouter();
  return (
    <div
      className="cursor-pointer select-none"
      onClick={() => post.id && router.push(`/post/${post.id}`)}
    >
      <h3 className="text-sm font-semibold mb-1 leading-tight" style={{ color: HEADING_COLOR }}>
        {post.title}
      </h3>
      <p className="text-[11px] mb-2" style={{ color: META_COLOR }}>
        {shortDate(post.date)}
      </p>
      <p className="text-xs mb-2 leading-snug" style={{ color: META_COLOR }}>
        {post.excerpt.length > 200 ? post.excerpt.slice(0, 197) + "…" : post.excerpt}
      </p>
      <div className="flex flex-wrap justify-center gap-1">
        {post.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(13,58,85,0.1)",
              color: HEADING_COLOR,
              border: "1px solid rgba(13,58,85,0.25)",
            }}
          >
            #{t}
          </span>
        ))}
      </div>
    </div>
  );
}
