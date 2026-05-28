import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiFetch } from "../../../services/api";
import {
  FiCheckCircle,
  FiClock,
  FiMail,
  FiPhone,
  FiUser,
  FiBook,
  FiPackage,
  FiLoader,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCalendar,
  FiChevronsLeft,
  FiChevronsRight,
  FiKey,
  FiCreditCard,
  FiRefreshCw,
  FiArrowDown,
  FiArrowUp,
  FiDownload,
} from "react-icons/fi";
import {
  buildApprovalExportFilterSummary,
  buildRazorpayExportFilterSummary,
  downloadApprovalsCsv,
  downloadRazorpayPaymentsCsv,
} from "../../../utils/exportApprovalsCsv";

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const RZ_PAY_STATUS_BADGE = {
  captured: "bg-emerald-100 text-emerald-800 border-emerald-200",
  authorized: "bg-blue-100 text-blue-800 border-blue-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-violet-100 text-violet-800 border-violet-200",
  created: "bg-slate-100 text-slate-700 border-slate-200",
};

const LOCAL_APPROVAL_BADGE = {
  approved: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

function isRazorpayCaptured(p) {
  return p?.status === "captured" || p?.captured === true;
}

const PAGE_SIZES = [10, 25, 50, 100];
const RZ_PAGE_SIZES = [25, 50, 100];
const VIEW_TABS = [
  { id: "payments", label: "Payments (Razorpay)" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function formatRupeesFromPaise(paise) {
  const n = Number(paise);
  if (!Number.isFinite(n)) return "—";
  return `₹${(n / 100).toFixed(2)}`;
}

function formatUnixSeconds(sec) {
  if (sec == null) return "—";
  const s = Number(sec);
  const ms = s > 1e12 ? s : s * 1000;
  return new Date(ms).toLocaleString();
}

function getDefaultRzDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function SuperAdminApprovals() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* Razorpay live explorer — data from Razorpay API only */
  const [rzItems, setRzItems] = useState([]);
  const [rzLoading, setRzLoading] = useState(false);
  const [rzError, setRzError] = useState("");
  const [rzPage, setRzPage] = useState(1);
  const [rzPageSize, setRzPageSize] = useState(50);
  const [rzDateFrom, setRzDateFrom] = useState(() => getDefaultRzDates().from);
  const [rzDateTo, setRzDateTo] = useState(() => getDefaultRzDates().to);
  const [rzFilterStatus, setRzFilterStatus] = useState("");
  const [rzFilterMethod, setRzFilterMethod] = useState("");
  /** '' | 'captured_not_approved' — Razorpay captured payments not marked approved in ExpoGraph */
  const [rzFilterLocalApproval, setRzFilterLocalApproval] = useState("");
  const [rzSearch, setRzSearch] = useState("");
  const [rzShowFilters, setRzShowFilters] = useState(true);
  const [expandedPayId, setExpandedPayId] = useState(null);
  const [rzOrderCache, setRzOrderCache] = useState({});
  const [rzSortField, setRzSortField] = useState("created_at");
  const [rzSortDir, setRzSortDir] = useState("desc");
  const [rzJumpInput, setRzJumpInput] = useState("");
  const [approvingRzPayId, setApprovingRzPayId] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const exportFilterSummary = useMemo(
    () =>
      buildApprovalExportFilterSummary({
        searchQuery,
        filters,
        activeTab,
      }),
    [searchQuery, filters, activeTab]
  );

  const rzExportFilterSummary = useMemo(
    () =>
      buildRazorpayExportFilterSummary({
        rzDateFrom,
        rzDateTo,
        rzPage,
        rzPageSize,
        rzSearch,
        rzFilterStatus,
        rzFilterMethod,
        rzFilterLocalApproval,
        rzSortField,
        rzSortDir,
      }),
    [
      rzDateFrom,
      rzDateTo,
      rzPage,
      rzPageSize,
      rzSearch,
      rzFilterStatus,
      rzFilterMethod,
      rzFilterLocalApproval,
      rzSortField,
      rzSortDir,
    ]
  );

  const activeFilterCount =
    Object.values(filters).filter((v) => v.trim()).length + (searchQuery.trim() ? 1 : 0);

  const rzHasActiveFilters = useMemo(() => {
    const defaults = getDefaultRzDates();
    return (
      Boolean(rzFilterStatus) ||
      Boolean(rzFilterMethod) ||
      Boolean(rzFilterLocalApproval) ||
      Boolean(rzSearch.trim()) ||
      rzDateFrom !== defaults.from ||
      rzDateTo !== defaults.to ||
      rzSortField !== "created_at" ||
      rzSortDir !== "desc"
    );
  }, [
    rzFilterStatus,
    rzFilterMethod,
    rzFilterLocalApproval,
    rzSearch,
    rzDateFrom,
    rzDateTo,
    rzSortField,
    rzSortDir,
  ]);

  const rzActiveFilterCount = useMemo(() => {
    const defaults = getDefaultRzDates();
    let n = 0;
    if (rzFilterStatus) n += 1;
    if (rzFilterMethod) n += 1;
    if (rzFilterLocalApproval) n += 1;
    if (rzSearch.trim()) n += 1;
    if (rzDateFrom !== defaults.from || rzDateTo !== defaults.to) n += 1;
    if (rzSortField !== "created_at" || rzSortDir !== "desc") n += 1;
    return n;
  }, [
    rzFilterStatus,
    rzFilterMethod,
    rzFilterLocalApproval,
    rzSearch,
    rzDateFrom,
    rzDateTo,
    rzSortField,
    rzSortDir,
  ]);

  const handleDownloadExport = () => {
    if (activeTab === "payments") {
      if (sortedRzItems.length === 0) {
        alert("No payments match your current filters on this page. Adjust filters or dates, then try again.");
        return;
      }
      downloadRazorpayPaymentsCsv(sortedRzItems, { filterSummary: rzExportFilterSummary });
    } else {
      if (filteredApprovals.length === 0) {
        alert("No approvals match your current filters. Adjust filters or clear them, then try again.");
        return;
      }
      downloadApprovalsCsv(filteredApprovals, {
        filterSummary: exportFilterSummary,
        activeTab,
      });
    }
    setShowExportModal(false);
  };

  const clearFilters = () => {
    setFilters({ name: "", email: "", phone: "", college: "", userId: "", dateFrom: "", dateTo: "" });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const clearRzFilters = () => {
    const defaults = getDefaultRzDates();
    setRzFilterStatus("");
    setRzFilterMethod("");
    setRzFilterLocalApproval("");
    setRzSearch("");
    setRzDateFrom(defaults.from);
    setRzDateTo(defaults.to);
    setRzSortField("created_at");
    setRzSortDir("desc");
    setRzPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, activeTab, pageSize]);

  useEffect(() => {
    setRzPage(1);
  }, [rzDateFrom, rzDateTo, rzPageSize, activeTab]);

  const fetchApprovals = async () => {
    if (activeTab === "payments") return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/admin/approvals?status=${activeTab}`);
      setApprovals(res?.data ?? []);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRazorpayPayments = useCallback(async () => {
    if (!token || activeTab !== "payments") return;
    setRzLoading(true);
    setRzError("");
    try {
      const fromUnix = Math.floor(new Date(`${rzDateFrom}T00:00:00`).getTime() / 1000);
      const toUnix = Math.floor(new Date(`${rzDateTo}T23:59:59`).getTime() / 1000);
      const skip = (rzPage - 1) * rzPageSize;
      const qs = new URLSearchParams({
        from: String(fromUnix),
        to: String(toUnix),
        count: String(rzPageSize),
        skip: String(skip),
        include_local_approval: "1",
        sweep_auto_approve: "1",
        sweep_max: String(Math.min(100, rzPageSize)),
      });
      const res = await apiFetch(`/api/v1/admin/razorpay/payments?${qs.toString()}`);
      setRzItems(Array.isArray(res?.data?.items) ? res.data.items : []);
    } catch (e) {
      setRzError(e?.message || "Could not load payments from Razorpay.");
      setRzItems([]);
    } finally {
      setRzLoading(false);
    }
  }, [token, activeTab, rzDateFrom, rzDateTo, rzPage, rzPageSize]);

  useEffect(() => {
    if (!token || activeTab === "payments") return;
    fetchApprovals();
  }, [token, activeTab]);

  useEffect(() => {
    if (!token || activeTab !== "payments") return;
    fetchRazorpayPayments();
  }, [token, activeTab, fetchRazorpayPayments]);

  const filteredApprovals = useMemo(() => {
    let result = approvals;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (a) =>
          a.customer_name?.toLowerCase().includes(q) ||
          a.customer_email?.toLowerCase().includes(q) ||
          a.customer_phone?.includes(q) ||
          a.customer_college?.toLowerCase().includes(q) ||
          (a.user_id && String(a.user_id).toLowerCase().includes(q))
      );
    }
    const fn = filters.name.trim().toLowerCase();
    if (fn) result = result.filter((a) => a.customer_name?.toLowerCase().includes(fn));
    const fe = filters.email.trim().toLowerCase();
    if (fe) result = result.filter((a) => a.customer_email?.toLowerCase().includes(fe));
    const fp = filters.phone.trim();
    if (fp) result = result.filter((a) => a.customer_phone?.includes(fp));
    const fc = filters.college.trim().toLowerCase();
    if (fc) result = result.filter((a) => a.customer_college?.toLowerCase().includes(fc));
    const fuid = filters.userId.trim().toLowerCase();
    if (fuid) result = result.filter((a) => a.user_id && String(a.user_id).toLowerCase().includes(fuid));
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((a) => new Date(a.created_at) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((a) => new Date(a.created_at) <= to);
    }
    return result;
  }, [approvals, searchQuery, filters]);

  const filteredRzItems = useMemo(() => {
    let rows = rzItems;
    if (rzFilterStatus) {
      rows = rows.filter((p) => String(p.status || "").toLowerCase() === rzFilterStatus.toLowerCase());
    }
    if (rzFilterMethod) {
      rows = rows.filter((p) => String(p.method || "").toLowerCase() === rzFilterMethod.toLowerCase());
    }
    if (rzFilterLocalApproval === "captured_not_approved") {
      rows = rows.filter((p) => {
        const local = p.expograph_local_approval_status;
        return Boolean(p.order_id) && isRazorpayCaptured(p) && local !== "approved";
      });
    }
    const q = rzSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) => {
        const blob = [
          p.id,
          p.order_id,
          p.email,
          p.contact,
          p.description,
          p.error_code,
          p.error_description,
          p.error_reason,
          JSON.stringify(p.notes || {}),
          p.method,
          p.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return rows;
  }, [rzItems, rzFilterStatus, rzFilterMethod, rzFilterLocalApproval, rzSearch]);

  const sortedRzItems = useMemo(() => {
    const arr = [...filteredRzItems];
    const dir = rzSortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (rzSortField) {
        case "amount":
          return dir * (Number(a.amount || 0) - Number(b.amount || 0));
        case "status":
          return dir * String(a.status || "").localeCompare(String(b.status || ""));
        case "email":
          return dir * String(a.email || "").localeCompare(String(b.email || ""));
        case "method":
          return dir * String(a.method || "").localeCompare(String(b.method || ""));
        case "order_id":
          return dir * String(a.order_id || "").localeCompare(String(b.order_id || ""));
        case "created_at":
        default: {
          const ta = Number(a.created_at) || 0;
          const tb = Number(b.created_at) || 0;
          return dir * (ta - tb);
        }
      }
    });
    return arr;
  }, [filteredRzItems, rzSortField, rzSortDir]);

  const exportRowCount =
    activeTab === "payments" ? sortedRzItems.length : filteredApprovals.length;

  const totalPages = Math.max(1, Math.ceil(filteredApprovals.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedApprovals = filteredApprovals.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, filteredApprovals.length);

  const rzHasNextPage = rzItems.length >= rzPageSize;

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await apiFetch(`/api/v1/admin/approvals/${id}/approve`, { method: "POST" });
      await fetchApprovals();
    } catch (e) {
      console.error("Approve failed:", e);
      alert(e?.message || "Failed to approve");
    } finally {
      setApprovingId(null);
    }
  };

  const canProvisionFromRazorpayRow = (p) =>
    Boolean(p?.order_id) && (p.status === "captured" || p.captured === true);

  const handleProvisionFromRazorpay = async (p) => {
    if (!canProvisionFromRazorpayRow(p) || approvingRzPayId) return;
    setApprovingRzPayId(p.id);
    try {
      const res = await apiFetch("/api/v1/admin/approvals/provision-from-razorpay", {
        method: "POST",
        body: {
          razorpay_order_id: p.order_id,
          razorpay_payment_id: p.id,
        },
      });
      const d = res?.data;
      window.alert(d?.message || "Completed.");
      await fetchRazorpayPayments();
    } catch (e) {
      window.alert(e?.message || "Could not approve from this payment.");
    } finally {
      setApprovingRzPayId(null);
    }
  };

  const loadRazorpayOrder = async (orderId) => {
    if (!orderId || rzOrderCache[orderId]) return;
    try {
      const res = await apiFetch(`/api/v1/admin/razorpay/orders/${encodeURIComponent(orderId)}`);
      setRzOrderCache((prev) => ({ ...prev, [orderId]: res?.data ?? null }));
    } catch (e) {
      setRzOrderCache((prev) => ({ ...prev, [orderId]: { error: e?.message || "Failed to load order" } }));
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const INPUT_CLS =
    "w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";
  const ICON_CLS = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Payment Approvals</h1>
          <p className="mt-1 text-slate-600 text-sm">
            Approve paid purchases to create student accounts and enroll them.
          </p>
          {activeTab === "payments" && (
            <p className="mt-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 max-w-3xl">
              <strong>Payments</strong> lists live attempts from the <strong>Razorpay API</strong>.{" "}
              <strong>Approve &amp; enroll</strong> uses ExpoGraph&apos;s checkout record for that{" "}
              <code className="font-mono bg-white/80 px-1 rounded">order_*</code> only — it creates the student (same as Pending tab). Sort applies to the{" "}
              <strong>current API page</strong> after filters.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {VIEW_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === t.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.id === "payments" && <FiCreditCard className="w-4 h-4 shrink-0" />}
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            disabled={activeTab === "payments" ? rzLoading : loading}
            title={
              activeTab === "payments"
                ? "Download Razorpay payments as CSV (current API page, filters, and sort)"
                : "Download approval details as CSV (uses current tab and filters)"
            }
            className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4 shrink-0" aria-hidden />
            Download ({exportRowCount})
          </button>
        </div>

        {/* Razorpay explorer */}
        {activeTab === "payments" && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                  <input
                    type="date"
                    value={rzDateFrom}
                    onChange={(e) => setRzDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                  <input
                    type="date"
                    value={rzDateTo}
                    onChange={(e) => setRzDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Page size</label>
                  <select
                    value={rzPageSize}
                    onChange={(e) => setRzPageSize(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {RZ_PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s} / page
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fetchRazorpayPayments()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${rzLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter this page: payment id, order id, email, phone, status, errors…"
                  value={rzSearch}
                  onChange={(e) => setRzSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setRzShowFilters((p) => !p)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium ${
                  rzShowFilters || rzActiveFilterCount > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
                {rzActiveFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                    {rzActiveFilterCount}
                  </span>
                )}
                {rzShowFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
              {rzHasActiveFilters && (
                <button
                  type="button"
                  onClick={clearRzFilters}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>

            <AnimatePresence>
              {rzShowFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">Payment filters</h3>
                      <button
                        type="button"
                        onClick={clearRzFilters}
                        disabled={!rzHasActiveFilters}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                      >
                        <FiX className="w-3.5 h-3.5" />
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Payment status</label>
                      <select
                        value={rzFilterStatus}
                        onChange={(e) => setRzFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="captured">captured (success)</option>
                        <option value="failed">failed</option>
                        <option value="authorized">authorized</option>
                        <option value="created">created</option>
                        <option value="refunded">refunded</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Method</label>
                      <select
                        value={rzFilterMethod}
                        onChange={(e) => setRzFilterMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="upi">upi</option>
                        <option value="card">card</option>
                        <option value="netbanking">netbanking</option>
                        <option value="wallet">wallet</option>
                        <option value="emi">emi</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 xl:col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">ExpoGraph approval</label>
                      <select
                        value={rzFilterLocalApproval}
                        onChange={(e) => {
                          setRzFilterLocalApproval(e.target.value);
                          setRzPage(1);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="">Any</option>
                        <option value="captured_not_approved">Captured — not approved here</option>
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Matches Razorpay <span className="font-mono">order_*</span> to pending approvals (and captured payments still lacking an approved row).
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 sm:col-span-2 xl:col-span-4">
                      Opening / refreshing this tab reconciles captured ExpoGraph checkouts (attempts auto-approve). Filters apply to the{" "}
                      <strong>current Razorpay page</strong>.
                    </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Sort</span>
                <select
                  value={rzSortField}
                  onChange={(e) => setRzSortField(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-slate-50"
                >
                  <option value="created_at">Created time</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                  <option value="method">Method</option>
                  <option value="email">Email</option>
                  <option value="order_id">Order ID</option>
                </select>
                <button
                  type="button"
                  onClick={() => setRzSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {rzSortDir === "asc" ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
                  {rzSortDir === "asc" ? "Ascending" : "Descending"}
                </button>
              </div>
              {rzHasActiveFilters && (
                <button
                  type="button"
                  onClick={clearRzFilters}
                  className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 self-start sm:self-center"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Reset filters &amp; sort
                </button>
              )}
            </div>

            <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center justify-between gap-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span>
                API page <strong>{rzPage}</strong>
                {rzItems.length > 0 && (
                  <>
                    {" "}
                    · <strong>{sortedRzItems.length}</strong> rows after filter &amp; sort ({rzItems.length} raw from Razorpay)
                  </>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={rzPage <= 1 || rzLoading}
                  onClick={() => setRzPage(1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-xs font-medium"
                >
                  First
                </button>
                <button
                  type="button"
                  disabled={rzPage <= 1 || rzLoading}
                  onClick={() => setRzPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-xs font-medium"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={!rzHasNextPage || rzLoading}
                  onClick={() => setRzPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-xs font-medium"
                >
                  Next
                </button>
                <span className="text-slate-400 hidden sm:inline">|</span>
                <label className="flex items-center gap-2 text-xs">
                  Go to page
                  <input
                    type="number"
                    min={1}
                    placeholder="#"
                    value={rzJumpInput}
                    onChange={(e) => setRzJumpInput(e.target.value)}
                    className="w-16 border border-slate-200 rounded-md px-2 py-1 text-sm bg-white"
                  />
                  <button
                    type="button"
                    disabled={rzLoading}
                    onClick={() => {
                      const n = parseInt(rzJumpInput, 10);
                      if (!Number.isFinite(n) || n < 1) return;
                      setRzPage(n);
                      setRzJumpInput("");
                    }}
                    className="px-2 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40"
                  >
                    Go
                  </button>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Approvals search / filters */}
        {activeTab !== "payments" && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Quick search by name, email, phone, college, user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((p) => !p)}
                className={`flex items-center gap-2 px-5 py-3 rounded-md border font-medium transition-all whitespace-nowrap ${
                  showFilters || activeFilterCount > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">{activeFilterCount}</span>
                )}
                {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">Advanced Filters</h3>
                      {activeFilterCount > 0 && (
                        <button type="button" onClick={clearFilters} className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                          <FiX className="w-3 h-3" /> Clear all
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">User ID</label>
                        <div className="relative">
                          <FiKey className={ICON_CLS} />
                          <input
                            type="text"
                            placeholder="Filter by user ID"
                            value={filters.userId}
                            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                            className={INPUT_CLS + " font-mono text-xs"}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
                        <div className="relative">
                          <FiUser className={ICON_CLS} />
                          <input type="text" placeholder="Filter by name" value={filters.name} onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLS} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                        <div className="relative">
                          <FiMail className={ICON_CLS} />
                          <input type="text" placeholder="Filter by email" value={filters.email} onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))} className={INPUT_CLS} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
                        <div className="relative">
                          <FiPhone className={ICON_CLS} />
                          <input type="tel" placeholder="Filter by phone" value={filters.phone} onChange={(e) => setFilters((f) => ({ ...f, phone: e.target.value }))} className={INPUT_CLS} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">College</label>
                        <div className="relative">
                          <FiBook className={ICON_CLS} />
                          <input type="text" placeholder="Filter by college" value={filters.college} onChange={(e) => setFilters((f) => ({ ...f, college: e.target.value }))} className={INPUT_CLS} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">From Date</label>
                        <div className="relative">
                          <FiCalendar className={ICON_CLS} />
                          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className={INPUT_CLS} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">To Date</label>
                        <div className="relative">
                          <FiCalendar className={ICON_CLS} />
                          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className={INPUT_CLS} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Payments content */}
        {activeTab === "payments" && (
          <>
            {rzLoading ? (
              <div className="flex items-center justify-center py-16">
                <FiLoader className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : rzError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 text-sm">{rzError}</div>
            ) : sortedRzItems.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <FiCreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No payments on this page</h3>
                <p className="text-slate-600 text-sm">Adjust dates, filters, or pagination. Data source: Razorpay.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {sortedRzItems.map((p, i) => (
                  <motion.div
                    key={p.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-stretch">
                      <button
                        type="button"
                        onClick={() => setExpandedPayId((cur) => (cur === p.id ? null : p.id))}
                        className="flex-1 text-left p-4 sm:p-5 flex flex-row items-start gap-3 hover:bg-slate-50/80 transition-colors min-w-0"
                      >
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-slate-500">{p.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                RZ_PAY_STATUS_BADGE[p.status] || "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {p.status}
                              {p.captured && p.status !== "captured" ? " (captured)" : ""}
                            </span>
                            {p.method && (
                              <span className="text-xs uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{p.method}</span>
                            )}
                            {p.order_id && (
                              <span
                                title="Matched via approvals.razorpay_order_id"
                                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                  p.expograph_local_approval_status
                                    ? LOCAL_APPROVAL_BADGE[p.expograph_local_approval_status] ||
                                      "bg-slate-100 text-slate-700 border-slate-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                ExpoGraph: {p.expograph_local_approval_status || "no approval row"}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-slate-900">{formatRupeesFromPaise(p.amount)}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>{formatUnixSeconds(p.created_at)}</span>
                            {p.email && (
                              <span className="flex items-center gap-1">
                                <FiMail className="w-3.5 h-3.5" /> {p.email}
                              </span>
                            )}
                            {p.contact && (
                              <span className="flex items-center gap-1">
                                <FiPhone className="w-3.5 h-3.5" /> {p.contact}
                              </span>
                            )}
                            {p.order_id && <span className="font-mono text-xs text-indigo-700">order {p.order_id}</span>}
                          </div>
                          {(p.error_description || p.error_reason) && (
                            <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
                              {p.error_reason || p.error_description}
                            </p>
                          )}
                        </div>
                        <FiChevronRight className={`w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform ${expandedPayId === p.id ? "rotate-90" : ""}`} />
                      </button>
                      <div className="flex flex-col justify-center gap-2 px-4 py-4 sm:w-48 border-t sm:border-t-0 sm:border-l border-slate-100 bg-emerald-50/40 shrink-0">
                        <button
                          type="button"
                          disabled={!canProvisionFromRazorpayRow(p) || approvingRzPayId === p.id}
                          onClick={() => handleProvisionFromRazorpay(p)}
                          className="w-full px-3 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {approvingRzPayId === p.id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
                          Approve &amp; create account
                        </button>
                        {!p.order_id && (
                          <p className="text-[10px] text-slate-500 leading-snug">No <span className="font-mono">order_*</span> on this payment — cannot map to ExpoGraph checkout.</p>
                        )}
                        {p.order_id && !canProvisionFromRazorpayRow(p) && (
                          <p className="text-[10px] text-slate-600 leading-snug">Only <strong>captured</strong> payments can be approved here.</p>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedPayId === p.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 bg-slate-50/90">
                          <div className="p-4 space-y-3">
                            {p.order_id && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadRazorpayOrder(p.order_id);
                                  }}
                                  className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                                >
                                  Load Razorpay order JSON
                                </button>
                              </div>
                            )}
                            {p.order_id && rzOrderCache[p.order_id] && (
                              <pre className="text-[11px] leading-relaxed overflow-x-auto bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                                {JSON.stringify(rzOrderCache[p.order_id], null, 2)}
                              </pre>
                            )}
                            <pre className="text-[11px] leading-relaxed overflow-x-auto bg-white border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                              {JSON.stringify(p, null, 2)}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Approvals list */}
        {activeTab !== "payments" && loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        ) : activeTab !== "payments" && filteredApprovals.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FiClock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No approvals found</h3>
            <p className="text-slate-600">{activeFilterCount > 0 ? "Try different filters" : `No ${activeTab} approvals`}</p>
          </motion.div>
        ) : activeTab !== "payments" ? (
          <>
            <div className="space-y-4">
              {paginatedApprovals.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 sm:w-12 text-xs sm:text-sm font-semibold text-slate-400 tabular-nums flex-shrink-0 pt-0.5">
                      {filteredApprovals.length - ((safePage - 1) * pageSize + i)}.
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <FiUser className="w-4 h-4 text-slate-400 shrink-0" />
                        {a.customer_name}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[a.status] ?? STATUS_BADGE.pending}`}>{a.status}</span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        {a.item_type === "pack" ? <FiPackage className="w-3 h-3" /> : <FiBook className="w-3 h-3" />}
                        {a.item_title || `${a.item_type} ${a.item_id?.slice(0, 8)}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <FiMail className="w-4 h-4 shrink-0" />
                        {a.customer_email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiPhone className="w-4 h-4 shrink-0" />
                        {a.customer_phone || "-"}
                      </span>
                      {a.customer_college && <span className="text-slate-400">{a.customer_college}</span>}
                    </div>
                    <p className="text-slate-400 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
                      {a.user_id && <span className="font-mono text-slate-500">User ID: {String(a.user_id).slice(0, 8)}…</span>}
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                    </div>
                  </div>
                  {a.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleApprove(a.id)}
                      disabled={!!approvingId}
                      className="shrink-0 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      {approvingId === a.id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
                      Approve
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredApprovals.length > PAGE_SIZES[0] && (
              <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span>
                    Showing <strong>{startIdx}–{endIdx}</strong> of <strong>{filteredApprovals.length}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Per page</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border border-slate-200 rounded-md px-2 py-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      {PAGE_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCurrentPage(1)} disabled={safePage <= 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="First">
                    <FiChevronsLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Previous">
                    <FiChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  {getPageNumbers().map((p) => (
                    <button key={p} type="button" onClick={() => setCurrentPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === safePage ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
                      {p}
                    </button>
                  ))}
                  <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Next">
                    <FiChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                  <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Last">
                    <FiChevronsRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}

        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowExportModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.15 }}
                role="dialog"
                aria-labelledby="approval-export-title"
                className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
                  <div>
                    <h2 id="approval-export-title" className="text-lg font-semibold text-slate-900">
                      {activeTab === "payments" ? "Download Razorpay payments" : "Download approval data"}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {activeTab === "payments"
                        ? "Exports a structured CSV for payments on the current Razorpay API page after your filters and sort."
                        : "Exports a structured CSV for approvals on the current tab matching your filters."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-700">
                      <strong>{exportRowCount}</strong>{" "}
                      {activeTab === "payments" ? "payment" : "approval"}
                      {exportRowCount === 1 ? "" : "s"} will be included
                      {activeTab !== "payments" && (
                        <>
                          {" "}
                          (
                          <strong>{VIEW_TABS.find((t) => t.id === activeTab)?.label || activeTab}</strong> tab)
                        </>
                      )}
                      .
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeTab === "payments"
                        ? "Use date range, page search, status/method filters, and sort on the Payments tab. Export reflects the current API page only."
                        : "Use quick search, advanced filters, and created dates below the tabs to narrow the export."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Active filters
                    </h3>
                    <ul className="text-sm text-slate-700 space-y-1.5 max-h-40 overflow-y-auto">
                      {(activeTab === "payments" ? rzExportFilterSummary : exportFilterSummary).map((row) => (
                        <li key={row.key} className="flex gap-2">
                          <span className="font-medium text-slate-500 shrink-0">{row.key}:</span>
                          <span className="min-w-0 break-words">{row.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs text-slate-500">
                    {activeTab === "payments"
                      ? "Columns: payment/order IDs, status, amount, method, email, contact, ExpoGraph approval, errors, timestamps — plus export metadata at the top."
                      : "Columns: customer details, course/pack, payment IDs, status, dates, notes — plus export metadata at the top of the file."}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExport}
                    disabled={exportRowCount === 0 || (activeTab === "payments" ? rzLoading : loading)}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    <FiDownload className="w-4 h-4 shrink-0" aria-hidden />
                    Download CSV
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
