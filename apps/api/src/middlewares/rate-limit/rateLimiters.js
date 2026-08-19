// /mnt/e/ExpoGraph/apps/api/src/middlewares/rateLimiters.js
// /mnt/e/ExpoGraph/apps/api/src/middlewares/rate-limit/rateLimiters.js
const erl = require("express-rate-limit");
const rateLimit = erl.rateLimit || erl;   // works if package exports {rateLimit} or default
const { ipKeyGenerator } = erl;


// 1) AUTH LIMITER (login/register/otp)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                  // 30 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many auth attempts. Try again later." },
});

const mediaTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many token requests. Slow down." },
  keyGenerator: (req) =>
    req.auth?.userId ? `u:${req.auth.userId}` : ipKeyGenerator(req.ip, 64),
});

const progressLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many progress updates. Slow down." },
  keyGenerator: (req) =>
    req.auth?.userId ? `u:${req.auth.userId}` : ipKeyGenerator(req.ip, 64),
});

// Resume PDF: 5 per 10 min per user, burst 2 (strict)
const resumePdfLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: { message: "Too many resume downloads. Try again in 10 minutes." } },
  keyGenerator: (req) =>
    req.auth?.userId ? `resume:u:${req.auth.userId}` : `resume:ip:${ipKeyGenerator(req.ip, 64)}`,
});

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many payment requests. Please try again in a few minutes." },
});

const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,                  // 300 requests per min for multi-user NAT/WiFi networks
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests. Please slow down." },
  keyGenerator: (req) =>
    req.auth?.userId
      ? `u:${req.auth.userId}`
      : req.headers["x-device-id"]
      ? `dev:${req.headers["x-device-id"]}`
      : ipKeyGenerator(req.ip, 64),
});

module.exports = { authLimiter, mediaTokenLimiter, progressLimiter, resumePdfLimiter, paymentLimiter, publicApiLimiter };
