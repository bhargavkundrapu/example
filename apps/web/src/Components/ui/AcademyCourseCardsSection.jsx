import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { COURSE_EXPLORE_DATA } from "../../data/courseExploreData";
import { COURSE_CARD_COVER } from "../../data/courseCardMedia";
import { cn } from "../../lib/utils";

// Order: All Pack first, then Vibe Coding, Prompt Engineering, Prompt to Profit, AI Automations
const CARDS_ORDER = ["all-pack", "vibe-coding", "prompt-engineering", "prompt-to-profit", "ai-automations"];
const CARD_ICONS = {
  "vibe-coding": "⚡",
  "prompt-engineering": "📝",
  "prompt-to-profit": "💰",
  "ai-automations": "🤖",
  "all-pack": "🎁",
};
const CARD_GRADIENTS = {
  "vibe-coding": "from-violet-500/20 to-fuchsia-500/20",
  "prompt-engineering": "from-indigo-500/20 to-blue-500/20",
  "prompt-to-profit": "from-orange-500/20 to-amber-500/20",
  "ai-automations": "from-teal-500/20 to-cyan-500/20",
  "all-pack": "from-purple-500/20 to-fuchsia-500/20",
};

export function AcademyCourseCardsSection() {
  return (
    <section
      id="courses"
      className="py-14 sm:py-16 md:py-20 bg-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Courses</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">All Pack & Courses</h2>
          <p className="mt-3 text-base text-white/60 max-w-2xl">
            All starting at just <span className="text-emerald-400 font-semibold">₹99</span>-pick individual courses or go all-in with the All Pack for the best value.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {CARDS_ORDER.map((slug) => {
            const data = COURSE_EXPLORE_DATA[slug];
            if (!data) return null;

            const isBonus = data.isBonus;
            const isPack = data.isPack;
            const exploreTo = `/courses/explore/${slug}`;
            const hours = data.durationHours;

            return (
              <div
                key={slug}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black min-h-[190px]",
                  "hover:border-white/20 transition-all duration-200"
                )}
              >
                <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-black">
                  <img
                    src={COURSE_CARD_COVER[slug]}
                    alt={`${data.title} Course cover`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                    aria-hidden
                  />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br",
                      CARD_GRADIENTS[slug] || "from-slate-500/20 to-slate-600/20"
                    )}
                  >
                    <span className="text-xl">{CARD_ICONS[slug] || "📚"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {hours != null && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/70 bg-white/10 border border-white/10 rounded-md px-2 py-1">
                        <Clock className="w-3 h-3 text-white/60" />
                        {hours} hrs
                      </span>
                    )}
                    {isPack && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/25 text-purple-400 border border-purple-500/30">
                        Best Value
                      </span>
                    )}
                    {isBonus && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/25 text-amber-400 border border-amber-500/30">
                        Bonus
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{data.title}</h3>
                <p className="text-sm text-white/55 line-clamp-2 flex-1">{data.tagline}</p>
                <div className="mt-auto pt-4 flex justify-end">
                  <Link
                    to={exploreTo}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/20 px-3 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Explore
                  </Link>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
