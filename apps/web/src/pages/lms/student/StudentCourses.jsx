import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  getStudentCourseLandingPath,
  getStudentLessonPath,
  getStudentBonusCourseLandingPath,
  getStudentBonusLessonPath,
  isAiToolsMasteryStudentsSlug,
  isAiAutomationsSlug,
  isStudentBonusCatalogSlug,
} from "../../../utils/studentCoursePaths";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTheme } from "../../../app/providers/ThemeProvider";
import { useDashboardPrefs } from "../../../app/providers/DashboardPrefsProvider";
import { apiFetch } from "../../../services/api";
import { StudentCoursesSkeleton } from "../../../Components/common/SkeletonLoaders";
import PageTransition from "../../../Components/common/PageTransition";
import {
  FiCheck,
  FiGlobe,
  FiCode,
  FiBookOpen,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiClock,
  FiLock,
  FiZap,
} from "react-icons/fi";
import { AnimatePresence } from "framer-motion";
import { BuyNowModal } from "../../../Components/payments/BuyNowModal";
import { COURSE_EXPLORE_DATA, COURSE_DURATION_HOURS } from "../../../data/courseExploreData";
import { getCourseCardCover } from "../../../data/courseCardMedia";

// Display order on student LMS courses route: Vibe Coding → Prompt Engineering → Prompt to Profit → others
// Include "vibe coading" (common typo in DB/seeds) so it still sorts first
const COURSE_DISPLAY_ORDER = ["vibe-coding", "vibe-coading", "prompt-engineering", "prompt-to-profit", "ai-automations"];
const COURSE_TITLE_ORDER = ["vibe coding", "vibe coading", "prompt engineering", "prompt to profit", "ai automations"];

function getCourseDurationHours(course) {
  if (!course) return null;
  // Normalize: lower case, underscores and spaces to hyphens (so "vibe coding" / "vibe_coding" → "vibe-coding")
  const slug = (course.slug || "").toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-").trim();
  const title = (course.title || "").toLowerCase();
  if (COURSE_DURATION_HOURS[slug] != null) return COURSE_DURATION_HOURS[slug];
  if (slug.includes("vibe") && (slug.includes("cod") || slug.includes("coading"))) return 12;
  if (slug.includes("prompt-engineering") || title.includes("prompt engineering")) return 30;
  if (slug.includes("prompt-to-profit") || title.includes("prompt to profit")) return 30;
  if (slug.includes("ai-automation") || title.includes("ai automation")) return 30;
  if (isAiToolsMasteryStudentsSlug(slug) || title.includes("ai tools mastery")) return 15;
  return null;
}

function courseOrderIndex(course) {
  const slug = (course?.slug || "").toLowerCase().replace(/_/g, "-").trim();
  const title = (course?.title || "").toLowerCase().trim();
  let idx = COURSE_DISPLAY_ORDER.indexOf(slug);
  if (idx === -1 && title) {
    idx = COURSE_TITLE_ORDER.findIndex((t) => title.includes(t) || t.includes(title));
  }
  // Normalize: "vibe coading" (typo) and "vibe coding" both sort first
  if (idx === 1) idx = 0; // vibe-coading → same as vibe-coding
  return idx === -1 ? 999 : idx;
}

export default function StudentCourses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const { isDark } = useTheme();
  const { isPinned, togglePinCourse } = useDashboardPrefs();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyItem, setBuyItem] = useState(null);
  const openedFromUrlRef = useRef(false);
  const [fetchError, setFetchError] = useState("");
  const [studentMe, setStudentMe] = useState(null);
  const [allPackOffer, setAllPackOffer] = useState(null);
  const continueTargetsRef = useRef({});
  const continuePrefetchingRef = useRef(new Set());

  // Check if we're on the bonus courses page
  const isBonusCoursesPage = location.pathname.includes("bonus-courses");

  useEffect(() => {
    if (!token) return;
    fetchCourses();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [meRes, packsRes] = await Promise.allSettled([
          apiFetch("/api/v1/me", { token }),
          apiFetch("/api/v1/packs").catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        if (meRes.status === "fulfilled" && meRes.value?.ok) setStudentMe(meRes.value.data || null);
        const packData = packsRes.status === "fulfilled" ? packsRes.value?.data : null;
        const list = Array.isArray(packData) ? packData : [];
        const ap =
          list.find((p) => (p.slug || "").toLowerCase().includes("all-pack")) ||
          list.find((p) => (p.slug || "").toLowerCase().includes("pack")) ||
          list[0] ||
          null;
        setAllPackOffer(ap);
      } catch {
        if (!cancelled) setStudentMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Warm a few "Continue Learning" targets in the background so click navigates immediately.
  useEffect(() => {
    if (!token) return;
    if (!Array.isArray(courses) || courses.length === 0) return;
    if (typeof window === "undefined") return;

    const enrolledCandidates = courses.filter((c) => c?.enrolled === true && c?.slug).slice(0, 3);
    if (enrolledCandidates.length === 0) return;

    const timer = window.setTimeout(() => {
      enrolledCandidates.forEach(async (c) => {
        const slug = c.slug;
        if (continueTargetsRef.current[slug] || continuePrefetchingRef.current.has(slug)) return;
        continuePrefetchingRef.current.add(slug);
        try {
          const res = await apiFetch(`/api/v1/student/courses/${slug}/continue-target`, { token }).catch(() => null);
          const target = res?.data ?? null;
          if (!target?.moduleSlug || !target?.lessonSlug) return;
          continueTargetsRef.current[slug] = {
            moduleSlug: target.moduleSlug,
            lessonSlug: target.lessonSlug,
          };
        } finally {
          continuePrefetchingRef.current.delete(slug);
        }
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [courses, token, location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search") || params.get("q") || "";
    if (q) setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const courseSlug = params.get("course");
    if (courseSlug && courses.length > 0 && !openedFromUrlRef.current) {
      const c = courses.find((co) => co.slug === courseSlug);
      if (c) {
        openedFromUrlRef.current = true;
        if (c.enrolled) handleCourseClick(c);
        else openBuyModal(c);
      }
    }
  }, [location.search, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await apiFetch("/api/v1/student/courses", { token }).catch(() => ({ data: [] }));
      const list = Array.isArray(res?.data) ? res.data : [];
      list.sort((a, b) => courseOrderIndex(a) - courseOrderIndex(b));
      setCourses(list);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setFetchError(error?.message || "Failed to load courses. Please refresh the page.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseSlug) => {
    try {
      setLoadingDetails(true);
      const res = await apiFetch(`/api/v1/student/courses/${courseSlug}`, { token }).catch(() => ({ data: null }));
      if (res?.data?.course) {
        setCourseDetails(res.data.course);
      } else if (res?.course) {
        setCourseDetails(res.course);
      }
    } catch (error) {
      console.error("Failed to fetch course details:", error);
      setCourseDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCourseClick = async (course) => {
    if (!course.enrolled) {
      openBuyModal(course);
      return;
    }
    setSelectedCourse(course);
    await fetchCourseDetails(course.slug);
  };

  const handleContinueLearning = async (course, e) => {
    e.stopPropagation();
    if (!course?.slug) return;
    try {
          const cached = continueTargetsRef.current[course.slug];
          if (cached?.moduleSlug && cached?.lessonSlug) {
            const onBonusTab = location.pathname.includes("bonus-courses");
            const toBonusLesson = onBonusTab && !isAiAutomationsSlug(course.slug);
            navigate(
              toBonusLesson
                ? getStudentBonusLessonPath(course.slug, cached.moduleSlug, cached.lessonSlug)
                : getStudentLessonPath(course.slug, cached.moduleSlug, cached.lessonSlug)
            );
            return;
          }

      // Redirect directly to the first incomplete lesson for this course.
      // This avoids the extra `/courses/:slug?continue=1` roundtrip.
      const res = await apiFetch(`/api/v1/student/courses/${course.slug}/continue-target`, { token }).catch(() => null);
      const target = res?.data ?? null;

      const onBonusTab = location.pathname.includes("bonus-courses");
      const landingBase = onBonusTab && !isAiAutomationsSlug(course.slug)
        ? getStudentBonusCourseLandingPath(course.slug)
        : getStudentCourseLandingPath(course.slug);

      if (!target?.moduleSlug || !target?.lessonSlug) {
        navigate(`${landingBase}?continue=1`);
        return;
      }

      const lessonUrl =
        onBonusTab && !isAiAutomationsSlug(course.slug)
          ? getStudentBonusLessonPath(course.slug, target.moduleSlug, target.lessonSlug)
          : getStudentLessonPath(course.slug, target.moduleSlug, target.lessonSlug);
      navigate(lessonUrl);
    } catch {
      const onBonusTab = location.pathname.includes("bonus-courses");
      const landingBase = onBonusTab && !isAiAutomationsSlug(course.slug)
        ? getStudentBonusCourseLandingPath(course.slug)
        : getStudentCourseLandingPath(course.slug);
      navigate(`${landingBase}?continue=1`);
    }
  };

  const openBuyModal = (course) => {
    setBuyItem({ type: "course", id: course.id, title: course.title });
    setShowBuyModal(true);
  };

  const openPackBuyModal = () => {
    if (!allPackOffer?.id) {
      navigate("/courses#pricing");
      return;
    }
    setBuyItem({ type: "pack", id: allPackOffer.id, title: allPackOffer.title || "All Pack" });
    setShowBuyModal(true);
  };

  const handleBuySuccess = () => {
    setShowBuyModal(false);
    setBuyItem(null);
    fetchCourses();
    (async () => {
      try {
        const res = await apiFetch("/api/v1/me", { token });
        if (res?.ok) setStudentMe(res.data || null);
      } catch {
        /* ignore */
      }
    })();
    setTimeout(() => fetchCourses(), 1500);
  };

  const handleCloseModal = () => {
    setSelectedCourse(null);
    setCourseDetails(null);
    setExpandedTopics(new Set());
    openedFromUrlRef.current = false;
  };


  const toggleTopic = (topicId) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const isBonusCourse = (course) =>
    isAiAutomationsSlug(course?.slug) ||
    isAiToolsMasteryStudentsSlug(course?.slug) ||
    (course?.title || "").toLowerCase().includes("ai automation");

  /** Extra mini progress ring — shared by main grid and Bonus Courses tab */
  const CircularProgressMini = ({ percentage, size = 40 }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth="4" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#06b6d4"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{percentage}%</span>
        </div>
      </div>
    );
  };

  /** Vibe Coding, Prompt Engineering, Prompt to Profit - not bonus / not other courses */
  const isMainTrilogyCourse = (course) => {
    if (!course || isBonusCourse(course)) return false;
    const slug = (course.slug || "").toLowerCase().replace(/_/g, "-");
    const title = (course.title || "").toLowerCase();
    if (slug.includes("vibe") && (slug.includes("cod") || slug.includes("coad"))) return true;
    if (slug.includes("prompt-engineering") || title.includes("prompt engineering")) return true;
    if (slug.includes("prompt-to-profit") || title.includes("prompt to profit")) return true;
    return false;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0 Mins";
    const mins = Math.round(seconds / 60);
    return `${mins} Mins`;
  };

  const isTopicCompleted = (module) => {
    if (!module.lessons || module.lessons.length === 0) return false;
    return module.lessons.every((lesson) => lesson.completed);
  };

  const filteredCourses = courses
    .filter((course) => {
      if (!isBonusCoursesPage && isAiToolsMasteryStudentsSlug(course.slug)) return false;
      const matchesSearch =
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = filterLevel === "all" || course.level === filterLevel;
      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      const aPinned = isPinned(a.slug) ? 1 : 0;
      const bPinned = isPinned(b.slug) ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;
      return courseOrderIndex(a) - courseOrderIndex(b);
    });

  // Calculate overall progress (enrolled courses only)
  const enrolledCourses = courses.filter((c) => c.enrolled);
  const overallProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce((sum, c) => sum + (c.progress || 0), 0) / enrolledCourses.length
        )
      : 0;

  // Calculate total duration (assuming each course has duration)
  const totalDuration = courses.reduce((sum, course) => {
    const duration = course.duration || course.estimated_duration || 0;
    return sum + (typeof duration === 'number' ? duration : 0);
  }, 0);

  const enrolledMainTrilogyCount = courses.filter((c) => c.enrolled && isMainTrilogyCourse(c)).length;
  const showAllPackUpsell =
    !isBonusCoursesPage &&
    !!studentMe &&
    studentMe.pack_purchased !== true &&
    studentMe.client_lab_checklist?.hasAccess !== true &&
    enrolledMainTrilogyCount >= 1 &&
    enrolledMainTrilogyCount <= 2;

  const allPackPriceRupees =
    allPackOffer?.price_in_paise != null ? Math.round(Number(allPackOffer.price_in_paise) / 100) : null;

  if (loading) {
    return <StudentCoursesSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-3">{fetchError}</p>
        <button onClick={fetchCourses} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  // Bonus Courses tab — catalog cards (premium layout; mirrors My Courses styling)
  if (isBonusCoursesPage) {
    const bonusCatalogSortKey = (c) => {
      if (isAiToolsMasteryStudentsSlug(c.slug)) return 0;
      if (isAiAutomationsSlug(c.slug)) return 1;
      return 99;
    };
    const bonusCatalogCourses = courses
      .filter((c) => isStudentBonusCatalogSlug(c.slug))
      .sort((a, b) => bonusCatalogSortKey(a) - bonusCatalogSortKey(b));

    const landingForBonusCard = (c) =>
      isAiAutomationsSlug(c.slug) ? getStudentCourseLandingPath(c.slug) : getStudentBonusCourseLandingPath(c.slug);

    const cardSubline = (c) =>
      isAiToolsMasteryStudentsSlug(c.slug)
        ? "10 modules • 60 lessons • study-ready workflows — same polish as core paths."
        : "Automation workflows bundled free with your ExpoGraph journey — dive in anytime.";

    return (
      <PageTransition>
        <div className={`min-h-screen rounded-t-3xl overflow-hidden md:rounded-none transition-colors duration-200 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
          <div className="relative pb-24">
            <div className={`absolute inset-x-0 top-0 h-72 ${isDark ? "bg-gradient-to-b from-indigo-950/70 via-purple-950/40 to-transparent" : "bg-gradient-to-b from-indigo-50 via-purple-50/70 to-transparent"}`} />

            <div className={`relative px-4 md:px-8 pt-10 md:pt-14 pb-6 max-w-7xl mx-auto`}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.2em] font-bold mb-2 ${isDark ? "text-amber-300/95" : "text-amber-700"}`}>
                    Bonus catalogue
                  </p>
                  <h1 className={`text-3xl md:text-5xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Bonus courses
                  </h1>
                  <p className={`mt-2 max-w-2xl text-sm md:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Premium pathways included at no extra cost — structured like Vibe Coding and Prompt Engineering, tuned for mastery and portfolios.
                  </p>
                </div>
                <Link
                  to="/lms/student/courses"
                  className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition ${
                    isDark
                      ? "border-white/15 text-white hover:bg-white/5"
                      : "border-slate-200 bg-white text-slate-800 hover:border-indigo-200 hover:shadow-sm"
                  }`}
                >
                  My courses <FiChevronRight className="w-4 h-4 opacity-70" aria-hidden />
                </Link>
              </div>

              {bonusCatalogCourses.length === 0 ? (
                <div className={`rounded-2xl border p-10 md:p-14 text-center max-w-xl mx-auto ${isDark ? "bg-slate-900/70 border-white/10" : "bg-white border-slate-200 shadow-md"}`}>
                  <FiZap className={`mx-auto w-14 h-14 mb-6 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                  <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Publishing bonus catalog</h2>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Once AI Tools Mastery and AI Automations are published for your tenant, they appear here automatically.                     Administrators can publish the Markdown bundle by running{" "}
                    <span className="font-mono text-xs align-middle whitespace-nowrap">npm run seed:bonus-ai-tools-mastery</span>
                    {" "}inside <span className="font-mono text-xs">apps/api</span> (requires{" "}
                    <span className="font-mono text-xs">DATABASE_URL</span> in <span className="font-mono text-xs">.env</span>).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {bonusCatalogCourses.map((course, index) => {
                    const progress = course.progress || 0;
                    const isCompleted = progress === 100;
                    const topicsCount = course.modules_count || course.topics_count || course.lessons_count || 0;
                    const locked = !course.enrolled && !isBonusCourse(course);
                    const durationHours = getCourseDurationHours(course);
                    const coverSrc = getCourseCardCover(course.slug, course.title);
                    return (
                      <motion.div
                        key={course.id || course.slug || index}
                        initial={{ opacity: 0, y: 26 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: index * 0.06 }}
                        className={`rounded-2xl overflow-hidden border shadow-xl hover-lift bg-gradient-to-br ${
                          isDark
                            ? "from-slate-900 via-slate-900 to-indigo-950/40 border-white/10"
                            : "from-white via-white to-indigo-50/80 border-indigo-100/80"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(landingForBonusCard(course))}
                          className="w-full text-left"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                            <img src={coverSrc} alt="" className="w-full h-full object-cover opacity-95" loading="lazy" />
                            <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-black/85 via-transparent" : "from-slate-900/65 via-transparent"}`} />
                            <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
                              <FiZap className="w-3 h-3 text-amber-300" /> Free forever
                            </span>
                          </div>
                          <div className="px-6 py-6 md:px-7 md:py-8">
                            <div className="flex items-start gap-5">
                              <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}>
                                {isCompleted ? <FiCheck className="w-6 h-6" /> : locked ? <FiLock className="w-6 h-6" /> : <CircularProgressMini percentage={progress} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                  <h3 className={`text-xl md:text-2xl font-black leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                                    {course.title || course.slug || "Untitled"}
                                  </h3>
                                  {isAiToolsMasteryStudentsSlug(course.slug) && (
                                    <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wide ${isDark ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200/70"}`}>
                                      New flagship
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                                  {course.description || cardSubline(course)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-3 text-[13px]">
                              {!locked && topicsCount ? (
                                <span className={`inline-flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  <FiBookOpen className="w-4 h-4" /> {topicsCount} topic{topicsCount === 1 ? "" : "s"}
                                </span>
                              ) : null}
                              {durationHours != null ? (
                                <span className={`inline-flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  <FiClock className="w-4 h-4" /> ~{durationHours} hrs
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                        {!locked ? (
                          <div className={`flex flex-wrap gap-3 px-6 md:px-7 pb-6 md:pb-8 ${isDark ? "" : "border-t border-slate-100/90"}`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContinueLearning(course, e);
                              }}
                              className="flex-1 min-w-[160px] py-3 px-6 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-105 shadow-lg shadow-purple-950/35"
                            >
                              {progress ? "Continue learning" : "Open course"}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(landingForBonusCard(course));
                              }}
                              className={`py-3 px-6 rounded-xl text-sm font-bold border transition ${
                                isDark
                                  ? "border-white/20 text-white hover:bg-white/10"
                                  : "border-slate-200 text-slate-800 hover:bg-slate-50"
                              }`}
                            >
                              Overview
                            </button>
                          </div>
                        ) : (
                          <div className="px-6 md:px-7 pb-6 md:pb-8">
                            <p className="text-sm text-red-600 dark:text-red-400">This course isn&apos;t available for your tenant yet.</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Circular Progress Component
  const CircularProgress = CircularProgressMini;

  // Get course icon based on course data
  const getCourseIcon = (course, index) => {
    if (course.progress === 100) {
      return <FiCheck className="w-6 h-6 text-green-500" />;
    }
    // You can customize icons based on course type or use default
    if (course.title?.toLowerCase().includes('website') || course.title?.toLowerCase().includes('web')) {
      return <FiGlobe className="w-6 h-6 text-blue-500" />;
    }
    if (course.title?.toLowerCase().includes('programming') || course.title?.toLowerCase().includes('code')) {
      return <FiCode className="w-6 h-6 text-blue-500" />;
    }
    return <FiBookOpen className="w-6 h-6 text-blue-500" />;
  };

  return (
    <PageTransition>
    <div className={`min-h-screen rounded-t-3xl overflow-hidden md:rounded-none p-4 md:p-8 transition-colors duration-200 ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="min-h-[200px]">
        {/* Header Section */}
        <div className="mb-4 md:mb-8 animate-fade-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>MY LEARNINGS</p>
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {courses.length > 0 ? courses[0]?.learning_path_name || "My Learning Path" : "My Learnings"}
              </h1>
              {totalDuration > 0 && (
                <p className="text-sm text-slate-500">{totalDuration} days</p>
              )}
            </div>
            {courses.length > 0 && (
              <div className="flex items-center gap-3">
                <div className={`w-32 sm:w-48 rounded-full h-2 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                  <div
                    className="bg-blue-500 rounded-full h-2 progress-bar-animated"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{overallProgress}%</span>
              </div>
            )}
          </div>
        </div>

        {showAllPackUpsell && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 md:mb-8 rounded-2xl border-2 overflow-hidden shadow-lg ${
              isDark
                ? "border-purple-500/35 bg-gradient-to-br from-purple-950/80 via-slate-900 to-violet-950/50"
                : "border-purple-200 bg-gradient-to-br from-purple-50 via-white to-violet-50"
            }`}
          >
            <div className="p-4 sm:p-6 md:flex md:items-center md:gap-8 md:justify-between">
              <div className="flex gap-4 min-w-0">
                <div
                  className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl ${
                    isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-600"
                  }`}
                >
                  <FiZap className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 ${
                      isDark ? "text-purple-300/90" : "text-purple-600"
                    }`}
                  >
                    Upgrade · All Pack
                  </p>
                  <h2 className={`text-lg sm:text-xl font-bold leading-snug mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    You have {enrolledMainTrilogyCount} of 3 core courses - finish the set for less
                  </h2>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    One checkout unlocks the full path,{" "}
                    <span className={isDark ? "text-amber-300/95 font-medium" : "text-amber-700 font-medium"}>
                      AI Automations (bonus)
                    </span>
                    ,{" "}
                    <span className={isDark ? "font-medium text-orange-300/95" : "font-medium text-orange-700"}>
                      Startup LaunchPad
                    </span>
                    ,{" "}
                    <span className={isDark ? "font-medium text-purple-300/95" : "font-medium text-purple-800"}>
                      Real Client Lab
                    </span>
                    , and MCA- & MSME-recognised certificates - usually cheaper than buying the remaining courses separately.
                  </p>
                  {allPackPriceRupees != null && allPackPriceRupees >= 1 && (
                    <p className={`mt-2 text-sm font-semibold ${isDark ? "text-emerald-300/90" : "text-emerald-700"}`}>
                      All Pack from ₹{allPackPriceRupees.toLocaleString("en-IN")} · one-time
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2 md:shrink-0">
                <Link
                  to="/courses#pricing"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-semibold border-2 transition ${
                    isDark
                      ? "border-slate-500 text-slate-200 hover:bg-slate-800/80"
                      : "border-slate-300 text-slate-800 hover:bg-white"
                  }`}
                >
                  Compare on Courses page
                </Link>
                <button
                  type="button"
                  onClick={openPackBuyModal}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:brightness-110 transition"
                >
                  Get All Pack
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg p-12 border border-slate-200 text-center shadow-sm">
            <FiBookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses found</h3>
            <p className="text-slate-600">
              {searchQuery || filterLevel !== "all"
                ? "No courses match your filters"
                : "No courses available yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCourses.map((course, index) => {
              const progress = course.progress || 0;
              const isCompleted = progress === 100;
              const topicsCount = course.modules_count || course.topics_count || course.lessons_count || 0;
              const technologies = course.technologies || course.tags || [];
              // AI Automations (bonus) is always accessible-never show as locked
              const locked = !course.enrolled && !isBonusCourse(course);
              const priceRupees = course.price_in_paise ? Math.round(course.price_in_paise / 100) : 0;
              const canBuy = priceRupees >= 1;
              const durationHours = getCourseDurationHours(course);
              const coverSrc = getCourseCardCover(course.slug, course.title);

              return (
                <motion.div
                  key={course.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => locked ? navigate(getStudentCourseLandingPath(course.slug)) : handleCourseClick(course)}
                  className={`rounded-lg border shadow-sm transition-all overflow-hidden relative hover-lift ${
                    isDark
                      ? locked ? "bg-slate-800 border-slate-700 cursor-pointer" : "bg-slate-800 border-slate-700 cursor-pointer"
                      : locked ? "bg-white border-slate-300 cursor-pointer hover:shadow-md" : "bg-white border-slate-200 hover:shadow-md cursor-pointer"
                  } ${isPinned(course.slug) ? "ring-2 ring-amber-400/60" : ""}`}
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
                    <img
                      src={coverSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${
                        isDark
                          ? "from-slate-900/55 via-slate-900/10 to-transparent"
                          : "from-white/25 via-transparent to-transparent"
                      }`}
                      aria-hidden
                    />
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                          {locked ? (
                            <FiLock className="w-6 h-6 text-slate-400" />
                          ) : (
                            getCourseIcon(course, index)
                          )}
                        </div>
                        {course.code && !locked && (
                          <span className="text-sm font-bold text-blue-600">{course.code}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {locked ? (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${isBonusCourse(course) ? "text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400" : "text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400"}`}>
                            {isBonusCourse(course) ? "🎁 Bonus" : "🔒 Locked"}
                          </span>
                        ) : isCompleted ? (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <FiCheck className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div><CircularProgress percentage={progress} size={40} /></div>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>COURSE</p>
                    {!locked && (
                      <div className="flex items-center justify-between mb-2">
                        <div />
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePinCourse(course.slug); }}
                          className={`p-1.5 rounded-lg transition-all ${isPinned(course.slug) ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10" : isDark ? "text-slate-600 hover:text-slate-400 hover:bg-slate-700" : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"}`}
                          title={isPinned(course.slug) ? "Unpin course" : "Pin to top"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isPinned(course.slug) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                      {index + 1}. {course.title || "Untitled Course"}
                    </h3>
                    {durationHours != null && (
                      <p className={`flex items-center gap-1.5 text-xs mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{durationHours} hrs to complete</span>
                      </p>
                    )}
                    {locked ? (
                      <>
                        <p className={`text-sm mb-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {isBonusCourse(course)
                            ? "To unlock this bonus course, buy the All Pack or all three courses (Vibe Coding, Prompt Engineering, Prompt to Profit)."
                            : "Unlock this course to access all lessons and content."}
                        </p>
                        <div className="flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(getStudentCourseLandingPath(course.slug));
                          }}
                          className={`w-full py-2.5 px-4 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 border ${
                            isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <FiBookOpen className="w-4 h-4" />
                          Explore Course
                        </button>
                          {isBonusCourse(course) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/courses");
                              }}
                              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors"
                            >
                              Get All Pack or All 3 Courses to Unlock
                            </button>
                          ) : canBuy ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openBuyModal(course);
                              }}
                              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
                            >
                              Get Course-₹{priceRupees}
                            </button>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className={`text-sm mb-3 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {course.description || "No description available"}
                        </p>
                        <p className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {topicsCount} {topicsCount === 1 ? "Topic" : "Topics"}
                        </p>
                        {technologies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {technologies.slice(0, 3).map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                              >
                                {typeof tech === "string"
                                  ? tech.toUpperCase()
                                  : tech.name?.toUpperCase() || tech}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(getStudentCourseLandingPath(course.slug));
                          }}
                          className="w-full mt-1 py-2.5 px-4 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 mb-2"
                        >
                          <FiBookOpen className="w-4 h-4" />
                          Explore Course
                        </button>
                        <button
                          onClick={(e) => handleContinueLearning(course, e)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <FiBookOpen className="w-4 h-4" />
                          Continue Learning
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${isDark ? "bg-slate-800 border border-slate-700" : "bg-white"}`}>
                <div className={`p-6 border-b relative ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <FiX className="w-5 h-5 text-slate-600" />
                  </button>

                  <div className="pr-12">
                    {selectedCourse.code && (
                      <p className="text-sm font-semibold text-blue-500 mb-1">{selectedCourse.code}</p>
                    )}
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">COURSE</p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedCourse.title || "Untitled Course"}
                    </h2>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingDetails ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-3 bg-slate-200 rounded w-16 mb-2"></div>
                              <div className="h-5 bg-slate-200 rounded w-48"></div>
                            </div>
                            <div className="w-5 h-5 bg-slate-200 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : courseDetails && courseDetails.modules ? (
                    <div className="space-y-3">
                      {courseDetails.modules.map((module, index) => {
                        const isExpanded = expandedTopics.has(module.id);
                        const isCompleted = isTopicCompleted(module);
                        const hasLessons = module.lessons && module.lessons.length > 0;

                        return (
                          <div
                            key={module.id || index}
                            className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
                          >
                            {/* Topic Header */}
                            <div
                              onClick={() => hasLessons && toggleTopic(module.id)}
                              className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                                hasLessons ? 'cursor-pointer' : ''
                              }`}
                            >
                              {/* Completion Indicator */}
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <FiCheck className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                                )}
                              </div>

                              {/* Topic Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">TOPIC</p>
                                <h3 className="text-base font-bold text-slate-900">
                                  {module.title || `Topic ${index + 1}`}
                                </h3>
                              </div>

                              {/* Chevron */}
                              {hasLessons && (
                                <div className="flex-shrink-0">
                                  {isExpanded ? (
                                    <FiChevronDown className="w-5 h-5 text-slate-600" />
                                  ) : (
                                    <FiChevronRight className="w-5 h-5 text-slate-600" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Expanded Lessons */}
                            {isExpanded && hasLessons && (
                              <div className="border-t border-slate-200 bg-slate-50">
                                <div className="pl-12 pr-4 py-3">
                                  <div className="space-y-3">
                                    {module.lessons.map((lesson, lessonIndex) => {
                                      const isLessonCompleted = lesson.completed;
                                      return (
                                        <div
                                          key={lesson.id || lessonIndex}
                                          className="flex items-start gap-3 relative"
                                        >
                                          {/* Connecting Line */}
                                          {lessonIndex < module.lessons.length - 1 && (
                                            <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-300"></div>
                                          )}

                                          {/* Lesson Completion Indicator */}
                                          <div className="flex-shrink-0 mt-1">
                                            {isLessonCompleted ? (
                                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                                <FiCheck className="w-2.5 h-2.5 text-white" />
                                              </div>
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                                            )}
                                          </div>

                                          {/* Book Icon */}
                                          <div className="flex-shrink-0 mt-1">
                                            <FiBookOpen className="w-4 h-4 text-slate-500" />
                                          </div>

                                          {/* Lesson Info */}
                                          <div 
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCloseModal();
                                              navigate(getStudentLessonPath(selectedCourse.slug, module.slug, lesson.slug));
                                            }}
                                          >
                                            <h4 className="text-sm font-semibold text-slate-900 mb-1 hover:text-blue-600 transition-colors">
                                              {lesson.title || `Lesson ${lessonIndex + 1}`}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                              {lesson.duration_seconds && (
                                                <span>{formatDuration(lesson.duration_seconds)}</span>
                                              )}
                                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                Learning
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-600">No topics available for this course</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BuyNowModal
        open={showBuyModal}
        onClose={() => { setShowBuyModal(false); setBuyItem(null); }}
        item={buyItem}
        onSuccess={handleBuySuccess}
        prefill={user ? { name: user.fullName || user.full_name || user.name || "", email: user.email, phone: user.phone, college: user.college || "" } : undefined}
        isLoggedIn={!!token}
      />
    </div>
    </PageTransition>
  );
}
