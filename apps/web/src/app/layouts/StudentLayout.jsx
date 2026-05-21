import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";
import StudentSearchModal from "../../Components/student/StudentSearchModal";
import KeyboardShortcutsModal from "../../Components/student/KeyboardShortcutsModal";
import BrandLogo from "../../Components/ui/BrandLogo";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import IdleReengagement from "../../Components/student/gamification/IdleReengagement";
import StudentOfflineBanner from "../../Components/student/StudentOfflineBanner";

// Preload student route chunks so navigation feels instant
const preloadProfile = () => import("../../pages/lms/student/StudentProfile");
const preloadMap = {
  "/lms/student": () => import("../../pages/lms/student/StudentHome"),
  "/lms/student/program-journey": () => import("../../pages/lms/student/StudentProgramJourney"),
  "/lms/student/courses": () => import("../../pages/lms/student/StudentCourses"),
  "/lms/student/bonus-courses": () => import("../../pages/lms/student/StudentCourses"),
  "/lms/student/bookmarks": () => import("../../pages/lms/student/StudentBookmarks"),
  "/lms/student/certificates": () => import("../../pages/lms/student/StudentCertificates"),
  "/lms/student/client-lab": () => import("../../pages/lms/student/StudentClientLab"),
  "/lms/student/resume-builder": () => import("../../pages/lms/student/StudentResumeBuilder"),
  "/lms/student/contact": () => import("../../pages/lms/student/StudentContact"),
  "/lms/student/profile": () => import("../../pages/lms/student/StudentProfile"),
  "/lms/student/submissions": () => import("../../pages/lms/student/StudentSubmissions"),
  "/lms/student/progress": () => import("../../pages/lms/student/StudentProgress"),
  "/lms/student/events": () => import("../../pages/lms/student/StudentEvents"),
  "/lms/student/workshops": () => import("../../pages/lms/student/StudentWorkshops"),
  "/lms/student/referrals": () => import("../../pages/lms/student/StudentReferrals"),
  "/lms/student/question-bank": () => import("../../pages/lms/student/StudentQuestionBank"),
  "/lms/student/internships": () => import("../../pages/lms/student/StudentInternships"),
  "/lms/jobs": () => import("../../pages/lms/student/StudentJobsPage"),
  "/lms/startup-launchpad": () => import("../../Components/startup-launchpad/StartupLaunchPadShell"),
  // Dynamic routes (preloaded so course/lesson pages open fast)
  "/lms/student/courses/landing": () => import("../../pages/lms/student/StudentCourseLanding"),
  "/lms/student/lesson": () => import("../../pages/lms/student/StudentLesson"),
};
const preloadAllStudentChunks = () => {
  Object.values(preloadMap).forEach((fn) => { fn().catch(() => {}); });
};
import {
  FiHome,
  FiBookOpen,
  FiFileText,
  FiBriefcase,
  FiUser,
  FiSearch,
  FiChevronLeft,
  FiLogOut,
  FiAward,
  FiChevronRight,
  FiHelpCircle,
  FiMoon,
  FiSun,
  FiBookmark,
  FiTrendingUp,
  FiZap,
  FiLock,
  FiNavigation,
} from "react-icons/fi";

export default function StudentLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const { isDark, toggleMode, accent } = useTheme();

  useKeyboardShortcuts({
    openSearch: () => setSearchModalOpen(true),
    openHelp: () => setShortcutsOpen(true),
    closeModal: () => {
      if (shortcutsOpen) setShortcutsOpen(false);
      else if (searchModalOpen) setSearchModalOpen(false);
      else if (profileOpen) setProfileOpen(false);
    },
    toggleDarkMode: toggleMode,
  });

  const allMenuItems = [
    { path: "/lms/student", label: "Home", icon: FiHome },
    { path: "/lms/student/program-journey", label: "Program map", icon: FiNavigation },
    { path: "/lms/student/courses", label: "Courses", icon: FiBookOpen },
    { path: "/lms/student/bonus-courses", label: "Bonus Courses", icon: FiFileText },
    { path: "/lms/student/client-lab", label: "Real Client Lab", icon: FiBriefcase },
    { path: "/lms/startup-launchpad", label: "Startup LaunchPad", icon: FiZap },
    { path: "/lms/student/resume-builder", label: "Resume Builder", icon: FiFileText },
    { path: "/lms/jobs", label: "Jobs Hub", icon: FiTrendingUp },
    { path: "/lms/student/certificates", label: "Certificates", icon: FiAward },
    { path: "/lms/student/bookmarks", label: "Bookmarks", icon: FiBookmark },
    { path: "/lms/student/contact", label: "Support", icon: FiHelpCircle },
  ];

  const mobileBottomItems = [
    { path: "/lms/student", label: "Home", icon: FiHome },
    { path: "/lms/student/program-journey", label: "Map", icon: FiNavigation, title: "Program map" },
    { path: "/lms/student/courses", label: "Courses", icon: FiBookOpen },
    // Below-medium responsive swap:
    // - Show Real Client Lab where "Resume" used to be
    // - Show Resume Builder where Real Client Lab position was
    { path: "/lms/student/resume-builder", label: "Resume", icon: FiAward },
    { path: "/lms/student/client-lab", label: "Client Lab", icon: FiBriefcase },
    { path: "/lms/startup-launchpad", label: "LaunchPad", icon: FiZap, title: "Startup LaunchPad" },
  ];

  const isActive = (path) => {
    if (path === "/lms/student") return location.pathname === path;
    if (path === "/lms/jobs") return location.pathname === "/lms/jobs";
    return location.pathname.startsWith(path);
  };

  const isLessonPage = location.pathname.match(/\/lms\/student\/(courses|bonus-courses)\/.+\/modules\/.+\/lessons\/.+/);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  useEffect(() => { setProfileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#0f172a");
    return () => { if (meta) meta.setAttribute("content", "#000000"); };
  }, []);

  useEffect(() => {
    const timer = setTimeout(preloadProfile, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Preload student route chunks when browser is idle.
  // This keeps the initial LMS render responsive while still warming navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = () => preloadAllStudentChunks();

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(run, { timeout: 6000 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const t = setTimeout(run, 2000);
    return () => clearTimeout(t);
  }, []);

  if (isLessonPage) {
    return (
      <>
        <StudentOfflineBanner />
        <Outlet />
      </>
    );
  }

  const userName = user?.fullName || user?.full_name || user?.name || "Student";
  const userEmail = user?.email || "";
  const userPhone = user?.phone || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const launchPadLocked = user?.client_lab_checklist?.hasAccess === false;

  return (
      <div className={`min-h-screen transition-colors duration-200 ${isDark ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" : "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"}`}>
        <StudentOfflineBanner />
        {/* ── Mobile Top Bar ── */}
      <header className="sticky top-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/lms/student"><BrandLogo alt="ExpoGraph" className="h-8 w-auto object-contain flex-shrink-0 max-w-[112px]" /></Link>

          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-800/70 rounded-xl text-slate-400 text-sm btn-press"
          >
            <FiSearch className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Search courses...</span>
          </button>

          <button
            onClick={toggleMode}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/70 text-slate-300 hover:text-white transition-colors btn-press flex-shrink-0"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-700 active:scale-95 transition-transform"
            >
              {userInitial}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 bg-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                >
                  <div className="p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm truncate">{userName}</p>
                        {userEmail && <p className="text-slate-400 text-xs truncate">{userEmail}</p>}
                        {userPhone && <p className="text-slate-400 text-xs truncate">{userPhone}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                    <button
                      onMouseEnter={preloadProfile}
                      onClick={() => { setProfileOpen(false); navigate("/lms/student/profile"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <FiUser className="w-4 h-4" />
                      <span>My Profile</span>
                      <FiChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/lms/student/certificates"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <FiAward className="w-4 h-4" />
                      <span>Certificates</span>
                      <FiChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/lms/student/bookmarks"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <FiBookmark className="w-4 h-4" />
                      <span>Bookmarks</span>
                      <FiChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => preloadMap["/lms/jobs"]?.()}
                      onClick={() => {
                        setProfileOpen(false);
                        preloadMap["/lms/jobs"]?.();
                        navigate("/lms/jobs");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <FiTrendingUp className="w-4 h-4" />
                      <span>Jobs Hub</span>
                      <FiChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/lms/student/bonus-courses"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <FiFileText className="w-4 h-4" />
                      <span>Bonus Courses</span>
                      <FiChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/lms/student/contact"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <FiHelpCircle className="w-4 h-4" />
                      <span>Support</span>
                      <FiChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
                    <div className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100dvh-52px)] md:h-screen overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? "80px" : "280px" }}
          className="hidden md:flex fixed md:static inset-y-0 left-0 z-50 bg-slate-900 flex-col transition-all duration-300 ease-in-out w-64"
        >
          <div className="h-20 flex items-center justify-between px-4">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center">
                  <BrandLogo alt="ExpoGraph" className="h-11 m-4 mt-8 w-48 object-contain object-left" />
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                  <BrandLogo variant="icon" alt="ExpoGraph" className="h-10 w-10 object-contain" />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FiChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="px-4 pt-4 pb-4">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
                  <button
                    type="button"
                    onClick={() => setSearchModalOpen(true)}
                    className="w-full flex items-center gap-3 pl-3 pr-3 py-2.5 bg-slate-800/50 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all text-left"
                  >
                    <FiSearch className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate flex-1">Search courses, modules...</span>
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-slate-500 bg-slate-700/50 border border-slate-600/50 rounded">⌘K</kbd>
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center">
                  <button type="button" onClick={() => setSearchModalOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors" title="Search">
                    <FiSearch className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-2 sidebar-scrollbar">
            <div className="space-y-1">
              {allMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isLaunchPad = item.path === "/lms/startup-launchpad";
                const lockTitle = isLaunchPad && launchPadLocked ? "All Pack or all three main courses required" : "";
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onMouseEnter={() => preloadMap[item.path]?.()}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${active ? "text-white border-l-2" : "text-slate-300 hover:text-white hover:bg-slate-700/30"}`}
                    style={active ? { borderLeftColor: accent.value, background: `linear-gradient(to right, ${accent.value}20, ${accent.value}08)` } : undefined}
                    title={sidebarCollapsed ? (lockTitle || item.label) : lockTitle || undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" style={active ? { color: accent.value } : undefined} />
                    {isLaunchPad && launchPadLocked && sidebarCollapsed && (
                      <FiLock className="w-3.5 h-3.5 shrink-0 text-amber-400/85" aria-hidden />
                    )}
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-1 items-center gap-2 min-w-0">
                          <span className="truncate">{item.label}</span>
                          {isLaunchPad && launchPadLocked && (
                            <FiLock className="w-3.5 h-3.5 shrink-0 text-amber-400/85" aria-hidden />
                          )}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Dark mode & shortcuts row */}
          <div className="px-2 pt-2 pb-1">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                  <button
                    onClick={toggleMode}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all text-sm btn-press"
                    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                    <span>{isDark ? "Light" : "Dark"}</span>
                  </button>
                  <button
                    onClick={() => setShortcutsOpen(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors text-sm"
                    title="Keyboard shortcuts (?)"
                  >
                    <span className="text-base font-bold">?</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1">
                  <button
                    onClick={toggleMode}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors btn-press"
                    title={isDark ? "Light mode" : "Dark mode"}
                  >
                    {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2">
                    <button onMouseEnter={preloadProfile} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors text-sm btn-press" onClick={() => navigate("/lms/student/profile")}>
                      <FiUser className="w-4 h-4" /><span>Profile</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors text-sm btn-press" onClick={handleLogout}>
                      <FiLogOut className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                    {userInitial}
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors btn-press" onClick={handleLogout} title="Logout">
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        <StudentSearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} token={token} />

        {/* ── Main Content ── */}
        <div className={`flex-1 flex flex-col overflow-hidden lg:rounded-tl-lg shadow-xl relative z-10 transition-colors duration-200 ${isDark ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" : "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"}`}>
          <main className={`flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0 lg:rounded-tl-lg min-h-0 ${isDark ? "student-dark-content" : ""}`}>
            <IdleReengagement />
            <div className="min-h-full lg:rounded-tl-lg overflow-hidden bg-transparent">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md safe-area-pb">
        <div className="grid grid-cols-6 items-stretch px-0.5 py-1.5 gap-0.5">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.title ?? item.label}
                aria-label={item.title ?? item.label}
                onTouchStart={() => preloadMap[item.path]?.()}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-xl min-w-0 min-h-[52px] transition-all duration-200 btn-press ${active ? "" : "text-slate-500 active:text-slate-300"}`}
                style={active ? { color: accent.value } : undefined}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.path === "/lms/startup-launchpad" && launchPadLocked && (
                    <span className="absolute -right-1 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-800 ring-1 ring-amber-500/50">
                      <FiLock className="h-2 w-2 text-amber-400/90" aria-hidden />
                    </span>
                  )}
                  {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: accent.value }} />}
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight text-center line-clamp-2">{item.label}</span>
              </Link>
            );
          })}

        </div>
      </nav>

      {/* ── Keyboard Shortcuts Modal ── */}
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        context="global"
      />
      </div>
  );
}
