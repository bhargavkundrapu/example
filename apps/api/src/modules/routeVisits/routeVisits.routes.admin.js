const express = require("express");
const { requireAuth } = require("../../middlewares/auth/requireAuth");
const { requireRole } = require("../../middlewares/rbac/requireRole");
const controller = require("./routeVisits.controller");

const router = express.Router();

router.use(requireAuth, requireRole(["SuperAdmin"]));

router.get("/route-visits/overview", controller.getOverview);
router.get("/route-visits/summary", controller.listSummary);
router.get("/route-visits/recent", controller.listRecent);

module.exports = { router };
