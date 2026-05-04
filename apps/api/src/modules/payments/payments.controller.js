// apps/api/src/modules/payments/payments.controller.js
const { asyncHandler } = require("../../utils/asyncHandler");
const { z } = require("zod");
const { HttpError } = require("../../utils/httpError");
const { createVerificationOtp, verifyVerificationOtp } = require("../auth/verificationOtp.repo");
const { sendOtpEmail } = require("../auth/auth.email.service");
const paymentsService = require("./payments.service");

const getPriceBreakdown = asyncHandler(async (req, res) => {
  const { item_type, item_id } = req.query;
  const data = await paymentsService.getPriceBreakdown({
    tenant: req.tenant,
    item_type,
    item_id,
  });
  res.status(200).json({ ok: true, data });
});

const createOrder = asyncHandler(async (req, res) => {
  const data = await paymentsService.createOrder({ tenant: req.tenant, body: req.body });
  console.log(`[Payments] Order created: ${data.local_order_id} razorpay=${data.razorpay_order_id}`);
  res.status(200).json({ ok: true, data });
});

const callback = asyncHandler(async (req, res) => {
  const razorpay_payment_id = req.body?.razorpay_payment_id || req.query?.razorpay_payment_id;
  const razorpay_order_id = req.body?.razorpay_order_id || req.query?.razorpay_order_id;
  const razorpay_signature = req.body?.razorpay_signature || req.query?.razorpay_signature;

  let redirectUrl;
  try {
    const result = await paymentsService.handleCallback({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });
    const { env } = require("../../config/env");
    redirectUrl = result.redirect || (result.unlocked ? `${env.PUBLIC_WEB_URL}/lms/student/courses` : `${env.PUBLIC_WEB_URL}/account-pending`);
    console.log(`[Payments] Callback success`);
  } catch (err) {
    console.error("[Payments] Callback error:", err.message, err.stack);
    const { env } = require("../../config/env");
    redirectUrl = `${env.PUBLIC_WEB_URL}/account-pending`;
  }
  res.redirect(302, redirectUrl);
});

const verifyComplete = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const razorpay_payment_id = body.razorpay_payment_id ?? body.razorpayPaymentId;
  const razorpay_order_id = body.razorpay_order_id ?? body.razorpayOrderId;
  const razorpay_signature = body.razorpay_signature ?? body.razorpaySignature;

  console.log(`[Payments] verify-complete received`, {
    hasPaymentId: !!razorpay_payment_id,
    hasOrderId: !!razorpay_order_id,
    hasSignature: !!razorpay_signature,
  });

  const result = await paymentsService.handleCallback({
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  });
  console.log(`[Payments] Verify-complete success`, result.unlocked ? "unlocked" : "redirect");
  res.json({ ok: true, redirect: result.redirect, unlocked: result.unlocked });
});

const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody || (req.body && Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body || {}));

  let eventName = "";
  try {
    eventName = JSON.parse(rawBody || "{}").event || "";
  } catch (_) {
    /* ignore */
  }
  await paymentsService.handleWebhook({ rawBody, signature });
  console.log(`[Payments] Webhook OK ${eventName || "(parse skip)"}`);
  res.status(200).json({ ok: true });
});

const emailVerifyRateLimit = new Map();
const RATE_LIMIT_MS = 60_000;
const recentlyVerified = new Map();
const RECENTLY_VERIFIED_MS = 15 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of emailVerifyRateLimit) {
    if (now - ts > RATE_LIMIT_MS * 2) emailVerifyRateLimit.delete(key);
  }
  for (const [key, ts] of recentlyVerified) {
    if (now - ts > RECENTLY_VERIFIED_MS) recentlyVerified.delete(key);
  }
}, 5 * 60 * 1000);

const sendEmailVerifyOtp = asyncHandler(async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Please enter a valid email address.");

  const email = parsed.data.email.trim().toLowerCase();

  if (recentlyVerified.has(email)) {
    return res.status(200).json({ ok: true, alreadyVerified: true, message: "Email already verified." });
  }

  const lastSent = emailVerifyRateLimit.get(email);
  if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
    const wait = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastSent)) / 1000);
    throw new HttpError(429, `Please wait ${wait} seconds before requesting another code.`);
  }

  const { otpCode } = await createVerificationOtp(email);
  const appName = req.tenant?.name || "ExpoGraph";
  await sendOtpEmail({ to: email, otp: otpCode, purpose: "verify", appName });

  emailVerifyRateLimit.set(email, Date.now());
  res.status(200).json({ ok: true, message: "Verification code sent" });
});

const confirmEmailVerifyOtp = asyncHandler(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    otp: z.string().min(6).max(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input.");

  const email = parsed.data.email.trim().toLowerCase();
  const otp = parsed.data.otp.trim();

  const result = await verifyVerificationOtp(email, otp);
  if (result.locked) {
    throw new HttpError(429, "Too many failed attempts. Please request a new code.");
  }
  if (!result.valid) {
    const hint = result.attemptsLeft != null ? ` ${result.attemptsLeft} attempts left.` : "";
    throw new HttpError(400, `Invalid or expired code. Please try again or request a new code.${hint}`);
  }

  recentlyVerified.set(email, Date.now());
  res.status(200).json({ ok: true, verified: true });
});

module.exports = { createOrder, getPriceBreakdown, callback, verifyComplete, webhook, sendEmailVerifyOtp, confirmEmailVerifyOtp };
