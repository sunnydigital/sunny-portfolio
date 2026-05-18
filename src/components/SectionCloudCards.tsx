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
      <h3
        className="font-semibold leading-tight"
        style={{ color: HEADING_COLOR, fontSize: "1.2em", marginBottom: "0.3em" }}
      >
        {project.title}
      </h3>
      <LatexText
        as="p"
        className="leading-snug"
        style={{ color: META_COLOR, fontSize: "0.85em", marginBottom: "0.5em" }}
      >
        {project.description.length > 220 ? project.description.slice(0, 217) + "…" : project.description}
      </LatexText>
      <div
        className="flex flex-wrap justify-center"
        style={{ gap: "0.25em", marginBottom: "0.5em" }}
      >
        {project.tech.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded-full"
            style={{
              background: "rgba(13,58,85,0.1)",
              color: HEADING_COLOR,
              border: "1px solid rgba(13,58,85,0.25)",
              fontSize: "0.65em",
              padding: "0.1em 0.5em",
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="flex justify-center" style={{ gap: "0.75em" }}>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: META_COLOR }}
          >
            <ExternalLink style={{ width: "1em", height: "1em" }} />
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
            <Github style={{ width: "1em", height: "1em" }} />
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
      <h3
        className="font-semibold leading-tight"
        style={{ color: HEADING_COLOR, fontSize: "1.1em", marginBottom: "0.3em" }}
      >
        {publication.title}
      </h3>
      <p
        className="italic"
        style={{ color: META_COLOR, fontSize: "0.75em", marginBottom: "0.25em" }}
      >
        {publication.journal} · {publication.date}
      </p>
      <p
        className="leading-snug line-clamp-3"
        style={{ color: META_COLOR, fontSize: "0.85em", marginBottom: "0.5em" }}
      >
        {publication.contribution}
      </p>
      {publication.url && (
        <a
          href={publication.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center"
          style={{
            color: HEADING_COLOR,
            textDecoration: "underline",
            fontSize: "0.75em",
            gap: "0.25em",
          }}
        >
          View paper <ExternalLink style={{ width: "1em", height: "1em" }} />
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
      <h3
        className="font-semibold leading-tight"
        style={{ color: HEADING_COLOR, fontSize: "1.1em", marginBottom: "0.3em" }}
      >
        {post.title}
      </h3>
      <p style={{ color: META_COLOR, fontSize: "0.75em", marginBottom: "0.5em" }}>
        {shortDate(post.date)}
      </p>
      <p
        className="leading-snug"
        style={{ color: META_COLOR, fontSize: "0.85em", marginBottom: "0.5em" }}
      >
        {post.excerpt.length > 200 ? post.excerpt.slice(0, 197) + "…" : post.excerpt}
      </p>
      <div className="flex flex-wrap justify-center" style={{ gap: "0.25em" }}>
        {post.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded-full"
            style={{
              background: "rgba(13,58,85,0.1)",
              color: HEADING_COLOR,
              border: "1px solid rgba(13,58,85,0.25)",
              fontSize: "0.65em",
              padding: "0.1em 0.5em",
            }}
          >
            #{t}
          </span>
        ))}
      </div>
    </div>
  );
}
