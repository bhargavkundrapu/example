import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../providers/AuthProvider";
import BrandLogo from "../../Components/ui/BrandLogo";
import {
  FiHome,
  FiUsers,
  FiBook,
  FiUserCheck,
  FiCalendar,
  FiAward,
  FiBriefcase,
  FiPackage,
  FiSearch,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiLogOut,
  FiCheckSquare,
  FiHelpCircle,
  FiUser,
  FiMessageSquare,
} from "react-icons/fi";

export default function SuperAdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userName = user?.fullName || user?.full_name || user?.name || "Super Admin";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    setMobileMenuOpen(false);
    setSidebarSearch("");
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const menuItems = [
    { path: "/lms/superadmin", label: "Home", icon: FiHome },
    { path: "/lms/superadmin/approvals", label: "Approvals", icon: FiCheckSquare },
    { path: "/lms/superadmin/feedback", label: "Feedback", icon: FiMessageSquare },
    { path: "/lms/superadmin/students", label: "Students", icon: FiUsers },
    { path: "/lms/superadmin/courses", label: "Courses", icon: FiBook },
    { path: "/lms/superadmin/course-packs", label: "Course Packs", icon: FiPackage },
    { path: "/lms/superadmin/mentors", label: "Mentors", icon: FiUserCheck },
    { path: "/lms/superadmin/workshops", label: "Events", icon: FiCalendar },
    { path: "/lms/superadmin/certificates", label: "Certificates", icon: FiAward },
    { path: "/lms/superadmin/certifications", label: "Certificate requests", icon: FiAward },
    { path: "/lms/superadmin/client-lab/real-world", label: "Real Client Lab", icon: FiBriefcase },
  ];

  const mobileBottomItems = [
    { path: "/lms/superadmin", label: "Home", icon: FiHome },
    { path: "/lms/superadmin/approvals", label: "Approvals", icon: FiCheckSquare },
    { path: "/lms/superadmin/students", label: "Students", icon: FiUsers },
    { path: "/lms/superadmin/courses", label: "Courses", icon: FiBook },
  ];

  const filteredMenuItems = useMemo(() => {
    if (!sidebarSearch.trim()) return menuItems;
    const q = sidebarSearch.toLowerCase().trim();
    return menuItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [sidebarSearch]);

  const isActive = (path) => {
    if (path === "/lms/superadmin") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* ── Mobile Top Bar ── */}
      <header className="sticky top-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
          >
            <FiMenu className="w-6 h-6" />
          </button>

          <Link to="/lms/superadmin" className="flex-shrink-0">
            <BrandLogo alt="ExpoGraph" className="h-8 w-auto object-contain max-w-[112px]" />
          </Link>

          <div className="flex-1" />

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-700 active:scale-95 transition-transform"
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
                  className="absolute right-0 top-12 w-64 bg-slate-800 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                >
                  <div className="p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm truncate">{userName}</p>
                        {userEmail && <p className="text-slate-400 text-xs truncate">{userEmail}</p>}
                        <p className="text-blue-400 text-xs mt-0.5">Super Admin</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/lms/superadmin/settings"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <FiSettings className="w-4 h-4" />
                      <span>Settings</span>
                      <FiChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
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

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex h-[calc(100dvh-52px)] md:h-screen overflow-hidden">
        {/* ── Sidebar ── */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarCollapsed ? "80px" : "280px" }}
          className={`
            fixed md:static inset-y-0 left-0 z-50
            bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
            border-r border-slate-900
            flex flex-col
            transition-transform duration-300 ease-in-out
            w-[280px] md:w-auto
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Logo Section */}
          <div className="h-20 flex items-center justify-between px-4 border-b border-slate-700/50">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center"
                >
                  <BrandLogo alt="ExpoGraph" className="h-11 w-48 object-contain object-left" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <BrandLogo variant="icon" alt="ExpoGraph" className="h-10 w-10 object-contain" />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FiChevronLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-300 hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-4 border-b border-slate-700/50">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                  ref={searchRef}
                >
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Search pages..."
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  {sidebarSearch && (
                    <button
                      onMouseDown={() => setSidebarSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
                    title="Search"
                  >
                    <FiSearch className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 sidebar-scrollbar">
            <div className="space-y-1">
              {filteredMenuItems.length > 0 ? (
                filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => { setSidebarSearch(""); setMobileMenuOpen(false); }}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-md
                        transition-all duration-200
                        ${active
                          ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-500"
                          : "text-slate-300 hover:text-white hover:bg-slate-700/30"
                        }
                      `}
                      title={sidebarCollapsed ? item.label : ""}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-blue-400" : ""}`} />
                      <AnimatePresence>
                        {!sidebarCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="font-medium text-sm"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {active && !sidebarCollapsed && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-md -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })
              ) : (
                !sidebarCollapsed && sidebarSearch.trim() && (
                  <div className="px-3 py-4 text-center text-sm text-slate-500">
                    No pages found
                  </div>
                )
              )}
            </div>
          </nav>

          {/* Profile Section */}
          <div className="border-t border-slate-700/50 p-4">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{userName}</p>
                      <p className="text-slate-400 text-xs">Super Admin</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors text-sm"
                      onClick={() => navigate("/lms/superadmin/settings")}
                    >
                      <FiSettings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors text-sm"
                      onClick={handleLogout}
                    >
                      <FiLogOut className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {userInitial}
                  </div>
                  <button
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-700/30 transition-colors"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden md:rounded-tl-lg bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-xl relative z-10">
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0 premium-scrollbar md:rounded-tl-lg min-h-0">
            <div className="min-h-full md:rounded-tl-lg overflow-hidden bg-transparent">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1.5">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-0 transition-all duration-200 ${
                  active ? "text-blue-400" : "text-slate-500 active:text-slate-300"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? "text-blue-400" : ""}`} />
                  {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />}
                </div>
                <span className={`text-[10px] font-medium leading-tight ${active ? "text-blue-400" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
