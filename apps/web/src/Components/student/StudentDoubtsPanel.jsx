import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiMessageCircle,
  FiCheckCircle,
  FiClock,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { useTheme } from "../../app/providers/ThemeProvider";
import { apiFetch } from "../../services/api";
import { formatDateTime } from "../../utils/format";

const STATUS_LABEL = {
  open: { text: "Waiting for reply", class: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" },
  answered: { text: "Answered", class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200" },
  closed: { text: "Closed", class: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
};

/**
 * Ask Doubt panel for course or lesson pages — lists student's threads and staff replies.
 */
export default function StudentDoubtsPanel({
  scope,
  courseSlug,
  moduleSlug,
  lessonSlug,
  contextTitle,
  token,
}) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [threadDetail, setThreadDetail] = useState({});
  const [loadingThread, setLoadingThread] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingThreadId, setRefreshingThreadId] = useState(null);
  const threadDetailRef = useRef(threadDetail);
  threadDetailRef.current = threadDetail;

  const listUrl =
    scope === "lesson"
      ? `/api/v1/student/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonSlug}/doubts`
      : `/api/v1/student/courses/${courseSlug}/doubts`;

  const createUrl = listUrl;

  const loadThreads = useCallback(async ({ silent = false, noCache = false } = {}) => {
    if (!token) return;
    if (!silent) setLoadingList(true);
    setError("");
    try {
      const res = await apiFetch(listUrl, { token, skipIfUnreachable: true, noCache }).catch(() => null);
      setThreads(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e?.message || "Could not load doubts.");
      if (!silent) setThreads([]);
    } finally {
      if (!silent) setLoadingList(false);
    }
  }, [token, listUrl]);

  useEffect(() => {
    if (open && token) loadThreads();
  }, [open, token, loadThreads]);

  const loadThread = useCallback(async (doubtId, { force = false, noCache = false } = {}) => {
    if (!token || doubtId == null) return;
    const key = String(doubtId);
    if (!force && threadDetailRef.current[key]?.messages?.length) return;
    setLoadingThread(key);
    try {
      const res = await apiFetch(`/api/v1/student/doubts/${doubtId}`, { token, noCache });
      if (res?.ok && res.data) {
        setThreadDetail((prev) => ({ ...prev, [key]: res.data }));
      }
    } catch {
      setError("Could not load conversation.");
    } finally {
      setLoadingThread(null);
    }
  }, [token]);

  const handleRefreshAll = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!token || refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      await loadThreads({ silent: true, noCache: true });
      if (expandedId != null) {
        await loadThread(expandedId, { force: true, noCache: true });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshThread = async (e, doubtId) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const key = String(doubtId);
    if (!token || refreshingThreadId === key) return;
    setRefreshingThreadId(key);
    setError("");
    try {
      await loadThread(doubtId, { force: true, noCache: true });
      await loadThreads({ silent: true, noCache: true });
    } finally {
      setRefreshingThreadId(null);
    }
  };

  const toggleThread = (doubtId) => {
    const key = String(doubtId);
    if (String(expandedId) === key) {
      setExpandedId(null);
      return;
    }
    setExpandedId(doubtId);
    loadThread(doubtId, { noCache: false });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!body.trim() || !token) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch(createUrl, {
        method: "POST",
        token,
        body: {
          subject: subject.trim() || undefined,
          body: body.trim(),
        },
      });
      if (res?.ok) {
        setSubject("");
        setBody("");
        await loadThreads({ silent: true, noCache: true });
        const newId = res.data?.doubt?.id;
        if (newId) {
          const key = String(newId);
          setExpandedId(newId);
          setThreadDetail((prev) => ({
            ...prev,
            [key]: res.data,
          }));
        }
      }
    } catch (err) {
      setError(err?.message || "Could not submit doubt.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (doubtId) => {
    const text = (replyText[doubtId] || "").trim();
    if (!text || !token) return;
    setReplyingId(doubtId);
    setError("");
    try {
      await apiFetch(`/api/v1/student/doubts/${doubtId}/messages`, {
        method: "POST",
        token,
        body: { body: text },
      });
      setReplyText((prev) => ({ ...prev, [doubtId]: "" }));
      const key = String(doubtId);
      const res = await apiFetch(`/api/v1/student/doubts/${doubtId}`, { token, noCache: true });
      if (res?.ok && res.data) {
        setThreadDetail((prev) => ({ ...prev, [key]: res.data }));
      }
      await loadThreads({ silent: true, noCache: true });
    } catch (err) {
      setError(err?.message || "Could not send message.");
    } finally {
      setReplyingId(null);
    }
  };

  const shell = isDark
    ? "border-slate-600 bg-slate-800/50"
    : "border-slate-200 bg-slate-50";

  return (
    <div className={`mt-6 rounded-xl border ${shell}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left rounded-xl transition-colors ${
          isDark ? "hover:bg-slate-700/40" : "hover:bg-slate-100"
        }`}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          <FiHelpCircle className={`w-5 h-5 shrink-0 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
          Ask doubt
          {threads.length > 0 && (
            <span className="text-xs font-normal text-slate-500">({threads.length})</span>
          )}
        </span>
        {open ? <FiChevronUp className="w-5 h-5 text-slate-400" /> : <FiChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-slate-200/80 dark:border-slate-600/80 space-y-5">
              <div className="flex items-start justify-between gap-3 pt-3">
                <p className={`text-xs flex-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Ask about <strong>{contextTitle || (scope === "lesson" ? "this lesson" : "this course")}</strong>.
                  Our team will reply here — you will see responses in this chat.
                </p>
                <button
                  type="button"
                  onClick={handleRefreshAll}
                  disabled={refreshing}
                  title="Refresh doubts"
                  aria-label="Refresh doubts"
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                    isDark
                      ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark
                      ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                />
                <textarea
                  placeholder="Describe your doubt…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  maxLength={4000}
                  required
                  className={`w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDark
                      ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                />
                <button
                  type="submit"
                  disabled={submitting || !body.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                  Submit doubt
                </button>
              </form>

              {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <FiX className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}

              <div>
                <h4 className={`text-sm font-semibold mb-3 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  Your doubts here
                </h4>
                {loadingList ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : threads.length === 0 ? (
                  <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"}`}>
                    No doubts yet for this {scope === "lesson" ? "lesson" : "course"}.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {threads.map((t) => {
                      const st = STATUS_LABEL[t.status] || STATUS_LABEL.open;
                      const threadKey = String(t.id);
                      const isExpanded = String(expandedId) === threadKey;
                      const detail = threadDetail[threadKey];
                      const messages = detail?.messages || [];

                      return (
                        <li
                          key={t.id}
                          className={`rounded-lg border overflow-hidden ${
                            isDark ? "border-slate-600 bg-slate-900/40" : "border-slate-200 bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleThread(t.id)}
                            className={`w-full text-left px-4 py-3 flex items-start justify-between gap-2 ${
                              isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.class}`}>
                                  {st.text}
                                </span>
                                {t.last_message_role === "staff" && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    New reply
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                                {t.subject || "Doubt"}
                              </p>
                              {t.last_message && (
                                <p className={`text-xs mt-1 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  {t.last_message}
                                </p>
                              )}
                            </div>
                            <FiMessageCircle className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-slate-200 dark:border-slate-600"
                              >
                                <div className="flex items-center justify-end px-3 pt-2 border-b border-slate-200/80 dark:border-slate-600/80">
                                  <button
                                    type="button"
                                    onClick={(e) => handleRefreshThread(e, t.id)}
                                    disabled={refreshingThreadId === threadKey}
                                    title="Refresh conversation"
                                    aria-label="Refresh conversation"
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                      isDark
                                        ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                        : "text-slate-500 hover:bg-slate-100"
                                    }`}
                                  >
                                    <FiRefreshCw
                                      className={`w-3 h-3 ${refreshingThreadId === threadKey ? "animate-spin" : ""}`}
                                    />
                                    Refresh
                                  </button>
                                </div>
                                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                                  {loadingThread === threadKey && !messages.length ? (
                                    <p className="text-xs text-slate-500">Loading conversation…</p>
                                  ) : messages.length === 0 ? (
                                    <p className="text-xs text-slate-500">No messages yet.</p>
                                  ) : (
                                    messages.map((m) => {
                                      const isStaff = m.author_role === "staff";
                                      return (
                                        <div
                                          key={m.id}
                                          className={`flex ${isStaff ? "justify-start" : "justify-end"}`}
                                        >
                                          <div
                                            className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                                              isStaff
                                                ? isDark
                                                  ? "bg-indigo-900/50 text-indigo-100 border border-indigo-500/30"
                                                  : "bg-indigo-50 text-indigo-900 border border-indigo-100"
                                                : isDark
                                                  ? "bg-slate-700 text-slate-100"
                                                  : "bg-slate-100 text-slate-900"
                                            }`}
                                          >
                                            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">
                                              {isStaff ? "Team reply" : "You"}
                                            </p>
                                            <p className="whitespace-pre-wrap">{m.body}</p>
                                            <p className="text-[10px] mt-1 opacity-60">
                                              {formatDateTime(m.created_at)}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                {t.status !== "closed" && (
                                  <div className="p-3 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Follow up…"
                                      value={replyText[t.id] || ""}
                                      onChange={(e) =>
                                        setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleReply(t.id);
                                        }
                                      }}
                                      className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                                        isDark
                                          ? "border-slate-600 bg-slate-700 text-white"
                                          : "border-slate-300 bg-white"
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      disabled={replyingId === t.id || !(replyText[t.id] || "").trim()}
                                      onClick={() => handleReply(t.id)}
                                      className="p-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                                      aria-label="Send follow-up"
                                    >
                                      <FiSend className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}

                                {t.status === "closed" && (
                                  <p className="px-4 pb-3 text-xs text-slate-500 flex items-center gap-1">
                                    <FiCheckCircle className="w-3.5 h-3.5" />
                                    This thread is closed.
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <p className={`text-[11px] flex items-center gap-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                <FiClock className="w-3 h-3" />
                Replies usually appear within 12-15 business hours.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
