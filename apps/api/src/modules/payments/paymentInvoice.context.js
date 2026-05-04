/**
 * Shared fields for purchase receipt email + PDF (single source of truth).
 */
const { env } = require("../../config/env");
const paymentsRepo = require("./payments.repo");
const { splitTotalAmount } = require("./payments.pricing");

const SELLER_LEGAL_NAME = (process.env.INVOICE_SELLER_LEGAL_NAME || "ExpoGraph").trim();
const SELLER_ADDRESS = (process.env.INVOICE_SELLER_ADDRESS || "").trim();
const SELLER_GSTIN = (process.env.INVOICE_SELLER_GSTIN || "").trim();
const SUPPORT_EMAIL = (process.env.INVOICE_SUPPORT_EMAIL || process.env.RESEND_REPLY_TO || "").trim();

function stableInvoiceNo(order) {
  const id = String(order?.id || "").replace(/-/g, "");
  const short = id.slice(0, 12).toUpperCase();
  return short ? `EG-${short}` : `EG-${Date.now()}`;
}

/**
 * Format rupees for receipt email + PDF. Avoid `style: "currency"` / Unicode ₹ (U+20B9):
 * PDFKit's standard Helvetica cannot encode ₹ and may substitute a wrong glyph (often
 * digit "1"), so amounts look like "199" instead of ninety-nine rupees.
 */
function formatInrFromPaise(paise) {
  const n = Number(paise) / 100;
  if (!Number.isFinite(n)) return "Rs. 0";
  const frac = n % 1 === 0 ? 0 : 2;
  const num = n.toLocaleString("en-IN", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });
  return `Rs. ${num}`;
}

/**
 * @param {object} order payment_orders row
 * @param {object} payment payments row
 * @param {string} razorpayPaymentId
 */
async function getPurchaseInvoiceContext(order, payment, razorpayPaymentId) {
  const to = String(order.customer_email || "").trim();
  const { basePaise, platformFeePaise, totalPaise } = splitTotalAmount(order.item_type, order.amount);

  let itemLabel = order.item_type === "pack" ? "Course pack" : "Course";
  try {
    if (order.item_type === "course") {
      const c = await paymentsRepo.getCoursePrice({ tenantId: order.tenant_id, courseId: order.item_id });
      if (c?.title) itemLabel = c.title;
    } else if (order.item_type === "pack") {
      const p = await paymentsRepo.getPackPrice({ tenantId: order.tenant_id, packId: order.item_id });
      if (p?.title) itemLabel = p.title;
    }
  } catch {
    // keep fallback label
  }

  const itemTypeLabel = order.item_type === "pack" ? "All-access pack" : "Single course";
  const invoiceNo = stableInvoiceNo(order);
  const paidAtIso = new Date().toISOString();
  const paidAtDisplay = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
  const publicWebUrl = (env.PUBLIC_WEB_URL || "http://localhost:5173").replace(/\/$/, "");

  return {
    to,
    invoiceNo,
    customerName: order.customer_name,
    customerEmail: to,
    customerPhone: order.customer_phone || "",
    itemLabel,
    itemTypeLabel,
    basePaise,
    platformFeePaise,
    totalPaise,
    baseFormatted: formatInrFromPaise(basePaise),
    feeFormatted: formatInrFromPaise(platformFeePaise),
    totalFormatted: formatInrFromPaise(totalPaise),
    razorpayOrderId: order.razorpay_order_id || "",
    razorpayPaymentId: razorpayPaymentId || "",
    paidAtIso,
    paidAtDisplay,
    publicWebUrl,
    sellerLegalName: SELLER_LEGAL_NAME,
    sellerAddress: SELLER_ADDRESS,
    sellerGstin: SELLER_GSTIN,
    supportEmail: SUPPORT_EMAIL,
    paymentId: payment?.id || "",
    orderId: order?.id || "",
  };
}

module.exports = {
  stableInvoiceNo,
  formatInrFromPaise,
  getPurchaseInvoiceContext,
};
