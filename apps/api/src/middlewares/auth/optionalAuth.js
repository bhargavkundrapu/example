// Attaches req.auth when a valid Bearer token is present; otherwise continues anonymously.
const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");

function getTokenFromHeader(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return header.trim();
}

function optionalAuth(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.auth = payload;
    req.auth.userId = payload.sub;
    req.auth.tenantId = payload.tid;
    req.auth.membershipId = payload.mid;
    req.auth.role = payload.role;
    req.tenant = { ...(req.tenant || {}), id: payload.tid };
  } catch {
    // Invalid token — treat as anonymous for public analytics
  }
  return next();
}

module.exports = { optionalAuth };
