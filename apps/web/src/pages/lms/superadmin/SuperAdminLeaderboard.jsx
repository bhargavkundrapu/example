import { useCallback, useEffect, useMemo, useState } from "react";
import { FiAward, FiChevronDown, FiChevronUp, FiFilter, FiRefreshCw, FiSearch, FiTrendingUp, FiUsers, FiX } from "react-icons/fi";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiFetch } from "../../../services/api";

function ProgressBar({ percent }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const colorClass =
    pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-slate-400";

  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RankPill({ rank }) {
  if (rank === 1) return <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">#1</span>;
  if (rank === 2) return <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">#2</span>;
  if (rank === 3) return <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">#3</span>;
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">#{rank}</span>;
}

function Avatar({ name }) {
  const initial = (name || "S").trim().charAt(0).toUpperCase();
  return (
    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-semibold text-sm">
      {initial || "S"}
    </div>
  );
}

export default function SuperAdminLeaderboard() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [filters, setFilters] = useState({
    college: "",
    completionState: "",
    minProgress: "",
    maxProgress: "",
    minRank: "",
    maxRank: "",
    minCompletedLessons: "",
    maxCompletedLessons: "",
    minTotalLessons: "",
    maxTotalLessons: "",
    minCourses: "",
    maxCourses: "",
    courseName: "",
    courseMinProgress: "",
    courseMaxProgress: "",
  });

  const loadLeaderboard = useCallback(
    async ({ hardRefresh = false } = {}) => {
      if (!token) return;
      if (hardRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        const q = search.trim();
        if (q) qs.set("search", q);
        qs.set("limit", "500");
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        const json = await apiFetch(`/api/v1/admin/students/leaderboard${suffix}`, { token, noCache: true });
        setRows(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        setRows([]);
        setError(e?.message || "Failed to load leaderboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, search]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      loadLeaderboard();
    }, 220);
    return () => clearTimeout(t);
  }, [loadLeaderboard]);

  const stats = useMemo(() => {
    const total = rows.length;
    const avg =
      total > 0
        ? Math.round(rows.reduce((acc, r) => acc + (Number(r.progress_percent) || 0), 0) / total)
        : 0;
    const completed = rows.filter((r) => Number(r.progress_percent) >= 100).length;
    return { total, avg, completed };
  }, [rows]);

  const availableCourses = useMemo(() => {
    const names = new Set();
    rows.forEach((student) => {
      const list = Array.isArray(student.course_progress) ? student.course_progress : [];
      list.forEach((c) => {
        if (c?.title) names.add(String(c.title));
      });
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  function toNum(v) {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  const filteredRows = useMemo(() => {
    const collegeQ = filters.college.trim().toLowerCase();
    const courseQ = filters.courseName.trim().toLowerCase();
    const minProgress = toNum(filters.minProgress);
    const maxProgress = toNum(filters.maxProgress);
    const minRank = toNum(filters.minRank);
    const maxRank = toNum(filters.maxRank);
    const minCompletedLessons = toNum(filters.minCompletedLessons);
    const maxCompletedLessons = toNum(filters.maxCompletedLessons);
    const minTotalLessons = toNum(filters.minTotalLessons);
    const maxTotalLessons = toNum(filters.maxTotalLessons);
    const minCourses = toNum(filters.minCourses);
    const maxCourses = toNum(filters.maxCourses);
    const courseMinProgress = toNum(filters.courseMinProgress);
    const courseMaxProgress = toNum(filters.courseMaxProgress);

    return rows.filter((student) => {
      const progress = Number(student.progress_percent) || 0;
      const rank = Number(student.rank) || 0;
      const completedLessons = Number(student.completed_lessons) || 0;
      const totalLessons = Number(student.total_lessons) || 0;
      const enrolledCourses = Number(student.enrolled_courses_count) || 0;
      const college = String(student.college || "").toLowerCase();
      const courseProgress = Array.isArray(student.course_progress) ? student.course_progress : [];

      if (collegeQ && !college.includes(collegeQ)) return false;
      if (minProgress != null && progress < minProgress) return false;
      if (maxProgress != null && progress > maxProgress) return false;
      if (minRank != null && rank < minRank) return false;
      if (maxRank != null && rank > maxRank) return false;
      if (minCompletedLessons != null && completedLessons < minCompletedLessons) return false;
      if (maxCompletedLessons != null && completedLessons > maxCompletedLessons) return false;
      if (minTotalLessons != null && totalLessons < minTotalLessons) return false;
      if (maxTotalLessons != null && totalLessons > maxTotalLessons) return false;
      if (minCourses != null && enrolledCourses < minCourses) return false;
      if (maxCourses != null && enrolledCourses > maxCourses) return false;

      if (filters.completionState === "not_started" && completedLessons > 0) return false;
      if (filters.completionState === "in_progress" && !(progress > 0 && progress < 100)) return false;
      if (filters.completionState === "completed" && progress < 100) return false;

      if (courseQ) {
        const matchingCourses = courseProgress.filter((c) => String(c?.title || "").toLowerCase().includes(courseQ));
        if (!matchingCourses.length) return false;
        if (courseMinProgress != null && !matchingCourses.some((c) => (Number(c?.progress_percent) || 0) >= courseMinProgress)) return false;
        if (courseMaxProgress != null && !matchingCourses.some((c) => (Number(c?.progress_percent) || 0) <= courseMaxProgress)) return false;
      } else {
        if (courseMinProgress != null && !courseProgress.some((c) => (Number(c?.progress_percent) || 0) >= courseMinProgress)) return false;
        if (courseMaxProgress != null && !courseProgress.some((c) => (Number(c?.progress_percent) || 0) <= courseMaxProgress)) return false;
      }

      return true;
    });
  }, [rows, filters]);

  const filteredStats = useMemo(() => {
    const total = filteredRows.length;
    const avg =
      total > 0
        ? Math.round(filteredRows.reduce((acc, r) => acc + (Number(r.progress_percent) || 0), 0) / total)
        : 0;
    const completed = filteredRows.filter((r) => Number(r.progress_percent) >= 100).length;
    return { total, avg, completed };
  }, [filteredRows]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((v) => String(v || "").trim() !== "").length;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      college: "",
      completionState: "",
      minProgress: "",
      maxProgress: "",
      minRank: "",
      maxRank: "",
      minCompletedLessons: "",
      maxCompletedLessons: "",
      minTotalLessons: "",
      maxTotalLessons: "",
      minCourses: "",
      maxCourses: "",
      courseName: "",
      courseMinProgress: "",
      courseMaxProgress: "",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Leaderboard</h1>
            <p className="mt-1 text-sm text-slate-600">Ranks students by overall enrolled-course completion and shows individual course progress.</p>
          </div>
          <button
            type="button"
            onClick={() => loadLeaderboard({ hardRefresh: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500"><FiUsers className="h-4 w-4" /> <span className="text-xs font-semibold uppercase tracking-wide">Students ranked</span></div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{filteredStats.total}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500"><FiTrendingUp className="h-4 w-4" /> <span className="text-xs font-semibold uppercase tracking-wide">Average completion</span></div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{filteredStats.avg}%</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500"><FiAward className="h-4 w-4" /> <span className="text-xs font-semibold uppercase tracking-wide">100% completed</span></div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{filteredStats.completed}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="relative max-w-md w-full">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, phone or college..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <FiFilter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">{activeFilterCount}</span>}
                </button>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <FiX className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <input
                  type="text"
                  placeholder="Filter college"
                  value={filters.college}
                  onChange={(e) => setFilters((f) => ({ ...f, college: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <select
                  value={filters.completionState}
                  onChange={(e) => setFilters((f) => ({ ...f, completionState: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All completion states</option>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed (100%)</option>
                </select>
                <input
                  type="text"
                  list="leaderboard-courses"
                  placeholder="Filter by course name"
                  value={filters.courseName}
                  onChange={(e) => setFilters((f) => ({ ...f, courseName: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <datalist id="leaderboard-courses">
                  {availableCourses.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Min %"
                    value={filters.minProgress}
                    onChange={(e) => setFilters((f) => ({ ...f, minProgress: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Max %"
                    value={filters.maxProgress}
                    onChange={(e) => setFilters((f) => ({ ...f, maxProgress: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="Min rank"
                    value={filters.minRank}
                    onChange={(e) => setFilters((f) => ({ ...f, minRank: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Max rank"
                    value={filters.maxRank}
                    onChange={(e) => setFilters((f) => ({ ...f, maxRank: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min completed lessons"
                    value={filters.minCompletedLessons}
                    onChange={(e) => setFilters((f) => ({ ...f, minCompletedLessons: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Max completed lessons"
                    value={filters.maxCompletedLessons}
                    onChange={(e) => setFilters((f) => ({ ...f, maxCompletedLessons: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min total lessons"
                    value={filters.minTotalLessons}
                    onChange={(e) => setFilters((f) => ({ ...f, minTotalLessons: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Max total lessons"
                    value={filters.maxTotalLessons}
                    onChange={(e) => setFilters((f) => ({ ...f, maxTotalLessons: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min courses"
                    value={filters.minCourses}
                    onChange={(e) => setFilters((f) => ({ ...f, minCourses: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Max courses"
                    value={filters.maxCourses}
                    onChange={(e) => setFilters((f) => ({ ...f, maxCourses: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Course min %"
                    value={filters.courseMinProgress}
                    onChange={(e) => setFilters((f) => ({ ...f, courseMinProgress: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Course max %"
                    value={filters.courseMaxProgress}
                    onChange={(e) => setFilters((f) => ({ ...f, courseMaxProgress: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading leaderboard...</div>
          ) : error ? (
            <div className="p-6 text-sm text-rose-600">{error}</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No students found for this filter.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredRows.map((student) => {
                const isOpen = !!expanded[student.id];
                const courseProgress = Array.isArray(student.course_progress) ? student.course_progress : [];
                const progressPercent = Number(student.progress_percent) || 0;
                return (
                  <div key={student.id} className="p-4 sm:p-5">
                    <div className="grid gap-3 lg:grid-cols-[64px_1fr_220px_140px_auto] lg:items-center">
                      <div className="flex items-center gap-2">
                        <RankPill rank={student.rank} />
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={student.full_name} />
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-slate-900">{student.full_name || "Student"}</div>
                          <div className="truncate text-sm text-slate-500">{student.college || "College not provided"}</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-600">
                          {student.completed_lessons || 0}/{student.total_lessons || 0} lessons
                        </div>
                        <ProgressBar percent={progressPercent} />
                      </div>

                      <div className="text-left lg:text-right">
                        <div className="text-xl font-bold text-slate-900">{progressPercent}%</div>
                        <div className="text-xs text-slate-500">{student.enrolled_courses_count || 0} courses</div>
                      </div>

                      <div className="flex justify-start lg:justify-end">
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [student.id]: !prev[student.id] }))}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Course details
                          {isOpen ? <FiChevronUp className="h-3.5 w-3.5" /> : <FiChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {courseProgress.length === 0 ? (
                          <p className="text-xs text-slate-500">No active course enrollments available.</p>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-2">
                            {courseProgress.map((course) => {
                              const cPct = Number(course.progress_percent) || 0;
                              return (
                                <div key={`${student.id}-${course.course_id}`} className="rounded-lg border border-slate-200 bg-white p-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="truncate text-sm font-medium text-slate-800">{course.title || "Course"}</div>
                                    <div className="text-xs font-semibold text-slate-700">{cPct}%</div>
                                  </div>
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    {course.completed_lessons || 0}/{course.total_lessons || 0} lessons
                                  </div>
                                  <div className="mt-1.5">
                                    <ProgressBar percent={cPct} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

