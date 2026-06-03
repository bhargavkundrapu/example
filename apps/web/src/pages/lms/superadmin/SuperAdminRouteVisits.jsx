import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiClock,
  FiExternalLink,
  FiFilter,
  FiGlobe,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiFetch } from "../../../services/api";
import { formatDateTime } from "../../../utils/format";

const PERIOD_OPTIONS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "", label: "All time (since tracking started)" },
];

const SORT_OPTIONS = [
  { value: "visits", label: "Most visits" },
  { value: "recent", label: "Recently active" },
  { value: "path", label: "Route A–Z" },
];

function formatRelative(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return formatDateTime(iso);
}

export default function SuperAdminRouteVisits() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [sort, setSort] = useState("visits");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("routes");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({
    total_visits: 0,
    unique_routes: 0,
    unique_visitors: 0,
    logged_in_users: 0,
  });
  const [routes, setRoutes] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");

  const loadData = useCallback(
    async ({ hardRefresh = false } = {}) => {
      if (!token) return;
      if (hardRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const base = new URLSearchParams();
        if (period) base.set("since", period);
        const summaryQs = new URLSearchParams(base);
        if (search.trim()) summaryQs.set("search", search.trim());
        summaryQs.set("sort", sort);
        summaryQs.set("limit", "300");

        const recentQs = new URLSearchParams(base);
        recentQs.set("limit", "100");
        if (selectedPath) recentQs.set("pathname", selectedPath);

        const [ovRes, sumRes, recRes] = await Promise.all([
          apiFetch(`/api/v1/admin/route-visits/overview?${base}`, { token, noCache: hardRefresh }),
          apiFetch(`/api/v1/admin/route-visits/summary?${summaryQs}`, { token, noCache: hardRefresh }),
          apiFetch(`/api/v1/admin/route-visits/recent?${recentQs}`, { token, noCache: hardRefresh }),
        ]);

        setOverview(ovRes?.data || {});
        setRoutes(Array.isArray(sumRes?.data) ? sumRes.data : []);
        setRecent(Array.isArray(recRes?.data) ? recRes.data : []);
      } catch (e) {
        setError(e?.message || "Failed to load route visits.");
        setRoutes([]);
        setRecent([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, period, sort, search, selectedPath]
  );

  useEffect(() => {
    const t = setTimeout(() => loadData(), 200);
    return () => clearTimeout(t);
  }, [loadData]);

  const maxVisits = useMemo(() => Math.max(1, ...routes.map((r) => Number(r.visit_count) || 0)), [routes]);

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Page & route visits</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Every page view across the site is recorded from when this feature is enabled. Routes are ranked so you can see what students and visitors use most.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData({ hardRefresh: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total page views", value: overview.total_visits, icon: FiGlobe, color: "text-blue-600" },
            { label: "Unique routes", value: overview.unique_routes, icon: FiBarChart2, color: "text-violet-600" },
            { label: "Unique visitors", value: overview.unique_visitors, icon: FiUsers, color: "text-emerald-600" },
            { label: "Logged-in users", value: overview.logged_in_users, icon: FiActivity, color: "text-amber-600" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{Number(s.value) || 0}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Time period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {PERIOD_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Sort routes</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] flex-[2]">
              <label className="mb-1 block text-xs font-medium text-slate-500">Search route</label>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="/courses, /lms/student, …"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab("routes")}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "routes" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <FiTrendingUp className="h-4 w-4" />
              Routes ranked ({routes.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("recent")}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "recent" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <FiClock className="h-4 w-4" />
              Recent visits
            </span>
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading visits…</div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : tab === "routes" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {routes.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                No visits yet for this period. Browse the site as a user — data is collected from now on.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {routes.map((row, index) => {
                  const count = Number(row.visit_count) || 0;
                  const pct = Math.round((count / maxVisits) * 100);
                  return (
                    <div
                      key={row.pathname}
                      className="grid gap-3 p-4 transition-colors hover:bg-slate-50/80 lg:grid-cols-[48px_1fr_120px_100px_120px_auto]"
                      lg:items-center
                    >
                      <div className="flex items-center justify-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <code className="block truncate text-sm font-semibold text-slate-900">{row.pathname}</code>
                        <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.unique_visitors} unique visitor{row.unique_visitors === 1 ? "" : "s"}
                          {row.logged_in_visits > 0 && ` · ${row.logged_in_visits} logged-in`}
                        </p>
                      </div>
                      <div className="text-center lg:text-right">
                        <div className="text-xl font-bold text-slate-900">{count}</div>
                        <div className="text-xs text-slate-500">visits</div>
                      </div>
                      <div className="text-sm text-slate-600">{formatRelative(row.last_visit_at)}</div>
                      <div className="text-xs text-slate-400 hidden lg:block">First: {formatRelative(row.first_visit_at)}</div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPath(row.pathname);
                          setTab("recent");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <FiFilter className="h-3.5 w-3.5" />
                        Timeline
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedPath && (
              <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">
                <span>
                  Filtered to: <code className="font-semibold">{selectedPath}</code>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPath("")}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-indigo-100"
                >
                  <FiX className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {recent.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">No recent visits.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recent.map((v) => (
                    <li key={v.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <code className="text-sm font-medium text-slate-900">{v.pathname}</code>
                        {v.path !== v.pathname && (
                          <p className="mt-0.5 truncate text-xs text-slate-500">{v.path}</p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {v.user_name || v.user_email ? (
                            <span className="font-medium text-slate-700">
                              {v.user_name || v.user_email}
                              {v.user_role ? ` (${v.user_role})` : ""}
                            </span>
                          ) : (
                            <span>Anonymous visitor</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                        <span>{formatRelative(v.created_at)}</span>
                        <a
                          href={v.pathname}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Open
                          <FiExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
