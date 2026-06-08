"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "./button";
import { Badge } from "./badge";
import { CheckIcon, SparklesIcon, BookOpen, Rocket, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { getToolIcon, getToolIconColor } from "../../lib/toolIcons";
import { apiFetch } from "../../services/api";
import { BuyNowModal } from "../payments/BuyNowModal";
import { CoursesPageSkeleton } from "../common/SkeletonLoaders";
import { COURSE_EXPLORE_DATA, COURSE_DURATION_HOURS } from "../../data/courseExploreData";
import { COURSE_CARD_COVER, COURSE_CARD_FALLBACK, getFeatureCardCover } from "../../data/courseCardMedia";
import { PriceCountdown, getOfferEndsAt24h } from "./price-countdown";

function formatPrice(paise: number | null | undefined) {
  if (paise == null || paise === undefined) return "-";
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

function getDiscountPercent(priceInPaise: number | null | undefined, mrpRupees: number) {
  if (priceInPaise == null || priceInPaise === undefined || mrpRupees <= 0) return 0;
  const priceRupees = Math.round(priceInPaise / 100);
  const discount = mrpRupees - priceRupees;
  if (discount <= 0) return 0;
  return Math.round((discount / mrpRupees) * 100);
}

const MARKETING_MRP_RUPEES = 1999;
const MARKETING_MRP_LABEL = `₹${MARKETING_MRP_RUPEES.toLocaleString("en-IN")}`;
const MARKETING_PACK_MRP_RUPEES = 4999;
const MARKETING_PACK_MRP_LABEL = `₹${MARKETING_PACK_MRP_RUPEES.toLocaleString("en-IN")}`;

const courseDisplayNames: Record<string, string> = {
  "vibe-coding": "Vibe Coding",
  "prompt-engineering": "Prompt Engineering",
  "prompt-to-profit": "Prompt to Profit",
  "ai-automations": "AI Automations",
};
// const BONUS_SLUGS = ["ai-automations"];
// const COURSE_ORDER = ["vibe-coding", "prompt-engineering", "prompt-to-profit", "ai-automations"];

function matchCourse(co: { slug?: string; title?: string }, orderSlug: string) {
  const s = (co.slug || "").toLowerCase().replace(/_/g, "-");
  const t = (co.title || "").toLowerCase().replace(/_/g, "-");
  const combined = `${s} ${t}`;
  const parts = orderSlug.split("-");
  return parts.every((p) => combined.includes(p));
}

function FilledCheck() {
  return (
    <div className="rounded-full bg-purple-500/20 p-0.5 text-purple-400">
      <CheckIcon className="size-3" strokeWidth={3} />
    </div>
  );
}

export function PricingWithChart() {
  const [courses, setCourses] = useState<
    { id: string; title: string; slug: string; price_in_paise?: number; description?: string }[]
  >([]);
  const [packs, setPacks] = useState<
    { id: string; title: string; slug: string; price_in_paise?: number; description?: string; courses?: { title?: string }[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "course" | "pack";
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coursesRes, packsRes] = await Promise.allSettled([
          apiFetch("/api/v1/courses").catch(() => ({ data: [] })),
          apiFetch("/api/v1/packs").catch(() => ({ data: [] })),
        ]);
        const courseData = coursesRes.status === "fulfilled" ? (coursesRes.value as { data?: unknown[] })?.data : [];
        const packData = packsRes.status === "fulfilled" ? (packsRes.value as { data?: unknown[] })?.data : [];
        setCourses(Array.isArray(courseData) ? (courseData as typeof courses) : []);
        setPacks(Array.isArray(packData) ? (packData as typeof packs) : []);
      } catch {
        setCourses([]);
        setPacks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGetCourse = (item: {
    type: "course" | "pack";
    id: string;
    title: string;
  }) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  if (loading) {
    return <CoursesPageSkeleton />;
  }


  const allPack = packs.find((p) => (p.slug || "").includes("all-pack") || (p.slug || "").includes("pack")) || packs[0];
  const offerEndsAt = getOfferEndsAt24h();

  // Bento grid: row1 [All Pack 5][Vibe 3], row2 [PE 4][PtP 4], row3 [AA 8]
  const vibeCourse = courses.find((co) => (co.slug || "").toLowerCase().replace(/_/g, "-").includes("vibe-coding") || matchCourse(co, "vibe-coding"));
  const peCourse = courses.find((co) => (co.slug || "").toLowerCase().replace(/_/g, "-").includes("prompt-engineering") || matchCourse(co, "prompt-engineering"));
  const ptpCourse = courses.find((co) => (co.slug || "").toLowerCase().replace(/_/g, "-").includes("prompt-to-profit") || matchCourse(co, "prompt-to-profit"));
  const aaCourse = courses.find((co) => (co.slug || "").toLowerCase().replace(/_/g, "-").includes("ai-automations") || matchCourse(co, "ai-automations"));

  function CourseBentoCard({
    orderSlug,
    course,
    displayTitle,
    isBonus,
    colSpan,
  }: {
    orderSlug: string;
    course: { id: string; title: string; slug: string; price_in_paise?: number; description?: string } | undefined;
    displayTitle: string;
    isBonus: boolean;
    colSpan: string;
  }) {
    const canBuy = !isBonus && !!course && (Number(course.price_in_paise) ?? 0) >= 100;
    const features = isBonus
      ? ["Free when you buy All Pack", "12 modules • 62 lessons", "MCA- & MSME-recognised certificate"]
      : ["Self-paced learning", "MCA- & MSME-recognised certificate on completion"];
    const coverSrc =
      COURSE_CARD_COVER[orderSlug as keyof typeof COURSE_CARD_COVER] ?? COURSE_CARD_FALLBACK;
    return (
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]",
          colSpan
        )}
      >
        <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden bg-white/5">
          <img src={coverSrc} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" aria-hidden />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant={isBonus ? "outline" : "secondary"} className={isBonus ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-purple-500/30 text-purple-400 bg-purple-500/10"}>
              {isBonus ? "BONUS" : "INDIVIDUAL"}
            </Badge>
            <div className="ml-auto">
              <Link to={`/courses/explore/${orderSlug}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/20 px-3 text-sm text-white/90 hover:bg-white/10 transition-colors">
                <BookOpen className="h-4 w-4" />
                Explore
              </Link>
            </div>
          </div>
          <div className="mb-3">
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-2">{displayTitle}</h3>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="font-mono text-4xl font-semibold tracking-tight text-white">
                {isBonus ? "Free" : formatPrice(course?.price_in_paise)}
              </span>
              {!isBonus && course?.price_in_paise != null && (
                <>
                  <span className="line-through text-white/40 text-lg font-medium">
                    {MARKETING_MRP_LABEL}
                  </span>
                  <span className="text-emerald-400 text-base font-bold">
                    {getDiscountPercent(course.price_in_paise, MARKETING_MRP_RUPEES)}% off
                  </span>
                </>
              )}
            </div>
            {!isBonus && course?.price_in_paise != null && (
              <p className="text-white/50 text-sm mt-1">one-time</p>
            )}
          </div>
          {COURSE_DURATION_HOURS[orderSlug as keyof typeof COURSE_DURATION_HOURS] != null && (
            <p className="text-xs text-white/55 mb-2">
              <span className="text-white/70 font-medium">{COURSE_DURATION_HOURS[orderSlug as keyof typeof COURSE_DURATION_HOURS]} hrs</span> to complete
            </p>
          )}
          <p className="text-sm text-white/55 line-clamp-2 mb-4">{course?.description || "Self-paced learning"}</p>
          <ul className="text-white/60 space-y-2 text-sm mb-4 flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <FilledCheck />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {COURSE_EXPLORE_DATA[orderSlug as keyof typeof COURSE_EXPLORE_DATA]?.tools?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2">You&apos;ll work with</p>
              <div className="flex flex-wrap gap-2">
                {(COURSE_EXPLORE_DATA[orderSlug as keyof typeof COURSE_EXPLORE_DATA].tools || [])
                  .slice(0, ["prompt-to-profit", "vibe-coding", "prompt-engineering"].includes(orderSlug) ? 12 : 6)
                  .map((toolName, i) => {
                    const Icon = getToolIcon(toolName);
                    const iconColor = getToolIconColor(toolName);
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/85"
                      >
                        <Icon className={cn("size-3.5 shrink-0", iconColor)} aria-hidden />
                        <span>{toolName}</span>
                      </span>
                    );
                  })}
              </div>
            </div>
          )}
          {isBonus ? (
            <p className="text-center text-xs text-amber-400/90 py-1">Buy All Pack to get this course free</p>
          ) : (
            <>
              {canBuy && (
                <div className="mb-2.5 min-h-[1.5rem] flex items-center justify-center">
                  <PriceCountdown endsAt={offerEndsAt} className="text-center" />
                </div>
              )}
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (course) handleGetCourse({ type: "course", id: course.id, title: displayTitle });
                }}
                disabled={!canBuy}
                className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Course
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  function LmsFeatureBentoCard({
    slug,
    title,
    subtitle,
    features,
    colSpan,
    accent,
    exclusiveBundle,
  }: {
    slug: string;
    title: string;
    subtitle: string;
    features: string[];
    colSpan: string;
    accent: "orange" | "emerald";
    exclusiveBundle?: boolean;
  }) {
    const badgeClass =
      accent === "orange"
        ? "border-orange-500/35 text-orange-300 bg-orange-500/10"
        : "border-emerald-500/35 text-emerald-300 bg-emerald-500/10";
    const Icon = accent === "orange" ? Rocket : TrendingUp;
    const featureCover = getFeatureCardCover(slug);
    return (
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]",
          colSpan
        )}
      >
        <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden bg-white/5">
          <img src={featureCover} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" aria-hidden />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="outline" className={cn("border-white/20 text-white/80 bg-white/5", badgeClass)}>
              LMS
            </Badge>
            <div className="ml-auto">
              <Link
                to={`/features/${slug}`}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/20 px-3 text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Explore
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("size-5 shrink-0", accent === "orange" ? "text-orange-400" : "text-emerald-400")} aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide text-white/45">Student access</span>
          </div>
          {exclusiveBundle && (
            <div className="mb-3 rounded-lg border border-orange-500/30 bg-orange-500/[0.07] px-3 py-2 text-[11px] leading-snug text-orange-100/90">
              <span className="font-semibold text-orange-200">All Pack / three-course bundle: </span>
              Included when you buy All Pack or own all three main courses-not with a single course alone.
            </div>
          )}
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-2">{title}</h3>
          <div className="flex items-end gap-2 mb-3">
            <span className="font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-white">Included</span>
            <span className="text-white/50 text-sm">with your LMS</span>
          </div>
          <p className="text-sm text-white/55 line-clamp-3 mb-4">{subtitle}</p>
          <ul className="text-white/60 space-y-2 text-sm mb-4 flex-1">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <FilledCheck />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button
            asChild
            className="w-full h-10 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg border border-white/15"
          >
            <Link to={`/features/${slug}`}>Learn more</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
          Pricing that Scales with You
        </h1>
        <p className="mt-2 text-sm text-white/60">
          All starting at just <span className="text-emerald-400 font-semibold">₹99</span>-pick individual courses or go all-in with the All Pack for the best value.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-8">
        {/* All Pack - bento hero card (lg:col-span-5) */}
        <div
          key="all-pack"
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] flex flex-col",
            "lg:col-span-5"
          )}
        >
          <div className="relative z-[2] aspect-[2.2/1] w-full max-h-44 overflow-hidden border-b border-white/10 sm:max-h-52">
            <img
              src={COURSE_CARD_COVER["all-pack"]}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/35 to-black/85" aria-hidden />
          </div>
          <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
            <div className="from-foreground/5 to-foreground/2 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 size-full mix-blend-overlay",
                  "bg-[linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px)]",
                  "bg-[size:24px]"
                )}
              />
            </div>
          </div>
          <div className="relative flex flex-wrap items-center gap-2 p-4">
            <Badge className="border-amber-500/30 bg-amber-500/20 text-amber-400">★ RECOMMENDED</Badge>
            <Badge className="border-orange-500/35 bg-orange-500/15 text-orange-200/95 text-[10px] uppercase tracking-wide">
              Bundle unlock
            </Badge>
            <Badge variant="outline" className="hidden lg:flex border-purple-500/30 text-purple-300">
              <SparklesIcon className="me-1 size-3" /> Most Recommended
            </Badge>
            <div className="ml-auto">
              <Link
                to="/courses/explore/all-pack"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/20 px-3 text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Explore
              </Link>
            </div>
          </div>
          <div className="relative flex flex-col flex-1 p-4 lg:flex-row lg:gap-6">
            <div className="pb-4 lg:w-[28%]">
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">All Pack</h3>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="font-mono text-5xl font-semibold tracking-tight text-purple-400 block">
                  {formatPrice(allPack?.price_in_paise)}
                </span>
                {allPack?.price_in_paise != null && (
                  <>
                    <span className="line-through text-white/40 text-lg font-medium">
                      {MARKETING_PACK_MRP_LABEL}
                    </span>
                    <span className="text-emerald-400 text-base font-bold">
                      {getDiscountPercent(allPack.price_in_paise, MARKETING_PACK_MRP_RUPEES)}% off
                    </span>
                  </>
                )}
              </div>
              <span className="text-white/50 text-sm">one-time</span>
              {COURSE_EXPLORE_DATA["all-pack"]?.durationHours != null && (
                <p className="text-xs text-purple-300/80 mt-1">{COURSE_EXPLORE_DATA["all-pack"].durationHours} hrs of learning</p>
              )}
            </div>
            <ul className="text-white/70 grid gap-2 text-sm lg:w-[72%]">
              <li className="flex items-center gap-3">
                <FilledCheck />
                <Link to="/courses/explore/vibe-coding" className="font-medium text-white/90 hover:text-white-400 transition-colors">
                  <span className="font-medium text-white/90">Vibe Coding</span>
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <FilledCheck />
                <Link to="/courses/explore/prompt-engineering" className="font-medium text-white/90 hover:text-white-400 transition-colors">
                  <span className="font-medium text-white/90">Prompt Engineering</span>
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <FilledCheck />
                <Link to="/courses/explore/prompt-to-profit" className="font-medium text-white/90 hover:text-white-400 transition-colors">
                  <span className="font-medium text-white/90">Prompt to Profit</span>
                </Link>
              </li>
              <li className="flex items-center gap-3 ">
                <FilledCheck />
                <Link to="/features/jobs-search-hub" className="font-medium text-emerald-300/95 hover:text-emerald-200 transition-colors">
                  Jobs Search Hub
                </Link>
              </li>
              <li className="flex items-center gap-3 ">
                <FilledCheck />
                <Link to="/features/resume-builder" className="font-medium text-white/90 hover:text-white-400 transition-colors">
                  <span className="font-medium text-white/90">Resume Builder</span>
                </Link>
              </li>
              <li className="flex items-center gap-3 ">
                <FilledCheck />
                <span className="font-medium text-white/90">MCA- & MSME-recognised certificates</span>
              </li>
              <li className="flex items-center gap-3  border-t border-white/10 pt-2 mt-1 ">

                <span className="text-2xl sm:text-3xl font-bold text-purple-250 leading-tight mb-2">Features get for only who took all pack or all individual courses:</span>
              </li>
              <li className="flex items-center gap-3">

                <FilledCheck />
                <Link to="/courses/explore/ai-automations" className="font-medium text-white/90 hover:text-white-400 transition-colors">
                  <span className="text-amber-400/95 font-medium">AI Automations (Bonus)</span>
                </Link>
              </li>
              <li className="flex items-center gap-3 ">
                <FilledCheck />
                <Link to="/features/real-client-lab" className="font-medium text-purple-300 hover:text-purple-400 transition-colors">
                  Real Client Lab
                </Link>
              </li>

              <li className="flex items-center gap-3 ">
                <FilledCheck />
                <Link to="/features/startup-launchpad" className="font-medium text-orange-300/95 hover:text-orange-200 transition-colors">
                  Startup LaunchPad
                </Link>
              </li>

            </ul>
          </div>

          <div className="relative p-4 pt-0">
            {allPack && (
              <>
                {(allPack.price_in_paise ?? 0) >= 100 && (
                  <div className="mb-2.5 min-h-[1.5rem] flex items-center justify-center">
                    <PriceCountdown endsAt={offerEndsAt} className="text-center" />
                  </div>
                )}
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGetCourse({ type: "pack", id: allPack.id, title: "All Pack" });
                  }}
                  disabled={!allPack || (Number(allPack.price_in_paise) ?? 0) < 100}
                  className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Pack
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Vibe Coding - lg:col-span-3 */}
        <CourseBentoCard
          orderSlug="vibe-coding"
          course={vibeCourse}
          displayTitle={courseDisplayNames["vibe-coding"]}
          isBonus={false}
          colSpan="lg:col-span-3"
        />

        {/* Prompt Engineering - lg:col-span-4 */}
        <CourseBentoCard
          orderSlug="prompt-engineering"
          course={peCourse}
          displayTitle={courseDisplayNames["prompt-engineering"]}
          isBonus={false}
          colSpan="lg:col-span-4"
        />

        {/* Prompt to Profit - lg:col-span-4 */}
        <CourseBentoCard
          orderSlug="prompt-to-profit"
          course={ptpCourse}
          displayTitle={courseDisplayNames["prompt-to-profit"]}
          isBonus={false}
          colSpan="lg:col-span-4"
        />

        {/* AI Automations - lg:col-span-8 */}
        <CourseBentoCard
          orderSlug="ai-automations"
          course={aaCourse}
          displayTitle={courseDisplayNames["ai-automations"]}
          isBonus={true}
          colSpan="lg:col-span-8"
        />

        <LmsFeatureBentoCard
          slug="startup-launchpad"
          title="Startup LaunchPad"
          subtitle="A guided founder path inside the student portal-readiness, stages, tools, and legal timing (not a course flow)."
          features={["12-stage startup path", "Readiness & dashboard", "Founder tools & AI prompts"]}
          colSpan="lg:col-span-4"
          accent="orange"
          exclusiveBundle
        />
        <LmsFeatureBentoCard
          slug="jobs-search-hub"
          title="Jobs Search Hub"
          subtitle="Role presets, keyword chips, and one-tap searches across LinkedIn, Naukri, Internshala & more-your career command center."
          features={["India role presets", "Platform-aware search URLs", "Saved searches & apply tracker"]}
          colSpan="lg:col-span-4"
          accent="emerald"
        />
      </div>

      <BuyNowModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onSuccess={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        onError={() => { }}
        prefill={{}}
        isLoggedIn={false}
        fromCourseRoute
      />
    </div>
  );
}
