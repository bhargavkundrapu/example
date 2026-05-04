import {
  FiAlertTriangle,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiEdit3,
  FiLayers,
  FiTarget,
} from "react-icons/fi";
import LessonMarkdownBody from "./LessonMarkdownBody";

const PROSE_ARTICLE =
  [
    "prose-headings:font-bold prose-headings:text-slate-900 prose-headings:tracking-tight",
    "prose-h2:mt-0 prose-h2:mb-3 prose-h2:text-xl prose-h2:md:text-2xl",
    "prose-h3:text-lg prose-h3:mb-2",
    "prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-[15px]",
    "prose-li:marker:text-indigo-500 prose-li:text-slate-700",
    "prose-strong:text-slate-900",
    "[&_pre]:rounded-xl [&_pre]:border [&_pre]:border-slate-700/25 [&_pre]:shadow-inner [&_pre]:text-[13px]",
    "prose-code:text-[13px] prose-code:font-medium prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:rounded-none",
    "prose-blockquote:border-indigo-200 prose-blockquote:bg-indigo-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-0.5 prose-blockquote:not-italic",
  ].join(" ");

/** Map DB slide type + title cues → visual lane (Prompt Engineering lesson aesthetic). */
function inferSlideVariant(slide) {
  const rawType = String(slide?.type ?? "markdown")
    .toLowerCase()
    .replace(/-/g, "_");
  const byType = {
    goal: "mission",
    mission: "mission",
    overview: "mission",
    welcome: "mission",
    intro: "mission",
    tip: "callout",
    use_case: "callout",
    scenario: "callout",
    context: "callout",
    warning: "caution",
    mistake: "caution",
    caution: "caution",
    takeaway: "success",
    summary: "success",
    recap: "success",
    best_practice: "success",
    exercise: "practice",
    drill: "practice",
    lab: "practice",
    practice: "practice",
    concept: "deepDive",
    theory: "deepDive",
    reference: "deepDive",
    explain: "deepDive",
  };
  if (byType[rawType]) return byType[rawType];

  const title = String(slide?.title ?? "").toLowerCase();
  if (
    /^(introduction|welcome|overview|learning outcomes|what you('ll| will) learn|your mission|objectives)/i.test(
      title
    )
  )
    return "mission";
  if (/(mistake|caution|avoid|watch out|don't|weak|pitfall|wrong)/i.test(title))
    return "caution";
  if (/(pro tip|best practice|use this|golden rule|checkpoint|remember|key takeaway)/i.test(title))
    return "success";
  if (/(exercise|try it|hands-on|your turn|do this|task|lab)/i.test(title)) return "practice";
  if (/(when you|use case|why this matters|real world|context)/i.test(title)) return "callout";
  if (/(how it works|foundation|concept|deep dive|breaking down|understanding)/i.test(title))
    return "deepDive";

  const body = String(slide?.body ?? "");
  const firstH1 = body.match(/^#\s+(.+)$/m);
  const h = firstH1 ? firstH1[1].toLowerCase() : "";
  if (h && /(welcome|overview|mission|introduction)/.test(h)) return "mission";
  if (h && /(exercise|practice|try)/.test(h)) return "practice";

  return "default";
}

const VARIANT = {
  mission: {
    eyebrow: "Focus",
    chip: "Start here",
    accent: "from-blue-500 via-indigo-500 to-violet-500",
    railClass:
      "bg-gradient-to-b from-blue-700 via-indigo-700 to-violet-800 text-white border-slate-100/10",
    iconWrap: "bg-white/20 text-white ring-1 ring-white/35",
    headerClass: "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white",
    cardBorder: "border-indigo-200/80 shadow-md shadow-indigo-500/10",
    bodyClass: "bg-white",
    titleClass: "text-white",
    chipClass: "bg-white/15 text-white ring-1 ring-white/25",
    Icon: FiTarget,
  },
  callout: {
    eyebrow: "Context",
    chip: "Why it matters",
    accent: "bg-amber-400",
    railClass: "bg-white border-slate-100",
    iconWrap: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/80",
    headerClass: "bg-amber-50/95 border-b border-amber-200/70",
    cardBorder: "border-amber-200/90 shadow-sm",
    bodyClass: "bg-white",
    titleClass: "text-amber-950",
    chipClass: "bg-amber-100 text-amber-800",
    Icon: FiBriefcase,
  },
  caution: {
    eyebrow: "Watch out",
    chip: "Common trap",
    accent: "bg-red-400",
    railClass: "bg-white border-slate-100",
    iconWrap: "bg-red-100 text-red-600 ring-1 ring-red-200/80",
    headerClass: "bg-red-50/95 border-b border-red-200/70",
    cardBorder: "border-red-200/90 shadow-sm",
    bodyClass: "bg-white",
    titleClass: "text-red-950",
    chipClass: "bg-red-100 text-red-800",
    Icon: FiAlertTriangle,
  },
  success: {
    eyebrow: "Level up",
    chip: "Pro move",
    accent: "bg-emerald-400",
    railClass: "bg-white border-slate-100",
    iconWrap: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80",
    headerClass: "bg-emerald-50/95 border-b border-emerald-200/70",
    cardBorder: "border-emerald-200/90 shadow-sm",
    bodyClass: "bg-white",
    titleClass: "text-emerald-950",
    chipClass: "bg-emerald-100 text-emerald-800",
    Icon: FiCheckCircle,
  },
  practice: {
    eyebrow: "Do this now",
    chip: "Hands-on",
    accent: "bg-violet-400",
    railClass: "bg-white border-slate-100",
    iconWrap: "bg-violet-100 text-violet-700 ring-1 ring-violet-200/80",
    headerClass: "bg-violet-50/95 border-b border-violet-200/70",
    cardBorder: "border-violet-200/90 shadow-sm",
    bodyClass: "bg-white",
    titleClass: "text-violet-950",
    chipClass: "bg-violet-100 text-violet-800",
    Icon: FiEdit3,
  },
  deepDive: {
    eyebrow: "Core idea",
    chip: "Read carefully",
    accent: "bg-slate-400",
    railClass: "bg-white border-slate-100",
    iconWrap: "bg-slate-200 text-slate-800 ring-1 ring-slate-300/80",
    headerClass: "bg-slate-50 border-b border-slate-200",
    cardBorder: "border-slate-200 shadow-sm",
    bodyClass: "bg-white",
    titleClass: "text-slate-900",
    chipClass: "bg-slate-200/80 text-slate-800",
    Icon: FiBookOpen,
  },
  default: {
    eyebrow: "Lesson section",
    chip: null,
    accent: "from-indigo-500 to-blue-600",
    railClass: "bg-white border-slate-100",
    iconWrap: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/80",
    headerClass: "bg-gradient-to-r from-indigo-50/95 via-white to-slate-50/90 border-b border-slate-100",
    cardBorder: "border-slate-200 shadow-sm",
    bodyClass: "bg-white",
    titleClass: "text-slate-900",
    chipClass: "bg-slate-100 text-slate-600",
    Icon: FiLayers,
  },
};

function displayTitle(slide, idx) {
  const t = slide?.title && String(slide.title).trim();
  if (!t || t === "Lesson content") {
    return `Section ${idx + 1}`;
  }
  return t;
}

/**
 * Renders `lesson_slides` with section chrome aligned to PromptEngineeringSections
 * (accent bar, icon tile, eyebrow, optional chip, centered reading column).
 */
export default function LessonSlidesReader({ slides }) {
  if (!Array.isArray(slides) || slides.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 md:space-y-8 pb-2">
      <div className="flex items-center gap-3 px-0 sm:px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200/70" />
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <FiBookOpen className="w-4 h-4 text-indigo-500" aria-hidden />
          Reading
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-slate-200/70" />
      </div>

      {slides.map((s, idx) => {
        const key = s.id ?? `slide-${idx}`;
        const variantKey = inferSlideVariant(s);
        const v = VARIANT[variantKey] || VARIANT.default;
        const Icon = v.Icon;
        const headline = displayTitle(s, idx);
        const eyebrowMuted =
          variantKey === "mission" ? "text-blue-100/90" : "text-slate-500";

        const topAccentClass = v.accent.startsWith("bg-")
          ? `h-1.5 ${v.accent}`
          : `h-1.5 bg-gradient-to-r ${v.accent}`;

        const railBorder =
          variantKey === "mission" ? "border-white/10" : "border-slate-100";

        return (
          <section
            key={key}
            id={`lesson-slide-${s.id ?? idx}`}
            className={`scroll-mt-24 rounded-2xl border overflow-hidden ${v.cardBorder}`}
          >
            <div className={topAccentClass} aria-hidden />

            <div className="flex flex-col md:flex-row md:items-stretch gap-0">
              <div
                className={`md:w-[4.75rem] flex md:flex-col items-center justify-center gap-2 py-4 md:py-5 px-4 md:px-0 md:border-r ${railBorder} ${v.railClass}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${v.iconWrap}`}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
                <span
                  className={`md:[writing-mode:vertical-rl] md:rotate-180 text-[10px] font-bold uppercase tracking-wider ${eyebrowMuted} md:mt-1 text-center`}
                >
                  {v.eyebrow}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <header className={`px-4 sm:px-6 py-4 ${v.headerClass}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${variantKey === "mission" ? "text-blue-100" : "text-slate-400"}`}
                    >
                      Section {idx + 1}
                      <span className="mx-1.5 opacity-40">·</span>
                      {slides.length} total
                    </span>
                    {v.chip ? (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${v.chipClass}`}
                      >
                        {v.chip}
                      </span>
                    ) : null}
                  </div>
                  <h2 className={`text-lg md:text-xl font-bold leading-snug ${v.titleClass}`}>
                    {headline}
                  </h2>
                </header>

                <div className={`px-4 sm:px-6 py-5 md:py-6 ${v.bodyClass}`}>
                  <LessonMarkdownBody
                    markdown={s.body}
                    className={`prose prose-slate max-w-none ${PROSE_ARTICLE}`}
                  />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
