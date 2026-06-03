import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiBarChart2,
  FiClock,
  FiDownload,
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
  { value: "", label: "All time" },
];

const QUICK_PRESETS = [
  { id: "students-7d", label: "Students · 7d", period: "7d", role: "Student", audience: "logged_in" },
  { id: "lms-30d", label: "LMS pages · 30d", period: "30d", routePrefix: "/lms/" },
  { id: "courses-24h", label: "Courses · 24h", period: "24h", routePrefix: "/courses" },
  { id: "anon-30d", label: "Anonymous · 30d", period: "30d", audience: "anonymous" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Latest visited (default)" },
  { value: "visits", label: "Most unique visitors" },
  { value: "path", label: "Route A–Z" },
];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "logged_in", label: "Logged-in only" },
  { value: "anonymous", label: "Anonymous only" },
];

const ROUTE_PREFIX_OPTIONS = [
  { value: "", label: "All sections" },
  { value: "/lms/", label: "LMS (/lms/)" },
  { value: "/courses", label: "Courses (/courses)" },
  { value: "/academy", label: "Academy (/academy)" },
  { value: "/solutions", label: "Solutions (/solutions)" },
  { value: "/login", label: "Auth (/login)" },
];

const ROLE_OPTIONS = [
  { value: "", label: "Any role" },
  { value: "Student", label: "Student" },
  { value: "SuperAdmin", label: "Super Admin" },
  { value: "Mentor", label: "Mentor" },
  { value: "TenantAdmin", label: "Tenant Admin" },
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

function formatVisitTime(iso) {
  const exact = iso ? formatDateTime(iso) : "";
  return { relative: formatRelative(iso), exact };
}

function VisitTime({ iso, className = "" }) {
  const { relative, exact } = formatVisitTime(iso);
  return (
    <time dateTime={iso || undefined} title={exact || undefined} className={className}>
      {relative}
    </time>
  );
}

function buildQueryParams({ period, sort, search, audience, role, routePrefix, minVisitors }) {
  const qs = new URLSearchParams();
  if (period) qs.set("since", period);
  if (search.trim()) qs.set("search", search.trim());
  qs.set("sort", sort || "recent");
  if (audience && audience !== "all") qs.set("audience", audience);
  if (role) qs.set("role", role);
  if (routePrefix) qs.set("routePrefix", routePrefix);
  if (minVisitors && Number(minVisitors) > 0) qs.set("minVisitors", String(minVisitors));
  return qs;
}

function describeActiveFilters({ period, periodStart, audience, role, routePrefix, search, minVisitors, sort }) {
  const parts = [];
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label || "All time";
  parts.push(periodStart ? `${periodLabel} (since ${formatDateTime(periodStart)})` : periodLabel);
  if (audience !== "all") parts.push(AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label);
  if (role) parts.push(role);
  if (routePrefix) parts.push(`Section: ${routePrefix}`);
  if (search.trim()) parts.push(`Path contains “${search.trim()}”`);
  if (minVisitors && Number(minVisitors) > 0) parts.push(`Min ${minVisitors} visitors/route`);
  if (sort !== "recent") parts.push(`Sort: ${SORT_OPTIONS.find((o) => o.value === sort)?.label}`);
  return parts;
}

function actorLabel(row) {
  if (row.user_name || row.user_email) return row.user_name || row.user_email;
  if (row.actor_key?.startsWith("v:")) return "Anonymous visitor";
  if (row.actor_key?.startsWith("d:")) return "Anonymous device";
  return "Anonymous";
}

function actorSubLabel(row) {
  if (row.user_email && row.user_name) return row.user_email;
  if (row.user_email) return row.user_email;
  if (row.user_phone) return row.user_phone;
  if (row.user_id) return null;
  if (row.actor_key) return row.actor_key;
  return null;
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function PeopleDetailModal({
  title,
  subtitle,
  people,
  loading,
  error,
  onClose,
  search,
  onSearchChange,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => {
      const hay = [
        p.user_name,
        p.user_email,
        p.user_phone,
        p.user_role,
        p.actor_key,
        p.visitor_id,
        ...(Array.isArray(p.routes) ? p.routes.map((r) => r.pathname) : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [people, search]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="people-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="people-modal-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, email, route…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
          ) : error ? (
            <p className="p-6 text-sm text-rose-600">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No matches.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const routes = Array.isArray(p.routes) ? p.routes : [];
                return (
                  <li key={p.actor_key || p.user_id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {actorLabel(p)}
                          {p.user_role && (
                            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                              {p.user_role}
                            </span>
                          )}
                        </p>
                        {actorSubLabel(p) && (
                          <p className="mt-0.5 text-xs text-slate-500">{actorSubLabel(p)}</p>
                        )}
                        {!p.user_id && (p.visitor_id || p.device_id) && (
                          <p className="mt-1 font-mono text-[10px] text-slate-400">
                            {p.visitor_id ? `visitor ${String(p.visitor_id).slice(0, 20)}` : ""}
                            {p.device_id ? ` · device ${String(p.device_id).slice(0, 16)}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>
                          <span className="font-semibold text-slate-800">{p.routes_visited}</span> route
                          {p.routes_visited === 1 ? "" : "s"}
                        </p>
                        <p className="mt-0.5">
                          Last: <VisitTime iso={p.last_seen_at} />
                        </p>
                        <p className="text-[11px] text-slate-400">{formatDateTime(p.last_seen_at)}</p>
                        <p className="mt-0.5">
                          First: <VisitTime iso={p.first_seen_at} />
                        </p>
                      </div>
                    </div>
                    {routes.length > 0 && (
                      <ul className="mt-3 space-y-1 rounded-lg bg-slate-50 p-2">
                        {routes.slice(0, 15).map((r) => (
                          <li
                            key={r.pathname}
                            className="flex items-center justify-between gap-2 text-xs text-slate-600"
                          >
                            <code className="truncate font-medium text-slate-800">{r.pathname}</code>
                            <span className="shrink-0 text-right">
                              <VisitTime iso={r.last_seen} />
                              <span className="block text-[10px] text-slate-400">{formatDateTime(r.last_seen)}</span>
                            </span>
                          </li>
                        ))}
                        {routes.length > 15 && (
                          <li className="text-[11px] text-slate-400">+{routes.length - 15} more routes</li>
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {!loading && filtered.length > 0 && (
          <p className="border-t border-slate-100 px-5 py-2 text-center text-[11px] text-slate-400">
            Showing {filtered.length} of {people.length} · Hover times for full date
          </p>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminRouteVisits() {
  const { token } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [periodStart, setPeriodStart] = useState(null);
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("all");
  const [role, setRole] = useState("");
  const [routePrefix, setRoutePrefix] = useState("");
  const [minVisitors, setMinVisitors] = useState("");
  const [showFilters, setShowFilters] = useState(true);
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
  const [peopleModal, setPeopleModal] = useState(null);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState("");
  const [peopleList, setPeopleList] = useState([]);
  const [peopleModalSearch, setPeopleModalSearch] = useState("");

  const filterParams = useMemo(
    () => ({ period, sort, search, audience, role, routePrefix, minVisitors }),
    [period, sort, search, audience, role, routePrefix, minVisitors]
  );

  const activeFilterLabels = useMemo(
    () =>
      describeActiveFilters({
        period,
        periodStart,
        audience,
        role,
        routePrefix,
        search,
        minVisitors,
        sort,
      }),
    [period, periodStart, audience, role, routePrefix, search, minVisitors, sort]
  );

  const loadPeople = useCallback(
    async ({ kind, pathname } = {}) => {
      if (!token) return;
      setPeopleLoading(true);
      setPeopleError("");
      setPeopleList([]);
      try {
        const qs = buildQueryParams(filterParams);
        qs.set("kind", kind === "logged_in" ? "logged_in" : "all");
        qs.set("limit", "500");
        if (pathname) qs.set("pathname", pathname);
        const res = await apiFetch(`/api/v1/admin/route-visits/people?${qs}`, { token });
        setPeopleList(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        setPeopleError(e?.message || "Failed to load people.");
        setPeopleList([]);
      } finally {
        setPeopleLoading(false);
      }
    },
    [token, filterParams]
  );

  const openPeopleModal = useCallback(
    (kind) => {
      setPeopleModalSearch("");
      setPeopleModal({ type: kind });
      loadPeople({ kind });
    },
    [loadPeople]
  );

  const openRouteVisitors = useCallback(
    (pathname) => {
      setPeopleModalSearch("");
      setPeopleModal({ type: "route", pathname });
      loadPeople({ pathname });
    },
    [loadPeople]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n += 1;
    if (audience !== "all") n += 1;
    if (role) n += 1;
    if (routePrefix) n += 1;
    if (minVisitors && Number(minVisitors) > 0) n += 1;
    if (period !== "30d") n += 1;
    if (sort !== "recent") n += 1;
    return n;
  }, [search, audience, role, routePrefix, minVisitors, period, sort]);

  const loadData = useCallback(
    async ({ hardRefresh = false } = {}) => {
      if (!token) return;
      if (hardRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const base = buildQueryParams(filterParams);
        const summaryQs = new URLSearchParams(base);
        summaryQs.set("limit", "300");

        const recentQs = new URLSearchParams(base);
        recentQs.set("limit", "200");
        if (selectedPath) recentQs.set("pathname", selectedPath);

        const [ovRes, sumRes, recRes] = await Promise.all([
          apiFetch(`/api/v1/admin/route-visits/overview?${base}`, { token, noCache: hardRefresh }),
          apiFetch(`/api/v1/admin/route-visits/summary?${summaryQs}`, { token, noCache: hardRefresh }),
          apiFetch(`/api/v1/admin/route-visits/recent?${recentQs}`, { token, noCache: hardRefresh }),
        ]);

        const ov = ovRes?.data || {};
        setPeriodStart(ov.period_start || null);
        setOverview(ov);
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
    [token, filterParams, selectedPath]
  );

  useEffect(() => {
    const t = setTimeout(() => loadData(), 200);
    return () => clearTimeout(t);
  }, [loadData]);

  const maxVisitors = useMemo(
    () => Math.max(1, ...routes.map((r) => Number(r.unique_visitors) || 0)),
    [routes]
  );

  const applyPreset = (preset) => {
    setPeriod(preset.period ?? "30d");
    setAudience(preset.audience ?? "all");
    setRole(preset.role ?? "");
    setRoutePrefix(preset.routePrefix ?? "");
  };

  const clearFilters = () => {
    setPeriod("30d");
    setSort("recent");
    setSearch("");
    setAudience("all");
    setRole("");
    setRoutePrefix("");
    setMinVisitors("");
    setSelectedPath("");
  };

  const exportRoutesCsv = () => {
    const header = "pathname,unique_visitors,logged_in,last_visit,first_visit";
    const lines = routes.map((r) =>
      [
        `"${r.pathname}"`,
        r.unique_visitors,
        r.logged_in_visits,
        formatDateTime(r.last_visit_at),
        formatDateTime(r.first_visit_at),
      ].join(",")
    );
    downloadCsv(`route-visits-routes-${period || "all"}.csv`, [header, ...lines]);
  };

  const exportRecentCsv = () => {
    const header = "pathname,person,role,last_seen,first_seen";
    const lines = recent.map((v) =>
      [
        `"${v.pathname}"`,
        `"${v.user_name || v.user_email || v.actor_key || "anonymous"}"`,
        v.user_role || "",
        formatDateTime(v.last_visit_at || v.created_at),
        formatDateTime(v.created_at),
      ].join(",")
    );
    downloadCsv(`route-visits-activity-${period || "all"}.csv`, [header, ...lines]);
  };

  const peopleModalMeta = useMemo(() => {
    if (!peopleModal) return null;
    if (peopleModal.type === "route") {
      return {
        title: `Visitors on ${peopleModal.pathname}`,
        subtitle: "Unique people who reached this route (current filters).",
      };
    }
    if (peopleModal.type === "logged_in") {
      return {
        title: "Logged-in people",
        subtitle: "Accounts with activity in the current filter window.",
      };
    }
    return {
      title: "Unique people",
      subtitle: "Each person counted once (logged-in account or anonymous id).",
    };
  }, [peopleModal]);

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Route analytics</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              See which pages people open. One count per person per page; refresh does not inflate numbers.
              Times use your browser locale; filter window uses <strong>last activity</strong> on each route.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => (tab === "routes" ? exportRoutesCsv() : exportRecentCsv())}
              disabled={loading || (tab === "routes" ? routes.length === 0 : recent.length === 0)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiDownload className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => loadData({ hardRefresh: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-sm text-blue-900">
          <span className="font-semibold">Active view:</span>{" "}
          {activeFilterLabels.join(" · ")}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Person–route pairs",
              hint: "Total reach rows",
              value: overview.total_visits,
              icon: FiGlobe,
              color: "text-blue-600",
            },
            {
              label: "Pages with visits",
              value: overview.unique_routes,
              icon: FiBarChart2,
              color: "text-violet-600",
            },
            {
              label: "Unique people",
              hint: "Click for list",
              value: overview.unique_visitors,
              icon: FiUsers,
              color: "text-emerald-600",
              detailKind: "all",
            },
            {
              label: "Logged-in accounts",
              hint: "Click for list",
              value: overview.logged_in_users,
              icon: FiActivity,
              color: "text-amber-600",
              detailKind: "logged_in",
            },
          ].map((s) => {
            const clickable = Boolean(s.detailKind);
            const Tag = clickable ? "button" : "div";
            const hoverRing =
              s.detailKind === "logged_in"
                ? "hover:border-amber-300 focus:ring-amber-200"
                : "hover:border-emerald-300 focus:ring-emerald-200";
            return (
              <Tag
                key={s.label}
                type={clickable ? "button" : undefined}
                onClick={clickable ? () => openPeopleModal(s.detailKind) : undefined}
                className={`rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm ${
                  clickable
                    ? `cursor-pointer transition hover:shadow-md focus:outline-none focus:ring-2 ${hoverRing}`
                    : ""
                }`}
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{Number(s.value) || 0}</div>
                {s.hint && <p className="mt-0.5 text-[11px] text-slate-400">{s.hint}</p>}
              </Tag>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <FiFilter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <FiX className="h-3.5 w-3.5" />
                Reset filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
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
              <div>
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
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">User role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Section</label>
                <select
                  value={routePrefix}
                  onChange={(e) => setRoutePrefix(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {ROUTE_PREFIX_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Min visitors per page</label>
                <input
                  type="number"
                  min={0}
                  value={minVisitors}
                  onChange={(e) => setMinVisitors(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Search route path</label>
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
          )}
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
              By page ({routes.length})
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
              Activity feed ({recent.length})
            </span>
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading analytics…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : tab === "routes" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {routes.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">No activity for this filter. Browse the site as a student to generate data.</p>
            ) : (
              <>
                <div className="hidden border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 lg:grid lg:grid-cols-[40px_1fr_80px_100px_100px_auto_auto] lg:gap-2">
                  <span>#</span>
                  <span>Page</span>
                  <span className="text-center">Visitors</span>
                  <span>Last visit</span>
                  <span>First visit</span>
                  <span />
                  <span />
                </div>
                <div className="divide-y divide-slate-100">
                  {routes.map((row, index) => {
                    const visitors = Number(row.unique_visitors) || 0;
                    const showBar = sort === "visits";
                    const pct = showBar ? Math.round((visitors / maxVisitors) * 100) : 0;
                    const isLatest = sort === "recent" && index === 0;
                    return (
                      <div
                        key={row.pathname}
                        className={`grid gap-3 p-4 lg:grid-cols-[40px_1fr_80px_100px_100px_auto_auto] lg:items-center ${
                          isLatest ? "bg-blue-50/60" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              isLatest ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="truncate text-sm font-semibold text-slate-900">{row.pathname}</code>
                            {isLatest && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                                Latest
                              </span>
                            )}
                          </div>
                          {showBar && (
                            <div className="mt-2 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                          <p className="mt-1 text-xs text-slate-500">
                            {visitors} unique · {row.logged_in_visits || 0} logged-in
                          </p>
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-bold text-slate-900">{visitors}</span>
                        </div>
                        <div className="text-sm text-slate-700">
                          <VisitTime iso={row.last_visit_at} />
                          <span className="mt-0.5 block text-[10px] text-slate-400">{formatDateTime(row.last_visit_at)}</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          <VisitTime iso={row.first_visit_at} />
                        </div>
                        <button
                          type="button"
                          onClick={() => openRouteVisitors(row.pathname)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <FiUsers className="h-3.5 w-3.5" />
                          Who
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPath(row.pathname);
                            setTab("recent");
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <FiClock className="h-3.5 w-3.5" />
                          Feed
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedPath && (
              <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-900">
                <span>
                  Page: <code className="font-semibold">{selectedPath}</code>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPath("")}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-indigo-100"
                >
                  <FiX className="h-3.5 w-3.5" />
                  Show all pages
                </button>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {recent.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">No activity for these filters.</p>
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
                              {v.user_role ? ` · ${v.user_role}` : ""}
                            </span>
                          ) : (
                            <span>
                              Anonymous ·{" "}
                              <span className="font-mono text-[10px]">{v.actor_key || "—"}</span>
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-slate-500">
                        <VisitTime iso={v.last_visit_at || v.created_at} className="font-medium text-slate-700" />
                        <span className="text-[10px]">{formatDateTime(v.last_visit_at || v.created_at)}</span>
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

        {peopleModal && peopleModalMeta && (
          <PeopleDetailModal
            title={peopleModalMeta.title}
            subtitle={peopleModalMeta.subtitle}
            people={peopleList}
            loading={peopleLoading}
            error={peopleError}
            search={peopleModalSearch}
            onSearchChange={setPeopleModalSearch}
            onClose={() => setPeopleModal(null)}
          />
        )}
      </div>
    </div>
  );
}
