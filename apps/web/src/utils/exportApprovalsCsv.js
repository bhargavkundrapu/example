function escapeCsvCell(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells) {
  return cells.map(escapeCsvCell).join(",");
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

const TAB_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** Human-readable summary of filters on the approvals list (export UI / CSV metadata). */
export function buildApprovalExportFilterSummary({
  searchQuery = "",
  filters = {},
  activeTab = "pending",
}) {
  const rows = [];
  rows.push({ key: "Tab", value: TAB_LABELS[activeTab] || activeTab });

  const q = searchQuery.trim();
  if (q) rows.push({ key: "Quick search", value: q });

  const f = filters;
  if (f.name?.trim()) rows.push({ key: "Name", value: f.name.trim() });
  if (f.email?.trim()) rows.push({ key: "Email", value: f.email.trim() });
  if (f.phone?.trim()) rows.push({ key: "Phone", value: f.phone.trim() });
  if (f.college?.trim()) rows.push({ key: "College", value: f.college.trim() });
  if (f.userId?.trim()) rows.push({ key: "User ID", value: f.userId.trim() });
  if (f.dateFrom) rows.push({ key: "Created from", value: f.dateFrom });
  if (f.dateTo) rows.push({ key: "Created to", value: f.dateTo });

  return rows;
}

const DATA_HEADERS = [
  "S.No.",
  "Status",
  "Customer Name",
  "Email",
  "Phone",
  "College",
  "User ID",
  "Item Type",
  "Item Title",
  "Item ID",
  "Approval ID",
  "Payment Order ID",
  "Razorpay Order ID",
  "Razorpay Payment ID",
  "Created Date",
  "Approved At",
  "Notes",
];

function buildDataRows(approvals) {
  return approvals.map((a, index) =>
    csvRow([
      index + 1,
      a.status || "",
      a.customer_name || "",
      a.customer_email || "",
      a.customer_phone || "",
      a.customer_college || "",
      a.user_id || "",
      a.item_type || "",
      a.item_title || "",
      a.item_id || "",
      a.id || "",
      a.payment_order_id || "",
      a.razorpay_order_id || "",
      a.razorpay_payment_id || "",
      formatDate(a.created_at),
      formatDateTime(a.approved_at),
      a.notes || "",
    ])
  );
}

function formatRupeesFromPaise(paise) {
  const n = Number(paise);
  if (!Number.isFinite(n)) return "";
  return (n / 100).toFixed(2);
}

function formatRazorpayCreated(sec) {
  if (sec == null) return "";
  const s = Number(sec);
  const ms = s > 1e12 ? s : s * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

const LOCAL_APPROVAL_LABELS = {
  captured_not_approved: "Captured — not approved here",
};

/** Filter summary for Razorpay payments tab export. */
export function buildRazorpayExportFilterSummary({
  rzDateFrom = "",
  rzDateTo = "",
  rzPage = 1,
  rzPageSize = 50,
  rzSearch = "",
  rzFilterStatus = "",
  rzFilterMethod = "",
  rzFilterLocalApproval = "",
  rzSortField = "created_at",
  rzSortDir = "desc",
} = {}) {
  const rows = [{ key: "Tab", value: "Payments (Razorpay)" }];
  if (rzDateFrom) rows.push({ key: "From date", value: rzDateFrom });
  if (rzDateTo) rows.push({ key: "To date", value: rzDateTo });
  rows.push({ key: "API page", value: String(rzPage) });
  rows.push({ key: "Page size", value: String(rzPageSize) });
  const q = rzSearch.trim();
  if (q) rows.push({ key: "Page search", value: q });
  if (rzFilterStatus) rows.push({ key: "Payment status", value: rzFilterStatus });
  if (rzFilterMethod) rows.push({ key: "Method", value: rzFilterMethod });
  if (rzFilterLocalApproval) {
    rows.push({
      key: "ExpoGraph approval",
      value: LOCAL_APPROVAL_LABELS[rzFilterLocalApproval] || rzFilterLocalApproval,
    });
  }
  rows.push({ key: "Sort", value: `${rzSortField} (${rzSortDir})` });
  rows.push({
    key: "Note",
    value: "Rows are from the current Razorpay API page after client filters and sort.",
  });
  return rows;
}

const RZ_DATA_HEADERS = [
  "S.No.",
  "Payment ID",
  "Order ID",
  "Status",
  "Captured",
  "Amount (INR)",
  "Amount (paise)",
  "Currency",
  "Method",
  "Email",
  "Contact",
  "Description",
  "ExpoGraph Approval",
  "Created At",
  "Error Code",
  "Error Reason",
  "Error Description",
];

function buildRazorpayDataRows(payments) {
  return payments.map((p, index) =>
    csvRow([
      index + 1,
      p.id || "",
      p.order_id || "",
      p.status || "",
      p.captured === true ? "Yes" : p.captured === false ? "No" : "",
      formatRupeesFromPaise(p.amount),
      p.amount ?? "",
      p.currency || "",
      p.method || "",
      p.email || "",
      p.contact || "",
      p.description || "",
      p.expograph_local_approval_status || (p.order_id ? "no approval row" : ""),
      formatRazorpayCreated(p.created_at),
      p.error_code || "",
      p.error_reason || "",
      p.error_description || "",
    ])
  );
}

export function downloadRazorpayPaymentsCsv(payments, { filterSummary = [] } = {}) {
  const list = Array.isArray(payments) ? payments : [];
  const lines = [];

  lines.push(csvRow(["Field", "Value"]));
  lines.push(csvRow(["Export generated", new Date().toISOString()]));
  lines.push(csvRow(["Total payments", list.length]));

  if (filterSummary.length > 0) {
    filterSummary.forEach(({ key, value }) => {
      lines.push(csvRow([key, value]));
    });
  } else {
    lines.push(csvRow(["Applied filters", "None (current Razorpay API page)"]));
  }

  lines.push("");
  lines.push(csvRow(RZ_DATA_HEADERS));
  lines.push(...buildRazorpayDataRows(list));

  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `expograph-razorpay-payments-${stamp}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadApprovalsCsv(approvals, { filterSummary = [], activeTab = "pending" } = {}) {
  const list = Array.isArray(approvals) ? approvals : [];
  const lines = [];

  lines.push(csvRow(["Field", "Value"]));
  lines.push(csvRow(["Export generated", new Date().toISOString()]));
  lines.push(csvRow(["Total approvals", list.length]));

  if (filterSummary.length > 0) {
    filterSummary.forEach(({ key, value }) => {
      lines.push(csvRow([key, value]));
    });
  } else {
    lines.push(csvRow(["Applied filters", "None (all loaded approvals on this tab)"]));
  }

  lines.push("");
  lines.push(csvRow(DATA_HEADERS));
  lines.push(...buildDataRows(list));

  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const tabSlug = activeTab || "approvals";
  const a = document.createElement("a");
  a.href = url;
  a.download = `expograph-approvals-${tabSlug}-${stamp}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
