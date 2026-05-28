import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiFetch } from "../../../services/api";
import { formatDateTime } from "../../../utils/format";
import {
  FiHelpCircle,
  FiFilter,
  FiChevronDown,
  FiLoader,
  FiSend,
  FiX,
  FiUser,
  FiBook,
  FiLayers,
  FiMessageSquare,
  FiCheckCircle,
  FiRefreshCw,
} from "react-icons/fi";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
];

export default function SuperAdminDoubts() {
  const { token } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [total, setTotal] = useState(0);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingThread, setRefreshingThread] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/v1/admin/courses", { token })
      .then((res) => setCourses(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCourses([]));
  }, [token]);

  const loadDoubts = useCallback(async ({ silent = false, noCache = false } = {}) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ limit, offset });
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (courseFilter) params.set("courseId", courseFilter);
      const res = await apiFetch(`/api/v1/admin/doubts?${params}`, { token, noCache });
      setDoubts(Array.isArray(res?.data) ? res.data : []);
      setTotal(res?.total ?? 0);
    } catch {
      if (!silent) {
        setDoubts([]);
        setTotal(0);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, statusFilter, typeFilter, courseFilter, offset]);

  useEffect(() => {
    loadDoubts();
  }, [loadDoubts]);

  const openThread = async (doubtId, { silent = false, noCache = false } = {}) => {
    setSelectedId(doubtId);
    if (!silent) {
      setLoadingThread(true);
      setReplyBody("");
    }
    setError("");
    try {
      const res = await apiFetch(`/api/v1/admin/doubts/${doubtId}`, { token, noCache });
      if (res?.ok && res.data) {
        setThread(res.data);
      } else if (!silent) {
        setThread(null);
      }
    } catch (e) {
      setError(e?.message || "Could not load thread");
      if (!silent) setThread(null);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  };

  const handleRefreshList = async (e) => {
    e?.preventDefault?.();
    if (!token || refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      await loadDoubts({ silent: true, noCache: true });
      if (selectedId != null) {
        await openThread(selectedId, { silent: true, noCache: true });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshThread = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!selectedId || !token || refreshingThread) return;
    setRefreshingThread(true);
    setError("");
    try {
      await openThread(selectedId, { silent: true, noCache: true });
      await loadDoubts({ silent: true, noCache: true });
    } finally {
      setRefreshingThread(false);
    }
  };

  const closePanel = () => {
    setSelectedId(null);
    setThread(null);
    setReplyBody("");
    setError("");
  };

  const sendReply = async () => {
    if (!selectedId || !replyBody.trim() || !token) return;
    setReplying(true);
    setError("");
    try {
      await apiFetch(`/api/v1/admin/doubts/${selectedId}/reply`, {
        method: "POST",
        token,
        body: { body: replyBody.trim() },
      });
      setReplyBody("");
      await openThread(selectedId, { silent: true, noCache: true });
      await loadDoubts({ silent: true, noCache: true });
    } catch (e) {
      setError(e?.message || "Could not send reply");
    } finally {
      setReplying(false);
    }
  };

  const setStatus = async (status) => {
    if (!selectedId || !token) return;
    try {
      await apiFetch(`/api/v1/admin/doubts/${selectedId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await openThread(selectedId, { silent: true, noCache: true });
      await loadDoubts({ silent: true, noCache: true });
    } catch (e) {
      setError(e?.message || "Could not update status");
    }
  };

  const statusBadge = (status) => {
    if (status === "answered")
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (status === "closed") return "bg-slate-600 text-slate-300 border-slate-500";
    return "bg-amber-500/20 text-amber-200 border-amber-500/40";
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <FiHelpCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Student doubts</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Doubts</h1>
        <p className="text-slate-400 mt-1">
          Questions from students on courses and lessons — reply here; students see your answers in their LMS.
        </p>
      </motion.div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
            showFilters || statusFilter || courseFilter || typeFilter
              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
              : "bg-slate-700/50 text-slate-300 border-slate-600"
          }`}
        >
          <FiFilter className="w-4 h-4" />
          Filters
          <FiChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
        {showFilters && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0);
              }}
              className="rounded-lg border border-slate-600 bg-slate-800 text-white text-sm px-3 py-2"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setOffset(0);
              }}
              className="rounded-lg border border-slate-600 bg-slate-800 text-white text-sm px-3 py-2"
            >
              <option value="">All types</option>
              <option value="course">Course</option>
              <option value="lesson">Lesson</option>
            </select>
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setOffset(0);
              }}
              className="rounded-lg border border-slate-600 bg-slate-800 text-white text-sm px-3 py-2 max-w-xs"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-500">{total} total</span>
          <button
            type="button"
            onClick={handleRefreshList}
            disabled={refreshing}
            title="Refresh doubts list"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <FiLoader className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : doubts.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center text-slate-400">
          No doubts match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => openThread(d.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all hover:border-sky-500/50 ${
                String(selectedId) === String(d.id)
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-slate-700 bg-slate-800/60 hover:bg-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadge(d.status)}`}>
                      {d.status}
                    </span>
                    <span className="text-xs text-slate-500 uppercase">{d.doubt_type}</span>
                  </div>
                  <p className="text-white font-medium truncate">{d.subject || "Doubt"}</p>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{d.last_message || "—"}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiUser className="w-3.5 h-3.5" />
                      {d.student_name || d.student_email}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiBook className="w-3.5 h-3.5" />
                      {d.course_title}
                    </span>
                    {d.lesson_title && (
                      <span className="flex items-center gap-1">
                        <FiLayers className="w-3.5 h-3.5" />
                        {d.lesson_title}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  <div>{formatDateTime(d.updated_at || d.created_at)}</div>
                  <div className="mt-1 flex items-center gap-1 justify-end">
                    <FiMessageSquare className="w-3.5 h-3.5" />
                    {d.message_count ?? 0}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex justify-end bg-black/50"
            onClick={closePanel}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700 gap-2">
                <h2 className="text-lg font-semibold text-white">Reply to doubt</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRefreshThread}
                    disabled={refreshingThread}
                    title="Refresh conversation"
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${refreshingThread ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <button type="button" onClick={closePanel} className="p-2 text-slate-400 hover:text-white">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {loadingThread ? (
                <div className="flex-1 flex items-center justify-center">
                  <FiLoader className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : thread?.doubt ? (
                <>
                  <div className="p-4 border-b border-slate-700 space-y-2 text-sm">
                    <p className="text-white font-medium">{thread.doubt.subject || "Doubt"}</p>
                    <p className="text-slate-400">
                      {thread.doubt.student_name} · {thread.doubt.student_email}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {thread.doubt.course_title}
                      {thread.doubt.lesson_title ? ` → ${thread.doubt.lesson_title}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {thread.doubt.status !== "closed" && (
                        <button
                          type="button"
                          onClick={() => setStatus("closed")}
                          className="text-xs px-2 py-1 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Mark closed
                        </button>
                      )}
                      {thread.doubt.status === "closed" && (
                        <button
                          type="button"
                          onClick={() => setStatus("open")}
                          className="text-xs px-2 py-1 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(thread.messages || []).map((m) => {
                      const isStaff = m.author_role === "staff";
                      return (
                        <div key={m.id} className={`flex ${isStaff ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                              isStaff
                                ? "bg-sky-600 text-white"
                                : "bg-slate-800 text-slate-200 border border-slate-600"
                            }`}
                          >
                            <p className="text-[10px] font-semibold uppercase opacity-70 mb-1">
                              {isStaff ? "You (team)" : m.author_name || "Student"}
                            </p>
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p className="text-[10px] mt-1 opacity-60">{formatDateTime(m.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {thread.doubt.status !== "closed" && (
                    <div className="p-4 border-t border-slate-700 space-y-2">
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Type your reply…"
                        rows={3}
                        className="w-full rounded-lg border border-slate-600 bg-slate-800 text-white text-sm px-3 py-2 resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      {error && <p className="text-sm text-red-400">{error}</p>}
                      <button
                        type="button"
                        disabled={replying || !replyBody.trim()}
                        onClick={sendReply}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50"
                      >
                        {replying ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiSend className="w-4 h-4" />
                        )}
                        Send reply to student
                      </button>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        Student will see this in their lesson/course doubt chat.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="p-4 text-slate-500">Could not load thread.</p>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
