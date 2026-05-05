// apps/api/src/modules/payments/razorpayAdmin.service.js
const Razorpay = require("razorpay");
const { env } = require("../../config/env");
const { HttpError } = require("../../utils/httpError");
const approvalsRepo = require("../approvals/approvals.repo");
const paymentsService = require("./payments.service");

function paymentRowIsCaptured(p) {
  return p.status === "captured" || p.captured === true;
}

function getRazorpayInstance() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new HttpError(503, "Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

function parseUnix(name, raw) {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n)) throw new HttpError(400, `Invalid ${name}: expected UNIX seconds`);
  return n;
}

/**
 * Lists payments from Razorpay (GET /v1/payments). Pass include_local_approval=1 to attach
 * ExpoGraph `approvals.status` keyed by payment.order_id.
 * @see https://razorpay.com/docs/api/payments/#fetch-all-payments
 */
async function listPayments(query) {
  const from = parseUnix("from", query.from);
  const to = parseUnix("to", query.to);
  const countRaw = query.count != null ? parseInt(String(query.count), 10) : 25;
  const skipRaw = query.skip != null ? parseInt(String(query.skip), 10) : 0;
  const count = Math.min(100, Math.max(1, Number.isFinite(countRaw) ? countRaw : 25));
  const skip = Math.max(0, Number.isFinite(skipRaw) ? skipRaw : 0);

  const params = { count, skip };
  if (from !== undefined) params.from = from;
  if (to !== undefined) params.to = to;

  try {
    const rzp = getRazorpayInstance();
    const bundle = await rzp.payments.all(params);
    const wantLocal =
      String(query.include_local_approval ?? query.includeLocalApproval ?? "") === "1";
    if (!wantLocal) return bundle;

    const items = Array.isArray(bundle.items) ? bundle.items : [];
    const orderIds = items.map((p) => p.order_id).filter(Boolean);
    const statusMap = await approvalsRepo.approvalStatusesByRazorpayOrderIds(orderIds);
    bundle.items = items.map((p) => ({
      ...p,
      expograph_local_approval_status: p.order_id ? statusMap.get(String(p.order_id)) ?? null : null,
    }));

    const sweep = String(query.sweep_auto_approve ?? query.sweepAutoApprove ?? "") === "1";
    if (sweep) {
      const maxSweep = Math.min(60, Math.max(1, parseInt(String(query.sweep_max ?? "40"), 10) || 40));
      let swept = 0;
      for (const p of bundle.items) {
        if (swept >= maxSweep) break;
        if (!p.order_id || !paymentRowIsCaptured(p)) continue;
        const local = p.expograph_local_approval_status;
        if (local === "approved") continue;
        if (local === "rejected") continue;
        try {
          const r = await paymentsService.ensureCapturedRazorpayCheckoutApproved({
            razorpayOrderId: String(p.order_id),
            razorpayPaymentId: p.id ? String(p.id) : null,
          });
          if (r.ok) swept += 1;
        } catch (err) {
          console.warn("[RazorpayAdmin] sweep_auto_approve row failed:", p.order_id, err?.message || err);
        }
      }
      const orderIds2 = bundle.items.map((x) => x.order_id).filter(Boolean);
      const statusMap2 = await approvalsRepo.approvalStatusesByRazorpayOrderIds(orderIds2);
      bundle.items = bundle.items.map((p) => ({
        ...p,
        expograph_local_approval_status: p.order_id ? statusMap2.get(String(p.order_id)) ?? null : null,
      }));
    }

    return bundle;
  } catch (err) {
    const msg = err?.error?.description || err?.message || String(err);
    throw new HttpError(502, `Razorpay API error: ${msg}`);
  }
}

async function fetchPayment(paymentId) {
  if (!paymentId || typeof paymentId !== "string") throw new HttpError(400, "Invalid payment id");
  try {
    const rzp = getRazorpayInstance();
    return await rzp.payments.fetch(paymentId);
  } catch (err) {
    const status = err?.statusCode || err?.status;
    if (status === 404) throw new HttpError(404, "Payment not found in Razorpay");
    const msg = err?.error?.description || err?.message || String(err);
    throw new HttpError(502, `Razorpay API error: ${msg}`);
  }
}

async function fetchOrder(orderId) {
  if (!orderId || typeof orderId !== "string") throw new HttpError(400, "Invalid order id");
  try {
    const rzp = getRazorpayInstance();
    return await rzp.orders.fetch(orderId);
  } catch (err) {
    const status = err?.statusCode || err?.status;
    if (status === 404) throw new HttpError(404, "Order not found in Razorpay");
    const msg = err?.error?.description || err?.message || String(err);
    throw new HttpError(502, `Razorpay API error: ${msg}`);
  }
}

module.exports = {
  listPayments,
  fetchPayment,
  fetchOrder,
};
