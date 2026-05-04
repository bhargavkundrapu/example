import { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

function escapeHtmlFallback(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Renders seeded / admin-authored markdown (lesson_slides.body) safely in the LMS.
 */
export default function LessonMarkdownBody({ markdown, className = "" }) {
  const html = useMemo(() => {
    const raw = markdown || "";
    if (!String(raw).trim()) return "";
    try {
      const out = marked.parse(raw, { breaks: true, async: false });
      return typeof out === "string" ? DOMPurify.sanitize(out) : "";
    } catch {
      return DOMPurify.sanitize(
        `<pre class="whitespace-pre-wrap text-sm">${escapeHtmlFallback(raw)}</pre>`
      );
    }
  }, [markdown]);

  if (!html) return null;

  return (
    <div
      className={`prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600 prose-pre:bg-slate-900 prose-pre:text-slate-100 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
