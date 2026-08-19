import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getStudentLessonPath, getStudentLessonPathForRoute, getStudentCourseBasePath } from "../../../utils/studentCoursePaths";
import { recoverStudentLessonRoute } from "../../../utils/recoverStudentLessonRoute";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useTheme } from "../../../app/providers/ThemeProvider";
import { apiFetch, ApiError } from "../../../services/api";
import { StudentLessonSkeleton, LessonContentSkeleton } from "../../../Components/common/SkeletonLoaders";
import { ButtonLoading } from "../../../Components/common/LoadingStates";
import { Stream } from "@cloudflare/stream-react";
import {
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiLock,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiMaximize2,
  FiMinimize2,
  FiFileText,
  FiHelpCircle,
  FiCode,
  FiArrowLeft,
  FiLayers,
  FiTarget,
  FiImage,
  FiX,
  FiChevronLeft,
  FiBookOpen,
  FiSearch,
} from "react-icons/fi";
import { PanelLeftOpen } from "lucide-react";
import CourseContentsSidebar from "../../../Components/ui/CourseContentsSidebar";
import PromptEngineeringSections from "../../../Components/lessons/PromptEngineeringSections";
import VibeCodingSections from "../../../Components/lessons/VibeCodingSections";
import AiAutomationsSections from "../../../Components/lessons/AiAutomationsSections";
import ChatGptBusinessSections from "../../../Components/lessons/ChatGptBusinessSections";
import SlideDeckViewer from "../../../Components/presentation/SlideDeckViewer";
import PDFPresentationViewer from "../../../Components/presentation/PDFPresentationViewer";
import { CodeBlock } from "../../../Components/ui/code-block";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../Components/ui/tabs";
import { SLIDES as htmlBasicSlides, SLIDE_COUNT as htmlBasicSlideCount } from "../../../data/slides/htmlBasicElements.jsx";
import LessonSearchModal from "../../../Components/student/LessonSearchModal";
import { useGamification } from "../../../app/providers/GamificationProvider";
import { ConfettiBurst, XPFloat, LessonCompleteMessage } from "../../../Components/student/gamification/Confetti";
import { BookmarkButton, LessonNotes } from "../../../Components/student/gamification/NotesBookmark";
import LessonFeedbackCard from "../../../Components/student/LessonFeedbackCard";
import StudentDoubtsPanel from "../../../Components/student/StudentDoubtsPanel";
import LessonSlidesReader from "../../../Components/student/LessonSlidesReader";
import ShareProgressModal from "../../../Components/student/gamification/ShareProgressModal";
import KeyboardShortcutsModal from "../../../Components/student/KeyboardShortcutsModal";
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts";
import {
  getVibeSetupFullstackAlternateVideos,
  VIBE_SETUP_FULLSTACK_VIDEO_LANG_KEY,
} from "../../../utils/vibeCodingLessonAlternateVideos";
import { getVibeLessonImportantLinks } from "../../../utils/vibeCodingLessonImportantLinks";
import LessonImportantLinks from "../../../Components/lessons/LessonImportantLinks";

const NATIVE_SEEK_BACK_SEC = 20;
const NATIVE_SEEK_FWD_SEC = 10;
const VIDEO_TOKEN_CACHE_PREFIX = "student-lesson-video-token:";

function getVideoTokenCacheKey(lessonId) {
  return `${VIDEO_TOKEN_CACHE_PREFIX}${lessonId}`;
}

function readCachedVideoToken(lessonId) {
  if (typeof window === "undefined" || !lessonId) return null;
  try {
    const raw = window.sessionStorage.getItem(getVideoTokenCacheKey(lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.value?.iframeUrl || !parsed?.expiresAt || Date.now() >= parsed.expiresAt) {
      window.sessionStorage.removeItem(getVideoTokenCacheKey(lessonId));
      return null;
    }
    return parsed.value || null;
  } catch {
    return null;
  }
}

function writeCachedVideoToken(lessonId, value, expiresInSeconds) {
  if (typeof window === "undefined" || !lessonId || !value?.iframeUrl) return;
  const ttlMs = Math.max(30_000, ((Number(expiresInSeconds) || 3600) - 60) * 1000);
  try {
    window.sessionStorage.setItem(
      getVideoTokenCacheKey(lessonId),
      JSON.stringify({
        expiresAt: Date.now() + ttlMs,
        value,
      })
    );
  } catch {
    // Ignore cache write failures.
  }
}

/** Direct URL / progressive video only-skip controls + synced play/pause (native controls stay for scrubber/volume/fullscreen). */
function NativeLessonVideoPlayer({
  lessonKey,
  videoSrc,
  videoRef,
  captionsBlobUrl,
  captionsEnabled,
  setCaptionsEnabled,
  setVideoReady,
}) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const sync = () => setPlaying(!v.paused);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("loadedmetadata", sync);
    sync();
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("loadedmetadata", sync);
    };
  }, [videoRef, videoSrc, lessonKey]);

  const seekBack = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, v.currentTime - NATIVE_SEEK_BACK_SEC);
  };
  const seekFwd = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = Number.isFinite(v.duration) ? v.duration : Infinity;
    v.currentTime = Math.min(dur, v.currentTime + NATIVE_SEEK_FWD_SEC);
  };
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div className="relative bg-black overflow-hidden shadow-xl rounded-b-lg">
      <div className="aspect-video bg-black relative md:max-h-[450px]">
        <video
          key={`vid-${lessonKey}-${videoSrc}-${captionsBlobUrl ? "cc" : "nocc"}`}
          ref={videoRef}
          src={videoSrc}
          preload="metadata"
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          className="w-full h-full"
          onPlay={() => setVideoReady(true)}
        >
          {captionsBlobUrl && (
            <track kind="captions" srcLang="en" src={captionsBlobUrl} label="English" default />
          )}
          Your browser does not support the video tag.
        </video>
      </div>
      {captionsBlobUrl && (
        <button
          type="button"
          onClick={() => setCaptionsEnabled((v) => !v)}
          className={`absolute top-2 right-2 z-10 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            captionsEnabled
              ? "bg-white text-black hover:bg-slate-200"
              : "bg-black/60 text-white/70 hover:bg-black/80"
          }`}
          title={captionsEnabled ? "Turn off captions" : "Turn on captions"}
        >
          CC {captionsEnabled ? "ON" : "OFF"}
        </button>
      )}
      <div
        className="flex items-center justify-center gap-2 sm:gap-4 px-3 py-2.5 sm:py-3 bg-gradient-to-b from-slate-900/98 to-slate-950 border-t border-white/10"
        role="toolbar"
        aria-label="Video playback shortcuts"
      >
        <button
          type="button"
          onClick={seekBack}
          className="group flex items-center gap-1 sm:gap-1.5 min-h-[44px] px-2.5 sm:px-3 rounded-lg text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
          aria-label={`Rewind ${NATIVE_SEEK_BACK_SEC} seconds`}
        >
          <FiChevronLeft className="w-5 h-5 opacity-90 group-hover:opacity-100 shrink-0" aria-hidden />
          <span className="text-xs sm:text-sm font-semibold tabular-nums tracking-tight">{NATIVE_SEEK_BACK_SEC}s</span>
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center min-w-[48px] min-h-[48px] rounded-full bg-white text-slate-900 shadow-md hover:bg-slate-100 active:scale-[0.98] transition-all touch-manipulation ring-1 ring-white/30"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <FiPause className="w-5 h-5" aria-hidden /> : <FiPlay className="w-5 h-5 pl-0.5" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={seekFwd}
          className="group flex items-center gap-1 sm:gap-1.5 min-h-[44px] px-2.5 sm:px-3 rounded-lg text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
          aria-label={`Forward ${NATIVE_SEEK_FWD_SEC} seconds`}
        >
          <span className="text-xs sm:text-sm font-semibold tabular-nums tracking-tight">{NATIVE_SEEK_FWD_SEC}s</span>
          <FiChevronRight className="w-5 h-5 opacity-90 group-hover:opacity-100 shrink-0" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function ComingSoonVideoPlaceholder({ lessonTitle }) {
  return (
    <div className="relative bg-black overflow-hidden shadow-xl rounded-b-lg">
      <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-black relative md:max-h-[450px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_42%)]" />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center max-w-xl">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <FiPlay className="w-8 h-8 text-white/90" />
            </div>
            <p className="text-white text-xl md:text-2xl font-bold tracking-tight">Coming Soon</p>
            <p className="mt-2 text-slate-300 text-sm md:text-base">
              Video lesson for <span className="font-semibold text-white">{lessonTitle || "this topic"}</span> is being uploaded.
            </p>
            <p className="mt-1 text-slate-400 text-xs md:text-sm">
              Continue with prompts, notes, and practice sections below meanwhile.
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 bg-gradient-to-b from-slate-900/98 to-slate-950 border-t border-white/10">
        <p className="text-center text-xs text-slate-300">Video section layout reserved for this lesson</p>
      </div>
    </div>
  );
}

function isAbortError(err) {
  if (!err) return false;
  if (err?.name === "AbortError") return true;
  const msg = err?.message && String(err.message);
  return msg && /abort|signal\s+is\s+aborted/i.test(msg);
}

const preloadProfile = () => import("./StudentProfile");
const preloadHome = () => import("./StudentHome");
const preloadCourses = () => import("./StudentCourses");

export default function StudentLesson() {
  const navigate = useNavigate();
  const { courseSlug, moduleSlug, lessonSlug } = useParams();
  const { token } = useAuth();
  const { toggleMode, isDark } = useTheme();
  const { recordLessonComplete, recordQuizComplete, recordPerfectQuiz, xpRewards } = useGamification();
  const [showLessonConfetti, setShowLessonConfetti] = useState(false);
  const [showXPFloat, setShowXPFloat] = useState(false);
  const [xpFloatAmount, setXPFloatAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [moduleLessons, setModuleLessons] = useState([]);
  const [activeTab, setActiveTab] = useState("slides"); // slides, cheatsheet, mcqs, practice
  const [completed, setCompleted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesExpanded, setSlidesExpanded] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [mcqCurrentIndex, setMcqCurrentIndex] = useState(0);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqScore, setMcqScore] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [resources, setResources] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [practiceTasks, setPracticeTasks] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [videoToken, setVideoToken] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [videoTokenLoading, setVideoTokenLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [markCompleteLoading, setMarkCompleteLoading] = useState(false);
  const [markCompleteError, setMarkCompleteError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activePromptTab, setActivePromptTab] = useState("prompts");
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [selectedSuccessImageIndex, setSelectedSuccessImageIndex] = useState(0);
  const [selectedLearnStepIndex, setSelectedLearnStepIndex] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  /** en | te - only used when alternate native URLs exist for a lesson (e.g. Vibe Coding setup fullstack). */
  const [lessonAlternateVideoLang, setLessonAlternateVideoLang] = useState(() => {
    return "te";
  });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const captionsBlobUrlRef = useRef(null);
  const videoRef = useRef(null);
  const courseDataLoadedRef = useRef(false);
  const isManualNavigationRef = useRef(false);
  const recoveryAttemptedRef = useRef(false);
  const mainContentScrollRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => { preloadProfile(); preloadHome(); preloadCourses(); }, 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    recoveryAttemptedRef.current = false;
  }, [courseSlug, moduleSlug, lessonSlug]);

  useEffect(() => {
    courseDataLoadedRef.current = false;
  }, [courseSlug]);

  const location = useLocation();
  const isBonusPath = location.pathname.includes("bonus-courses");
  const basePath = isBonusPath ? "/lms/student/bonus-courses" : "/lms/student/courses";

  // Redirect: old bonus-courses/ai-automations URLs → courses/ai-automations
  const shouldRedirectToCourses = useMemo(() => {
    if (!location.pathname.includes("bonus-courses")) return false;
    const n = (courseSlug || "").toLowerCase().replace(/_/g, "-");
    return n === "ai-automations" || n.includes("ai-automation") || n === "ai-agents" || n === "ai_agents";
  }, [courseSlug, location.pathname]);
  useEffect(() => {
    if (!shouldRedirectToCourses) return;
    const canonicalSlug = (courseSlug || "").toLowerCase().replace(/_/g, "-") === "ai-agents" || (courseSlug || "").toLowerCase().replace(/_/g, "-") === "ai_agents" ? "ai-automations" : (courseSlug || "ai-automations");
    navigate(getStudentLessonPath(canonicalSlug, moduleSlug, lessonSlug), { replace: true });
  }, [shouldRedirectToCourses, courseSlug, moduleSlug, lessonSlug, navigate]);

  // Reset success image index, learn step, and captions when lesson changes
  useEffect(() => {
    setSelectedSuccessImageIndex(0);
    setSelectedLearnStepIndex(0);
    setCaptionsEnabled(true);
  }, [lesson?.id]);

  // Scroll main content to top when lesson changes (e.g. clicking a lesson in the sidebar)
  useEffect(() => {
    if (lesson?.id == null) return;
    const el = mainContentScrollRef.current;
    if (el) el.scrollTo({ top: 0, behavior: "auto" });
  }, [lesson?.id]);

  // Set default prompt tab when lesson loads
  useEffect(() => {
    if (lesson?.prompts && typeof lesson.prompts === "object") {
      if (lesson.prompts.prompts != null) {
        setActivePromptTab("prompts");
      } else if (lesson.prompts.commands != null) {
        setActivePromptTab("commands");
      } else if (lesson.prompts.error_resolve != null) {
        setActivePromptTab("error_resolve");
      }
    }
  }, [lesson?.prompts]);

  // Convert SRT text to a WebVTT blob URL synchronously so <track> is in the DOM with <video>
  const captionsBlobUrl = useMemo(() => {
    if (captionsBlobUrlRef.current) {
      URL.revokeObjectURL(captionsBlobUrlRef.current);
      captionsBlobUrlRef.current = null;
    }
    if (lesson?.video_captions && lesson.video_captions.trim()) {
      const srtText = lesson.video_captions.trim();
      const vttContent = "WEBVTT\n\n" + srtText
        .replace(/\r\n/g, "\n")
        .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
      const blob = new Blob([vttContent], { type: "text/vtt" });
      const url = URL.createObjectURL(blob);
      captionsBlobUrlRef.current = url;
      return url;
    }
    return null;
  }, [lesson?.video_captions]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (captionsBlobUrlRef.current) URL.revokeObjectURL(captionsBlobUrlRef.current);
    };
  }, []);

  // Toggle captions track mode when user clicks CC button
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const trySetMode = () => {
      if (video.textTracks && video.textTracks.length > 0) {
        video.textTracks[0].mode = captionsEnabled ? "showing" : "hidden";
      }
    };
    trySetMode();
    video.textTracks?.addEventListener?.("addtrack", trySetMode);
    return () => video.textTracks?.removeEventListener?.("addtrack", trySetMode);
  }, [captionsEnabled, captionsBlobUrl]);

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Initial load: fetch course and lesson data only once
  useEffect(() => {
    if (!token || !lessonSlug || !courseSlug || !moduleSlug) return;
    const n = (courseSlug || "").toLowerCase().replace(/_/g, "-");
    if (n === "ai-agents") return; // redirect will run; avoid fetching with deprecated slug

    // Skip if this is a manual navigation (handled by onLessonSelect)
    if (isManualNavigationRef.current) {
      isManualNavigationRef.current = false;
      return;
    }

    const ac = new AbortController();
    if (!courseDataLoadedRef.current) {
      fetchCourseData(ac.signal);
    }
    fetchLessonData(courseSlug, moduleSlug, lessonSlug, courseDataLoadedRef.current, ac.signal);
    return () => ac.abort();
  }, [token, courseSlug, moduleSlug, lessonSlug]);

  const fetchCourseData = async (signal) => {
    if (courseDataLoadedRef.current) return;
    try {
      const res = await apiFetch(`/api/v1/student/courses/${courseSlug}`, { token, signal });
      if (res?.data?.course) {
        setCourse(res.data.course);
        setAllModules(res.data.course.modules || []);
        courseDataLoadedRef.current = true;
      } else if (res?.course) {
        setCourse(res.course);
        setAllModules(res.course.modules || []);
        courseDataLoadedRef.current = true;
      }
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ApiError && error.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (error instanceof ApiError && error.status === 404 && token && !recoveryAttemptedRef.current) {
        recoveryAttemptedRef.current = true;
        const rec = await recoverStudentLessonRoute({ token, courseSlug, moduleSlug, lessonSlug });
        if (rec?.path) {
          navigate(rec.path, { replace: true });
          return;
        }
      }
      console.error("Failed to fetch course data:", error);
    }
  };

  // Keep the URL aligned with the published course slug from the API (avoids wrong slug in links / bookmarks).
  useEffect(() => {
    if (!course?.slug || !courseSlug) return;
    const fromApi = String(course.slug).toLowerCase().replace(/_/g, "-");
    const fromRoute = String(courseSlug).toLowerCase().replace(/_/g, "-");
    if (fromApi === fromRoute) return;
    navigate(
      getStudentLessonPathForRoute(course.slug, moduleSlug, lessonSlug, { pathname: location.pathname }),
      { replace: true }
    );
  }, [course?.slug, courseSlug, moduleSlug, lessonSlug, navigate, location.pathname]);

  const fetchLessonData = async (courseSlugParam, moduleSlugParam, lessonSlugParam, isContentUpdate = false, signal) => {
    try {
      if (isContentUpdate) {
        setContentLoading(true);
      } else {
        setLoading(true);
      }
      const res = await apiFetch(`/api/v1/student/courses/${courseSlugParam}/modules/${moduleSlugParam}/lessons/${lessonSlugParam}`, { token, signal });
      if (res?.data) {
        const lessonData = res.data.lesson || res.data;
        const prefetchedVideoToken = res.data.videoToken || null;
        // Ensure prompts is parsed if it's a string
        if (lessonData?.prompts && typeof lessonData.prompts === 'string') {
          try {
            lessonData.prompts = JSON.parse(lessonData.prompts);
          } catch (e) {
            lessonData.prompts = null;
          }
        }
        setLesson(lessonData);
        setModuleLessons(res.data.moduleLessons || []);
        setResources(res.data.resources || []);
        setMcqs(res.data.mcqs || []);
        setPracticeTasks(res.data.practiceTasks || []);
        setCompleted(res.data.completed || false);
        
        // Reset prompt tab to first available
        if (lessonData?.prompts && typeof lessonData.prompts === "object") {
          if (lessonData.prompts.prompts != null) {
            setActivePromptTab("prompts");
          } else if (lessonData.prompts.commands != null) {
            setActivePromptTab("commands");
          } else if (lessonData.prompts.error_resolve != null) {
            setActivePromptTab("error_resolve");
          }
        }
        
        // Reset video state
        setVideoToken(prefetchedVideoToken);
        setVideoError(null);
        setVideoReady(false);
        if (prefetchedVideoToken?.iframeUrl) {
          writeCachedVideoToken(lessonData?.id, prefetchedVideoToken, prefetchedVideoToken.expiresInSeconds);
        }
      }
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ApiError && error.status === 403) {
        setAccessDenied(true);
      } else if (error instanceof ApiError && error.status === 404 && token && !recoveryAttemptedRef.current) {
        recoveryAttemptedRef.current = true;
        const rec = await recoverStudentLessonRoute({
          token,
          courseSlug: courseSlugParam,
          moduleSlug: moduleSlugParam,
          lessonSlug: lessonSlugParam,
        });
        if (rec?.path) {
          navigate(rec.path, { replace: true });
          return;
        }
        console.error("Failed to fetch lesson data:", error);
      } else {
        console.error("Failed to fetch lesson data:", error);
      }
    } finally {
      if (!signal?.aborted) {
        if (isContentUpdate) {
          setContentLoading(false);
        } else {
          setLoading(false);
        }
      }
    }
  };

  const fetchVideoToken = async (lessonId) => {
    if (!lessonId || !token) {
      console.warn("Cannot fetch video token: missing lessonId or token", { lessonId, hasToken: !!token });
      return;
    }

    const cached = readCachedVideoToken(lessonId);
    if (cached?.iframeUrl) {
      setVideoToken(cached);
      setVideoError(null);
      setVideoTokenLoading(false);
      return;
    }

    try {
      setVideoError(null);
      setVideoTokenLoading(true);
      
      // Fetch a playback token for Cloudflare Stream (required for private videos)
      const res = await apiFetch("/api/v1/media/playback-token", {
        method: "POST",
        token,
        body: { lessonId },
      });

      // Handle both response structures: res.data.iframeUrl or res.iframeUrl
      const iframeUrl = res?.data?.iframeUrl || res?.iframeUrl;
      const hlsUrl = res?.data?.hlsUrl || res?.hlsUrl;

      if (iframeUrl) {
        const nextToken = {
          iframeUrl,
          hlsUrl,
          lessonId: res?.data?.lessonId || res?.lessonId,
          provider: res?.data?.provider || res?.provider,
          expiresInSeconds: res?.data?.expiresInSeconds || res?.expiresInSeconds,
        };
        setVideoToken(nextToken);
        writeCachedVideoToken(lessonId, nextToken, nextToken.expiresInSeconds);
        setVideoError(null);
      } else {
        const errorMsg = res?.data?.message || res?.message || "Failed to get video access token. Please try again.";
        console.error("No iframeUrl in response:", res);
        setVideoError(errorMsg);
      }
    } catch (error) {
      console.error("Video token fetch failed:", error);
      const errorMsg = error?.message || error?.data?.message || "Failed to load video. Please refresh the page or contact support.";
      setVideoError(errorMsg);
    } finally {
      setVideoTokenLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (markCompleteLoading || completed) return;
    try {
      setMarkCompleteLoading(true);
      setMarkCompleteError("");
      const res = await apiFetch(`/api/v1/student/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonSlug}/complete`, {
        method: "POST",
        token,
      });

      if (res?.ok) {
        setCompleted(true);
        recordLessonComplete();
        setShowLessonConfetti(true);
        setXPFloatAmount(xpRewards.lessonComplete);
        setShowXPFloat(true);
        setTimeout(() => setShowXPFloat(false), 1800);
        setAllModules((prev) =>
          prev.map((mod) => ({
            ...mod,
            lessons: (mod.lessons || []).map((l) =>
              l.id === lesson?.id ? { ...l, completed: true } : l
            ),
          }))
        );
        setModuleLessons((prev) =>
          prev.map((l) => (l.id === lesson?.id ? { ...l, completed: true } : l))
        );
        fetchCourseData();
      }
    } catch (error) {
      setMarkCompleteError(error?.message || "Failed to mark lesson as complete. Please try again.");
    } finally {
      setMarkCompleteLoading(false);
    }
  };

  const handleMcqAnswer = (questionId, answer) => {
    setMcqAnswers({ ...mcqAnswers, [questionId]: answer });
  };

  const handleMcqNext = () => {
    if (mcqCurrentIndex < mcqs.length - 1) {
      setMcqCurrentIndex(mcqCurrentIndex + 1);
    } else {
      handleMcqSubmit();
    }
  };

  const handleMcqSubmit = () => {
    let correct = 0;
    const wrong = [];

    mcqs.forEach((mcq, index) => {
      const userAnswer = mcqAnswers[mcq.id];
      if (userAnswer === mcq.correct_answer) {
        correct++;
      } else {
        wrong.push({ ...mcq, userAnswer, index });
      }
    });

    setMcqScore({ correct, total: mcqs.length });
    setWrongAnswers(wrong);
    setMcqSubmitted(true);

    recordQuizComplete();
    const isPerfect = correct === mcqs.length;
    if (isPerfect) recordPerfectQuiz();
    setXPFloatAmount(isPerfect ? xpRewards.perfectQuiz : xpRewards.quizComplete);
    setShowXPFloat(true);
    if (isPerfect) setShowLessonConfetti(true);
    setTimeout(() => setShowXPFloat(false), 1800);
  };

  const handleRetest = () => {
    setMcqAnswers({});
    setMcqCurrentIndex(0);
    setMcqSubmitted(false);
    setMcqScore(null);
    setWrongAnswers([]);
  };

  const handleNextLesson = async () => {
    if (!nextLesson || nextLesson.locked) return;
    isManualNavigationRef.current = true;
    const targetModuleSlug = nextLesson.moduleSlug;
    navigate(
      getStudentLessonPathForRoute(courseSlug, targetModuleSlug, nextLesson.slug, { pathname: location.pathname }),
      { replace: true }
    );
    await fetchLessonData(courseSlug, targetModuleSlug, nextLesson.slug, true);
  };


  const formatDuration = (seconds) => {
    if (!seconds) return "0 mins";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${mins} min${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} min${mins !== 1 ? 's' : ''}`;
  };

  const getTotalCourseDuration = () => {
    if (!allModules || allModules.length === 0) return "0 mins";
    let totalSeconds = 0;
    allModules.forEach(module => {
      if (module.lessons) {
        module.lessons.forEach(lesson => {
          totalSeconds += lesson.duration_seconds || 0;
        });
      }
    });
    return formatDuration(totalSeconds);
  };

  // Get all lessons from all modules
  const getAllLessons = () => {
    const lessons = [];
    allModules.forEach(module => {
      if (module.lessons) {
        module.lessons.forEach(lesson => {
          lessons.push({
            ...lesson,
            moduleSlug: module.slug,
            moduleTitle: module.title,
          });
        });
      }
    });
    return lessons;
  };

  const currentMcq = mcqs[mcqCurrentIndex];

  // Calculate these before early returns to maintain hook order
  const allLessons = useMemo(() => getAllLessons(), [allModules]);
  
  // Find current module title
  const currentModule = useMemo(() => 
    allModules.find((mod) => mod.slug === moduleSlug),
    [allModules, moduleSlug]
  );
  const moduleTitle = currentModule?.title || "";

  // Vibe Coding: dual-language MP4 for one lesson (see utils/vibeCodingLessonAlternateVideos.js)
  const alternateNativeVideos = useMemo(() => {
    if (!lesson) return null;
    return getVibeSetupFullstackAlternateVideos({
      courseSlug,
      moduleSlug,
      lessonSlug,
      moduleTitle,
      lessonTitle: lesson.title,
    });
  }, [lesson, courseSlug, moduleSlug, lessonSlug, moduleTitle]);

  const activeAlternateVideoSrc = useMemo(() => {
    if (!alternateNativeVideos) return null;
    return lessonAlternateVideoLang === "te" ? alternateNativeVideos.telugu : alternateNativeVideos.english;
  }, [alternateNativeVideos, lessonAlternateVideoLang]);

  const lessonImportantLinks = useMemo(() => {
    if (!lesson) return null;
    return getVibeLessonImportantLinks({
      courseSlug,
      moduleSlug,
      lessonSlug,
      moduleTitle,
      lessonTitle: lesson.title,
    });
  }, [lesson, courseSlug, moduleSlug, lessonSlug, moduleTitle]);

  // Fetch Cloudflare token only when not using alternate native URLs for this lesson
  useEffect(() => {
    if (alternateNativeVideos) {
      setVideoToken(null);
      setVideoError(null);
      return;
    }
    if (lesson?.video_provider === "cloudflare_stream" && lesson?.video_id && lesson?.id && token) {
      if (videoToken?.lessonId === lesson.id && videoToken?.iframeUrl) return;
      fetchVideoToken(lesson.id);
    } else if (lesson?.video_provider === "cloudflare_stream" && lesson?.video_id) {
      setVideoToken(null);
      setVideoError(null);
    }
  }, [alternateNativeVideos, lesson?.id, lesson?.video_provider, lesson?.video_id, token, videoToken?.lessonId, videoToken?.iframeUrl]);

  useEffect(() => {
    if (!alternateNativeVideos) return;
    setLessonAlternateVideoLang("te");
  }, [alternateNativeVideos, lesson?.id]);

  const handleSearchLessonSelect = useCallback((item) => {
    if (item.locked) return;
    setSearchModalOpen(false);
    isManualNavigationRef.current = true;
    navigate(
      getStudentLessonPathForRoute(courseSlug, item.moduleSlug, item.slug, { pathname: location.pathname }),
      { replace: true }
    );
    fetchLessonData(courseSlug, item.moduleSlug, item.slug, true);
  }, [courseSlug, navigate, location.pathname]);

  const handleSearchModuleSelect = useCallback((mod) => {
    setSearchModalOpen(false);
    const firstLesson = allModules.find((m) => m.slug === mod.slug)?.lessons?.[0];
    if (firstLesson && !firstLesson.locked) {
      isManualNavigationRef.current = true;
      navigate(
        getStudentLessonPathForRoute(courseSlug, mod.slug, firstLesson.slug, { pathname: location.pathname }),
        { replace: true }
      );
      fetchLessonData(courseSlug, mod.slug, firstLesson.slug, true);
    }
  }, [courseSlug, navigate, allModules, location.pathname]);

  const courseType = useMemo(() => {
    const slug = (courseSlug || "").toLowerCase().replace(/_/g, "-");
    if (slug.includes("profit") || slug.includes("chatgpt-business")) return "chatgpt-business";
    if (slug.includes("prompt")) return "prompt-engineering";
    if (slug.includes("vibe") || slug.includes("coding")) return "vibe-coding";
    if (slug.includes("automat") || slug === "ai-automations") return "ai-automations";
    return null;
  }, [courseSlug]);

  const nextLesson = useMemo(() => {
    if (!allLessons.length || !lesson?.id) return null;
    const idx = allLessons.findIndex((l) => String(l.id) === String(lesson.id));
    if (idx < 0 || idx >= allLessons.length - 1) return null;
    const next = allLessons[idx + 1];
    return next?.locked ? null : next;
  }, [allLessons, lesson?.id]);

  const prevLesson = useMemo(() => {
    if (!allLessons.length || !lesson?.id) return null;
    const idx = allLessons.findIndex((l) => String(l.id) === String(lesson.id));
    if (idx <= 0) return null;
    return allLessons[idx - 1];
  }, [allLessons, lesson?.id]);

  const handlePrevLesson = async () => {
    if (!prevLesson) return;
    isManualNavigationRef.current = true;
    const targetModuleSlug = prevLesson.moduleSlug;
    navigate(
      getStudentLessonPathForRoute(courseSlug, targetModuleSlug, prevLesson.slug, { pathname: location.pathname }),
      { replace: true }
    );
    await fetchLessonData(courseSlug, targetModuleSlug, prevLesson.slug, true);
  };

  /** Arrow keys: seek native video element only (returns false for iframe-only lessons). */
  const videoSeekForward = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.src) return false;
    const dur = Number.isFinite(v.duration) ? v.duration : Infinity;
    v.currentTime = Math.min(dur, v.currentTime + NATIVE_SEEK_FWD_SEC);
    return true;
  }, []);

  const videoSeekBackward = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.src) return false;
    v.currentTime = Math.max(0, v.currentTime - NATIVE_SEEK_BACK_SEC);
    return true;
  }, []);

  useKeyboardShortcuts({
    openSearch: () => setSearchModalOpen(true),
    openHelp: () => setShortcutsOpen(true),
    closeModal: () => {
      if (shortcutsOpen) setShortcutsOpen(false);
      else if (searchModalOpen) setSearchModalOpen(false);
      else if (selectedResource) setSelectedResource(null);
    },
    markComplete: () => { if (!completed && !markCompleteLoading) handleMarkComplete(); },
    videoSeekForward,
    videoSeekBackward,
    toggleSidebar: () => setSidebarVisible(v => !v),
    toggleDarkMode: toggleMode,
  }, !loading);

  // Prepare modules structure for sidebar - optimized for performance
  const sidebarModules = useMemo(() => {
    const currentLessonIdStr = lesson?.id ? String(lesson.id) : null;
    
    return allModules.map((module) => {
      const lessons = (module.lessons || []).map((l) => {
        // Active = same lesson by ID (unique), or same slug only in current module (so duplicate slugs like "dictionary" don't show active in every module)
        const active =
          currentLessonIdStr === String(l.id) ||
          (l.slug === lessonSlug && module.slug === moduleSlug);
        
        // Check if lesson has video
        const hasVideo = !!(
          l.video_provider ||
          l.video_id ||
          l.video_url ||
          (l.video_id && l.video_id.startsWith("http"))
        );
        
        return {
          id: String(l.id),
          slug: l.slug,
          title: l.title || "Lesson",
          minutes: l.duration_seconds ? Math.round(l.duration_seconds / 60) : 0,
          completed: l.completed || false,
          active,
          locked: l.locked || false,
          hasVideo,
        };
      });

      return {
        id: String(module.id),
        slug: module.slug,
        title: module.title || "Module",
        lessons,
      };
    });
  }, [allModules, lesson?.id, lessonSlug, moduleSlug]);

  if (loading) {
    return <StudentLessonSkeleton courseType={courseType} />;
  }

  if (accessDenied) {
    const isAiAutomations = (courseSlug || "").toLowerCase().replace(/_/g, "-").includes("ai-automation");
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
        <div className="max-w-md w-full rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-slate-800 p-8 text-center shadow-lg">
          <FiLock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access to this course is locked</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {isAiAutomations
              ? "AI Automations is free for everyone. If you’re seeing this lock screen, please refresh."
              : "You don't have access to this course. Purchase it to unlock."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Courses
            </button>
            <button
              onClick={() => navigate(basePath)}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              My Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-12 border border-slate-200 text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Lesson not found</h3>
            <button
              onClick={() => navigate(basePath)}
              className="mt-4 px-6 py-3 bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  const lessonPath = getStudentLessonPathForRoute(courseSlug, moduleSlug, lessonSlug, { pathname: location.pathname });
  const lessonDisplayTitle = lesson?.title || lesson?.name || lessonSlug;
  const isVibeCodingCourse = courseType === "vibe-coding";
  const slugNorm = String(moduleSlug || "").toLowerCase().replace(/_/g, "-").trim();
  const titleNorm = String(moduleTitle || "").toLowerCase().replace(/_/g, "-").trim();
  const firstModuleSlugNorm = String(allModules?.[0]?.slug || "")
    .toLowerCase()
    .replace(/_/g, "-")
    .trim();
  const firstModuleId = allModules?.[0]?.id != null ? String(allModules[0].id) : null;
  const currentModuleId = currentModule?.id != null ? String(currentModule.id) : null;
  const isVibeCodingBasicsModule =
    isVibeCodingCourse &&
    (
      slugNorm === "vibe-coding-basics" ||
      titleNorm.includes("vibe-coding-basics") ||
      titleNorm.includes("vibe coding basics") ||
      (firstModuleSlugNorm && slugNorm === firstModuleSlugNorm) ||
      (firstModuleId && currentModuleId && firstModuleId === currentModuleId)
    );
  const hasLessonVideo =
    !!alternateNativeVideos ||
    !!(lesson.video_provider === "cloudflare_stream" && lesson.video_id) ||
    !!(lesson.video_provider === "youtube" && lesson.video_id) ||
    !!(lesson.video_provider === "vimeo" && lesson.video_id) ||
    !!lesson.video_url ||
    !!(lesson.video_id && String(lesson.video_id).startsWith("http"));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      <ConfettiBurst active={showLessonConfetti} onDone={() => setShowLessonConfetti(false)} />
      <XPFloat amount={xpFloatAmount} show={showXPFloat} />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar-hidden on mobile, visible on md+ */}
        <nav className="hidden md:block flex-shrink-0 bg-white border-b border-slate-200 shadow-sm px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => navigate("/lms/student")} className="flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src="https://res.cloudinary.com/da2wrgabu/image/upload/v1776428629/Screenshot_2026-04-08_205030_r0cq4r.png"
                alt="ExpoGraph"
                className="h-11 w-48 ml-2 object-contain object-left"
              />
            </button>
            <div className="flex items-center gap-6 mr-16">
              <BookmarkButton lessonPath={lessonPath} lessonTitle={lessonDisplayTitle} />
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="w-56 lg:w-72 flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400 hover:text-slate-500 hover:border-slate-300 hover:bg-white transition-all text-left"
              >
                <FiSearch className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Search modules, lessons, sections...</span>
              </button>
              <button onMouseEnter={preloadHome} onClick={() => navigate("/lms/student")} className="text-slate-700 hover:text-slate-900 text-lg font-medium transition-colors whitespace-nowrap">Home</button>
              <button
                onMouseEnter={preloadProfile}
                onClick={() => navigate("/lms/student/profile")}
                className="text-slate-700 hover:text-slate-900 text-lg font-medium transition-colors whitespace-nowrap"
              >Profile</button>
            </div>
          </div>
        </nav>

        {/* Mobile lesson top bar */}
        <div className="flex md:hidden items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 safe-area-pt">
          <button onClick={() => setSidebarVisible(true)} className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0">
            <FiBookOpen className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 truncate">{moduleTitle || course?.title || "Course"}</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{lesson?.title || "Lesson"}</p>
          </div>
          <div className="flex-shrink-0">
            <BookmarkButton lessonPath={lessonPath} lessonTitle={lessonDisplayTitle} />
          </div>
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors flex-shrink-0"
          >
            <FiSearch className="w-5 h-5" />
          </button>
        </div>

        {/* Content area with sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar-normal flow */}
          <div className="hidden md:flex md:self-stretch md:min-h-0 md:flex-col">
            {sidebarVisible ? (
              <div className="h-full min-h-0 flex flex-col w-full">
              <CourseContentsSidebar
                courseTitle={course?.title || "Course"}
                modules={sidebarModules}
                totalDuration={getTotalCourseDuration() || "0 mins"}
                currentLessonId={lesson?.id ? String(lesson.id) : undefined}
                currentLessonSlug={lessonSlug}
                currentModuleSlug={moduleSlug}
                onBack={() => navigate(basePath)}
                onClose={() => setSidebarVisible(false)}
                onLessonSelect={async (item, moduleSlugParam) => {
                  const full = allLessons.find((l) => String(l.id) === item.id);
                  if (full && !full.locked) {
                    isManualNavigationRef.current = true;
                    const targetModuleSlug = moduleSlugParam || full.moduleSlug;
                    navigate(
                      getStudentLessonPathForRoute(courseSlug, targetModuleSlug, full.slug, { pathname: location.pathname }),
                      { replace: true }
                    );
                    await fetchLessonData(courseSlug, targetModuleSlug, full.slug, true);
                  }
                }}
              />
              </div>
            ) : null}
          </div>

          {/* Mobile sidebar-full-screen overlay */}
          <AnimatePresence>
            {sidebarVisible && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                className="md:hidden fixed inset-0 z-[60] flex"
              >
                <div className="w-full max-w-[320px] flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
                  <CourseContentsSidebar
                    courseTitle={course?.title || "Course"}
                    modules={sidebarModules}
                    totalDuration={getTotalCourseDuration() || "0 mins"}
                    currentLessonId={lesson?.id ? String(lesson.id) : undefined}
                    currentLessonSlug={lessonSlug}
                    currentModuleSlug={moduleSlug}
                    onBack={() => navigate(basePath)}
                    onClose={() => setSidebarVisible(false)}
                    className="!w-full !min-w-0"
                    onLessonSelect={async (item, moduleSlugParam) => {
                      const full = allLessons.find((l) => String(l.id) === item.id);
                      if (full && !full.locked) {
                        isManualNavigationRef.current = true;
                        const targetModuleSlug = moduleSlugParam || full.moduleSlug;
                        navigate(
                          getStudentLessonPathForRoute(courseSlug, targetModuleSlug, full.slug, { pathname: location.pathname }),
                          { replace: true }
                        );
                        setSidebarVisible(false);
                        await fetchLessonData(courseSlug, targetModuleSlug, full.slug, true);
                      }
                    }}
                  />
                </div>
                <div className="flex-1 bg-black/50" onClick={() => setSidebarVisible(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Open contents button-desktop only */}
            {!sidebarVisible && (
              <button
                type="button"
                onClick={() => setSidebarVisible(true)}
                className="hidden md:flex absolute left-0 top-0 z-50 w-12 h-12 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-b border-slate-900 text-white items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 transition-colors"
                aria-label="Open course contents"
              >
                <PanelLeftOpen className="w-6 h-6" strokeWidth={2} aria-hidden />
              </button>
            )}

        {/* Main content - scrollable */}
        <div ref={mainContentScrollRef} className="flex-1 overflow-y-auto bg-white relative">
          {/* Fixed Navbar - Module Name > Lesson Name (hidden on mobile, shown on mobile top bar instead) */}
          {(moduleTitle || lesson?.title) && (
            <div className="hidden md:block sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
              <div className="max-w-6xl mx-auto px-8 py-3">
                <nav className="flex items-center gap-2 text-sm">
                  {moduleTitle && (
                    <>
                      <span className="text-slate-600 font-medium">{moduleTitle}</span>
                      <span className="text-slate-400">/</span>
                    </>
                  )}
                  {lesson?.title && (
                    <span className="text-slate-900 font-semibold">{lesson.title}</span>
                  )}
                </nav>
              </div>
            </div>
          )}
          {contentLoading ? (
            <LessonContentSkeleton courseType={courseType} />
          ) : (
            <div className="max-w-6xl mx-auto">
            {/* Structured sections detection */}
            {(() => {
              const steps = lesson?.learn_setup_steps;
              const hasCBM = Array.isArray(steps) && steps.length > 0 &&
                typeof steps[0] === "object" && steps[0]?.type?.startsWith("CBM-");
              const hasPE = Array.isArray(steps) && steps.length > 0 &&
                typeof steps[0] === "object" && steps[0]?.type?.startsWith("SEC-");
              const hasVC = Array.isArray(steps) && steps.length > 0 &&
                typeof steps[0] === "object" && steps[0]?.type?.startsWith("VC-");
              const hasAA = Array.isArray(steps) && steps.length > 0 &&
                typeof steps[0] === "object" && steps[0]?.type?.startsWith("AA-");

              if (hasCBM) {
                return (
                  <div className="px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-8">
                    <ChatGptBusinessSections sections={steps} />
                  </div>
                );
              }
              if (hasPE) {
                return (
                  <div className="px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-8">
                    <PromptEngineeringSections
                      sections={steps}
                      lessonSlug={lessonSlug || lesson?.slug}
                      moduleSlug={moduleSlug || lesson?.module_slug}
                    />
                  </div>
                );
              }
              if (hasAA) {
                return (
                  <div className="px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-8">
                    <AiAutomationsSections sections={steps} />
                  </div>
                );
              }
              if (hasVC) {
                const top = steps.filter(s => ["VC-START","VC-YOU_ONLY","VC-01_MISSION","VC-02_WHAT_YOULL_BUILD","VC-03_PREREQUISITES","VC-04_WORKFLOW"].includes(s.type));
                return top.length > 0 ? (
                  <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 md:pb-4">
                    <VibeCodingSections sections={top} />
                  </div>
                ) : null;
              }
              return null;
            })()}

            {/* lesson_slides from API (markdown) — PE-style section chrome */}
            {Array.isArray(lesson?.slides) && lesson.slides.length > 0 && (
              <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2">
                <LessonSlidesReader slides={lesson.slides} />
              </div>
            )}

            {/* Goal Section - below navbar (regular lessons only) */}
            {lesson?.goal?.trim() && !(
              Array.isArray(lesson?.learn_setup_steps) &&
              lesson.learn_setup_steps.length > 0 &&
              typeof lesson.learn_setup_steps[0] === "object" &&
              (lesson.learn_setup_steps[0]?.type?.startsWith("SEC-") || lesson.learn_setup_steps[0]?.type?.startsWith("VC-") || lesson.learn_setup_steps[0]?.type?.startsWith("AA-") || lesson.learn_setup_steps[0]?.type?.startsWith("CBM-"))
            ) && (
              <div className="px-4 md:px-8 pt-4 md:pt-6 pb-4 md:pb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Goal</h3>
                  <div className="bg-slate-50 border-l-4 border-blue-500 pl-4 py-3">
                    <p className="text-slate-800 font-medium whitespace-pre-wrap">{lesson.goal.trim()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Player Section: always show for Vibe Coding (with Coming Soon fallback); other courses show only when video exists */}
            {lesson && !isVibeCodingBasicsModule && (hasLessonVideo || isVibeCodingCourse) ? (
              <div className="px-4 md:px-8 pb-4 md:pb-8">
                <div className="max-w-3xl mx-auto">
                {alternateNativeVideos && activeAlternateVideoSrc ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2">
                      <span className="text-xs font-semibold text-slate-700">Video language</span>
                      <div
                        className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-sm"
                        role="group"
                        aria-label="Lesson video language"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setLessonAlternateVideoLang("en");
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                            lessonAlternateVideoLang === "en"
                              ? "bg-slate-900 text-white shadow"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLessonAlternateVideoLang("te");
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                            lessonAlternateVideoLang === "te"
                              ? "bg-slate-900 text-white shadow"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          తెలుగు
                        </button>
                      </div>
                    </div>
                    <NativeLessonVideoPlayer
                      lessonKey={lesson.id}
                      videoSrc={activeAlternateVideoSrc}
                      videoRef={videoRef}
                      captionsBlobUrl={captionsBlobUrl}
                      captionsEnabled={captionsEnabled}
                      setCaptionsEnabled={setCaptionsEnabled}
                      setVideoReady={setVideoReady}
                    />
                  </div>
                ) : lesson.video_provider === "cloudflare_stream" && lesson.video_id ? (
                  <div className="bg-black overflow-hidden shadow-xl relative">
                    <div className="aspect-video bg-black relative md:max-h-[450px]">
                      {videoTokenLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-white border-t-transparent animate-spin mx-auto mb-4" style={{ borderRadius: 0 }}></div>
                            <p className="text-lg font-medium">Loading video...</p>
                          </div>
                        </div>
                      ) : videoToken?.iframeUrl ? (
                        <iframe
                          src={videoToken.iframeUrl}
                          title={lesson.title}
                          className="w-full h-full"
                          allow="accelerometer; gyroscope; autoplay; encrypted-media"
                          allowFullScreen
                          disablePictureInPicture
                        />
                      ) : videoError ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black text-white p-4">
                          <div className="text-center max-w-md">
                            <FiPlay className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-semibold mb-2">Unable to load video</p>
                            <p className="text-sm text-gray-300 mb-6">{videoError}</p>
                            <button
                              onClick={() => lesson?.id && fetchVideoToken(lesson.id)}
                              className="px-6 py-3 bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-white border-t-transparent animate-spin mx-auto mb-4" style={{ borderRadius: 0 }}></div>
                            <p className="text-lg font-medium">Preparing video...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : lesson.video_provider === "youtube" && lesson.video_id ? (
                  <div className="bg-black overflow-hidden shadow-xl">
                    <div className="aspect-video bg-black md:max-h-[450px]">
                      <iframe
                        src={`https://www.youtube.com/embed/${lesson.video_id}?cc_load_policy=1&modestbranding=1`}
                        title={lesson.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                        disablePictureInPicture
                      />
                    </div>
                  </div>
                ) : lesson.video_provider === "vimeo" && lesson.video_id ? (
                  <div className="bg-black overflow-hidden shadow-xl">
                    <div className="aspect-video bg-black md:max-h-[450px]">
                      <iframe
                        src={`https://player.vimeo.com/video/${lesson.video_id}`}
                        title={lesson.title}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        disablePictureInPicture
                      />
                    </div>
                  </div>
                ) : lesson.video_url || (lesson.video_id && String(lesson.video_id).startsWith("http")) ? (
                  <NativeLessonVideoPlayer
                    lessonKey={lesson.id}
                    videoSrc={lesson.video_url || lesson.video_id}
                    videoRef={videoRef}
                    captionsBlobUrl={captionsBlobUrl}
                    captionsEnabled={captionsEnabled}
                    setCaptionsEnabled={setCaptionsEnabled}
                    setVideoReady={setVideoReady}
                  />
                ) : isVibeCodingCourse ? (
                  <ComingSoonVideoPlaceholder lessonTitle={lesson?.title || "this lesson"} />
                ) : null}
                {lessonImportantLinks && <LessonImportantLinks links={lessonImportantLinks} />}
                </div>
              </div>
              ) : null}

              {/* Prompts - classic tabs design - only show if at least one prompt exists */}
              {lesson?.prompts && typeof lesson.prompts === "object" && 
              (lesson.prompts.prompts != null || lesson.prompts.commands != null || lesson.prompts.error_resolve != null) && (
                <div className="px-4 md:px-8 pb-4 md:pb-8">
                  <div className="mt-8">
                  <Tabs
                    value={activePromptTab}
                    onValueChange={setActivePromptTab}
                    className="w-full border border-slate-300 bg-white rounded-none"
                  >
                    <TabsList className="w-full justify-start h-auto p-0 bg-slate-50 border-b border-slate-300 rounded-none gap-0 overflow-x-auto">
                      {lesson.prompts.prompts != null && (
                        <TabsTrigger
                          value="prompts"
                          className="px-3 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-normal text-slate-600 border-b-2 border-transparent rounded-none data-[state=active]:text-slate-900 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:font-medium hover:text-slate-800 transition-colors whitespace-nowrap"
                        >
                          Prompts
                        </TabsTrigger>
                      )}
                      {lesson.prompts.commands != null && (
                        <TabsTrigger
                          value="commands"
                          className="px-3 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-normal text-slate-600 border-b-2 border-transparent rounded-none data-[state=active]:text-slate-900 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:font-medium hover:text-slate-800 transition-colors whitespace-nowrap"
                        >
                          Commands
                        </TabsTrigger>
                      )}
                      {lesson.prompts.error_resolve != null && (
                        <TabsTrigger
                          value="error_resolve"
                          className="px-3 md:px-5 py-2.5 md:py-3 text-xs md:text-sm font-normal text-slate-600 border-b-2 border-transparent rounded-none data-[state=active]:text-slate-900 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:font-medium hover:text-slate-800 transition-colors whitespace-nowrap"
                        >
                          Error handling
                        </TabsTrigger>
                      )}
                    </TabsList>
                    {lesson.prompts.prompts != null && (
                      <TabsContent value="prompts" className="p-0 mt-0">
                        <div className="p-4">
                          <CodeBlock
                            language="Prompts"
                            content={lesson.prompts.prompts}
                            promptPrefix=">"
                            variant="blue"
                            defaultTheme="dark"
                            onCopy={() => handleCopy(lesson.prompts.prompts, "prompts")}
                            copied={copiedIndex === "prompts"}
                            className="max-w-full"
                          />
                        </div>
                      </TabsContent>
                    )}
                    {lesson.prompts.commands != null && (
                      <TabsContent value="commands" className="p-0 mt-0">
                        <div className="p-4">
                          <CodeBlock
                            language="Commands"
                            content={lesson.prompts.commands}
                            promptPrefix="$"
                            variant="purple"
                            defaultTheme="dark"
                            onCopy={() => handleCopy(lesson.prompts.commands, "commands")}
                            copied={copiedIndex === "commands"}
                            className="max-w-full"
                          />
                        </div>
                      </TabsContent>
                    )}
                    {lesson.prompts.error_resolve != null && (
                      <TabsContent value="error_resolve" className="p-0 mt-0">
                        <div className="p-4">
                          <CodeBlock
                            language="Error handling"
                            content={lesson.prompts.error_resolve}
                            promptPrefix="!"
                            variant="red"
                            defaultTheme="dark"
                            onCopy={() => handleCopy(lesson.prompts.error_resolve, "error_resolve")}
                            copied={copiedIndex === "error_resolve"}
                            className="max-w-full"
                          />
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                  </div>
                </div>
              )}

            {/* VC middle sections (Success Criteria)-after prompts, before success images */}
            {(() => {
              const steps = lesson?.learn_setup_steps;
              const hasVC = Array.isArray(steps) && steps.length > 0 &&
                typeof steps[0] === "object" && steps[0]?.type?.startsWith("VC-");
              if (!hasVC) return null;
              const mid = steps.filter(s => s.type === "VC-05_SUCCESS_CRITERIA");
              return mid.length > 0 ? (
                <div className="px-4 md:px-8 pb-4 md:pb-6">
                  <VibeCodingSections sections={mid} />
                </div>
              ) : null;
            })()}

            {/* Learn and Setup - Step-based section (regular lessons only) */}
            {!(Array.isArray(lesson?.learn_setup_steps) && lesson.learn_setup_steps.length > 0 && typeof lesson.learn_setup_steps[0] === "object" && (lesson.learn_setup_steps[0]?.type?.startsWith("SEC-") || lesson.learn_setup_steps[0]?.type?.startsWith("VC-") || lesson.learn_setup_steps[0]?.type?.startsWith("AA-") || lesson.learn_setup_steps[0]?.type?.startsWith("CBM-"))) &&
            ((Array.isArray(lesson?.learn_setup_steps) && lesson.learn_setup_steps.length > 0) || lesson?.summary?.trim()) && (
              <div className="px-4 md:px-8 pb-4 md:pb-8">
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-expanded={summaryExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                        <FiTarget className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Learn and Setup</h2>
                        <p className="text-base text-slate-500 font-normal">Essential information to get started</p>
                      </div>
                    </div>
                    {summaryExpanded ? (
                      <FiChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    ) : (
                      <FiChevronDown className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {summaryExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t-2 border-blue-200 overflow-hidden"
                      >
                        <div className="px-6 py-5 bg-white/60">
                          {(() => {
                            const stepsList = (Array.isArray(lesson?.learn_setup_steps) && lesson.learn_setup_steps.length > 0)
                              ? lesson.learn_setup_steps.filter((s) => s && String(s).trim())
                              : (lesson?.summary?.trim()
                                  ? (() => {
                                      const steps = lesson.summary.trim().split(/\n-{2,}\n|\n\n-{2,}\n\n/).map((s) => s.trim()).filter(Boolean);
                                      return steps.length > 0 ? steps : [lesson.summary.trim()];
                                    })()
                                  : []);
                            if (stepsList.length === 0) return null;
                            const currentStepIndex = Math.min(selectedLearnStepIndex, stepsList.length - 1);
                            const currentStepContent = stepsList[currentStepIndex] || "";
                            return (
                              <>
                                {stepsList.length > 1 && (
                                  <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {stepsList.map((_, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedLearnStepIndex(idx)}
                                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                          idx === currentStepIndex
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                        }`}
                                      >
                                        Step {idx}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="prose prose-slate max-w-prose text-left">
                                  {currentStepContent.split(/\n\n+/).map((block, i) => (
                                    <p key={i} className="text-slate-700 leading-7 text-base font-normal mb-4 last:mb-0 whitespace-pre-wrap">
                                      {block.trim()}
                                    </p>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}



              {/* VC bottom sections (learning + closing)-after success images */}
              {(() => {
                const steps = lesson?.learn_setup_steps;
                const hasVC = Array.isArray(steps) && steps.length > 0 &&
                  typeof steps[0] === "object" && steps[0]?.type?.startsWith("VC-");
                if (!hasVC) return null;
                const bottom = steps.filter(s =>
                  ["VC-06_UNDER_THE_HOOD","VC-07_PRO_TIPS","VC-08_COMMON_PITFALLS","VC-09_LEVEL_UP","VC-10_CHECKPOINT"].includes(s.type)
                );
                return bottom.length > 0 ? (
                  <div className="px-4 md:px-8 pb-4 md:pb-8">
                    <VibeCodingSections sections={bottom} />
                  </div>
                ) : null;
              })()}

              {/* Presentation (PDF) - Slides section */}
              {lesson?.pdf_url && (
                <div className="px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Slides</h3>
                  <div className="flex justify-center">
                    <PDFPresentationViewer pdfUrl={lesson.pdf_url} />
                  </div>
                </div>
              )}

              {/* Quiz / practice (if present)-tour target when MCQs exist */}
              {mcqs?.length > 0 && (
                <div className="px-4 md:px-8 pb-4 md:pb-8" aria-label="Lesson quiz" />
              )}

              {/* Resources (cheatsheets, links, text) */}
              {resources?.length > 0 && (
                <div className="px-4 md:px-8 pb-4 md:pb-8">
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <FiLayers className="w-5 h-5 text-slate-600" />
                      Resources
                    </h3>
                    <div className="space-y-3">
                      {resources.map((res) => (
                        <div
                          key={res.id}
                          className="border border-slate-200 bg-white shadow-sm overflow-hidden"
                        >
                          <div className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-slate-100 flex items-center justify-center flex-shrink-0">
                                {res.type === "link" ? (
                                  <FiFileText className="w-5 h-5 text-blue-600" />
                                ) : res.type === "cheatsheet" ? (
                                  <FiCode className="w-5 h-5 text-purple-600" />
                                ) : (
                                  <FiFileText className="w-5 h-5 text-slate-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">{res.title}</p>
                                <p className="text-xs text-slate-500 capitalize">{res.type}</p>
                              </div>
                            </div>
                            {res.url ? (
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                              >
                                Open
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedResource(res)}
                                className="flex-shrink-0 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                              >
                                View
                              </button>
                            )}
                          </div>
                          {res.body && res.type === "text" && (
                            <div className="px-4 pb-4 pt-0">
                              <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">{res.body}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mark as complete + Next Lesson - visible at bottom */}
              <div className="px-4 md:px-8 pb-4 md:pb-8">
                <div className="mt-6 md:mt-10 pt-4 md:pt-8 border-t border-slate-200 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {prevLesson && (
                      <button
                        type="button"
                        onClick={handlePrevLesson}
                        className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <FiChevronLeft className="w-4 h-4" />
                        <span>Previous lesson</span>
                      </button>
                    )}
                    {!completed ? (<>
                      <button
                        type="button"
                        onClick={handleMarkComplete}
                        disabled={markCompleteLoading}
                        className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        aria-label={markCompleteLoading ? "Marking as complete…" : "Mark lesson complete"}
                      >
                        {markCompleteLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" aria-hidden />
                            <span>Marking as complete...</span>
                          </>
                        ) : (
                          <>
                            <FiCheckCircle className="w-4 h-4 text-slate-600" />
                            <span>Mark as complete</span>
                          </>
                        )}
                      </button>
                      {markCompleteError && (
                        <p className="text-xs text-red-500 mt-1">{markCompleteError}</p>
                      )}
                    </>) : (
                      <div className="flex items-center gap-2 text-slate-600 text-sm" role="status" aria-label="Lesson completed">
                        <FiCheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                  {nextLesson && (
                    <button
                      type="button"
                      onClick={handleNextLesson}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                      <span>Next lesson</span>
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  </div>
                </div>
                {/* Completion message with share */}
                <LessonCompleteMessage
                  show={completed}
                  lessonsLeft={moduleLessons.filter(l => !l.completed).length}
                  moduleName={lesson?.module_title || moduleSlug}
                  onShare={() => setShareModalOpen(true)}
                />
                {/* Notes */}
                <div className="mt-4">
                  <LessonNotes lessonPath={lessonPath} />
                </div>
                {/* Lesson feedback-with love */}
                {token && courseSlug && moduleSlug && lessonSlug && (
                  <>
                    <StudentDoubtsPanel
                      scope="lesson"
                      courseSlug={courseSlug}
                      moduleSlug={moduleSlug}
                      lessonSlug={lessonSlug}
                      contextTitle={lesson?.title}
                      token={token}
                    />
                    <LessonFeedbackCard
                      courseSlug={courseSlug}
                      moduleSlug={moduleSlug}
                      lessonSlug={lessonSlug}
                      lessonTitle={lesson?.title}
                      token={token}
                    />
                  </>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
        </div>
      </main>

      {/* Resource Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">{selectedResource.title}</h2>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-2 hover:bg-slate-100"
              >
                <FiX className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            {selectedResource.body && (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-slate-700">{selectedResource.body}</pre>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <LessonSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        token={token}
        allLessons={allLessons}
        currentLessonId={lesson?.id}
        courseSlug={courseSlug}
        onLessonSelect={handleSearchLessonSelect}
        onModuleSelect={handleSearchModuleSelect}
      />

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        context="all"
      />

      <ShareProgressModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        lessonTitle={lessonDisplayTitle}
        courseName={course?.title || courseSlug}
      />
    </div>
  );
}
