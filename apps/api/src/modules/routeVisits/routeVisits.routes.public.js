const express = require("express");
const { optionalAuth } = require("../../middlewares/auth/optionalAuth");
const { publicApiLimiter } = require("../../middlewares/rate-limit/rateLimiters");
const controller = require("./routeVisits.controller");

const router = express.Router();

router.post("/route-visits", publicApiLimiter, optionalAuth, controller.recordVisit);

module.exports = { router };
