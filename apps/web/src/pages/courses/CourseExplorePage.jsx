import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "../../Components/ui/header-2";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { COURSE_EXPLORE_DATA } from "../../data/courseExploreData";
import { COURSE_CARD_COVER, COURSE_CARD_FALLBACK } from "../../data/courseCardMedia";
import { FiCheck, FiArrowLeft, FiBookOpen, FiZap, FiTarget, FiTool, FiAward, FiHeart, FiCompass } from "react-icons/fi";
import { cn } from "../../lib/utils";
import { getToolIcon, getToolIconColor } from "../../lib/toolIcons";

const ACADEMY_COURSES_HASH = "/academy#courses";
const COURSE_ROUTE_BASE = "/courses";

export default function CourseExplorePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const data = COURSE_EXPLORE_DATA[slug];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slug]);

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-slate-400">Course not found</p>
          <button
            onClick={() => navigate(ACADEMY_COURSES_HASH)}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const hasWhatYouCanDo = Array.isArray(data.whatYouCanDo) && data.whatYouCanDo.length > 0;
  const hasRealWorldScenarios = Array.isArray(data.realWorldScenarios) && data.realWorldScenarios.length > 0;
  const topCtaLabel = data.isPack
    ? "Explore All Courses"
    : data.isBonus
      ? "Get This via All Pack"
      : "Browse Courses";

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 pt-24 sm:pt-28 pb-12 md:pb-24">
        <button
          onClick={() => navigate(ACADEMY_COURSES_HASH)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        {/* Hero-warm and simple */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                data.isPack && "bg-purple-500/15 text-purple-400 border border-purple-500/25",
                data.isBonus && !data.isPack && "bg-amber-500/15 text-amber-400 border border-amber-500/25"
              )}
            >
              {data.isPack ? "BEST VALUE" : data.isBonus ? "BONUS WITH ALL PACK" : "COURSE"}
            </span>
            {data.isPack && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ★ RECOMMENDED
              </span>
            )}
          </div>
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] aspect-[21/9] sm:aspect-[2/1]">
            <img
              src={COURSE_CARD_COVER[slug] ?? COURSE_CARD_FALLBACK}
              alt={`${data.title} Course cover`}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" aria-hidden />
          </div>
          <div className="mb-7">
            <button
              onClick={() => navigate(COURSE_ROUTE_BASE)}
              className={cn(
                "inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all",
                "shadow-lg shadow-violet-500/20 hover:scale-[1.02] hover:opacity-95",
                `bg-gradient-to-r ${data.gradient}`
              )}
            >
              {topCtaLabel}
            </button>
          </div>
          <h1
            className={cn(
              "text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent",
              `bg-gradient-to-r ${data.gradient}`
            )}
          >
            {data.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-2">{data.tagline}</p>
          <p className="text-base text-white/60 max-w-2xl mb-3">{data.description}</p>
          {data.warmIntro && (
            <p className="text-sm text-white/70 italic border-l-2 border-white/30 pl-4 py-1">
              {data.warmIntro}
            </p>
          )}
        </header>

        {/* Price line */}
        <div className="mb-10 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
          <p className="text-sm text-white/60">
            All starting at just <span className="text-emerald-400 font-semibold">₹99</span>-pick this course or go all-in with the All Pack.
          </p>
        </div>

        {/* What is this course-simple words */}
        <section className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-white">
            <FiBookOpen className="w-5 h-5 text-white/70" />
            What is this course?
          </h2>
          <p className="text-white/75 leading-relaxed text-base">{data.whatIs}</p>
        </section>

        {/* What you can do with this course-right place, high impact */}
        {hasWhatYouCanDo && (
          <section className="mb-12 p-6 rounded-2xl border border-white/10 bg-white/[0.04]">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-2 text-white">
              <FiCompass className="w-5 h-5 text-emerald-400" />
              What you can do with this course
            </h2>
            <p className="text-sm text-white/55 mb-5">After finishing, you’ll be able to:</p>
            <ul className="space-y-3">
              {data.whatYouCanDo.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80 text-sm sm:text-base leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <FiCheck className="w-3 h-3 text-emerald-400" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Real-world scenarios-relatable */}
        {hasRealWorldScenarios && (
          <section className="mb-12">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-white">
              <FiHeart className="w-5 h-5 text-rose-400" />
              Real-world scenarios
            </h2>
            <p className="text-sm text-white/55 mb-4">Imagine yourself in situations like these:</p>
            <div className="space-y-4">
              {data.realWorldScenarios.map((scenario, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.03] text-white/80 text-sm sm:text-base leading-relaxed"
                >
                  {scenario}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Curriculum */}
        <section className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-white">
            <FiTarget className="w-5 h-5 text-white/70" />
            {data.isPack ? "Courses included" : "What’s inside"}
          </h2>
          <ul className="space-y-2">
            {(data.curriculum || data.courses || []).map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-white/75 text-sm sm:text-base">
                <FiCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Extra benefits (pack only) */}
        {data.isPack && data.extraBenefits && (
          <section className="mb-12 p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5">
            <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-purple-300">
              <FiZap className="w-5 h-5 text-purple-400" />
              Extra you get
            </h2>
            <ul className="space-y-3">
              {data.extraBenefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 text-white/90 text-sm sm:text-base">
                  <FiCheck className="w-5 h-5 text-purple-400 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Uses-what you'll use it for */}
        <section className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-bold mb-4 text-white">
            <FiZap className="w-5 h-5 text-white/70" />
            What you’ll use it for
          </h2>
          <ul className="space-y-2">
            {data.uses.map((use, i) => (
              <li key={i} className="flex items-start gap-3 text-white/70 text-sm sm:text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 mt-2 shrink-0" />
                {use}
              </li>
            ))}
          </ul>
        </section>

        {/* Transformation */}
        <section className="mb-12 p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
          <h2 className="flex items-center gap-2 text-xl font-bold mb-3 text-white">
            <FiAward className="w-5 h-5 text-amber-400" />
            Your transformation
          </h2>
          <p className="text-white/55 text-sm mb-4">By the end, you’ll move from:</p>
          <ul className="space-y-2">
            {data.transformation.map((t, i) => (
              <li key={i} className="flex items-center gap-3 text-white/75 text-sm sm:text-base">
                <FiCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Why it matters */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-3 text-white">Why this course matters</h2>
          <p className="text-white/75 leading-relaxed text-sm sm:text-base">{data.importance}</p>
        </section>

        {/* Tools */}
        <section className="mb-12 p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
          <h2 className="flex items-center gap-2 text-xl font-bold mb-2 text-white">
            <FiTool className="w-5 h-5 text-purple-400" />
            Tools you’ll work with
          </h2>
          <p className="text-sm text-white/50 mb-4">You’ll get hands-on with:</p>
          <div className="flex flex-wrap gap-3">
            {data.tools.map((tool, i) => {
              const Icon = getToolIcon(tool);
              const iconColor = getToolIconColor(tool);
              return (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
                    "border-purple-500/25 bg-purple-500/10 text-purple-200"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", iconColor)} aria-hidden />
                  {tool}
                </span>
              );
            })}
          </div>
        </section>

        {/* Related Courses */}
        <section className="mb-12 border-t border-white/10 pt-10">
          <h3 className="text-xl font-bold mb-4 text-white">Other Courses You Might Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(COURSE_EXPLORE_DATA)
              .filter((k) => k !== slug)
              .map((k) => {
                const item = COURSE_EXPLORE_DATA[k];
                return (
                  <Link
                    key={k}
                    to={`/courses/explore/${k}`}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-base font-semibold text-white">{item.title}</h4>
                      <p className="text-xs text-white/50 mt-1 line-clamp-2">{item.tagline}</p>
                    </div>
                    <span className="text-xs text-purple-400 font-medium mt-3 inline-flex items-center gap-1">
                      Explore course →
                    </span>
                  </Link>
                );
              })}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center">
          <p className="text-white/60 mb-4 text-sm sm:text-base">
            {data.isPack
              ? "Get all courses + Real Client Lab + Resume Builder in one pack."
              : data.isBonus
                ? "Get the All Pack to unlock this course + Real Client Lab."
                : "Ready to start? Get this course or the All Pack for everything."}
          </p>
          <button
            onClick={() => navigate(COURSE_ROUTE_BASE)}
            className={cn(
              "px-8 py-4 rounded-xl font-semibold text-white transition-all",
              `bg-gradient-to-r ${data.gradient}`,
              "hover:opacity-90 hover:scale-[1.02]"
            )}
          >
            View pricing & get started
          </button>
        </div>
      </div>

      <footer className="w-full min-h-[560px] sm:min-h-[70vh] border-t border-black mt-12">
        <TubesBackground className="min-h-[560px] sm:min-h-[70vh] bg-[#0a0a0a]" enableClickInteraction={true}>
          <FlowTubesFooterInner shellClassName="min-h-[560px] sm:min-h-[70vh]" />
        </TubesBackground>
      </footer>
    </div>
  );
}
