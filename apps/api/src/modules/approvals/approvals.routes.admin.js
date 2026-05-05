// apps/api/src/modules/approvals/approvals.routes.admin.js
const express = require("express");
const { requireAuth } = require("../../middlewares/auth/requireAuth");
const { requireRole } = require("../../middlewares/rbac/requireRole");
const controller = require("./approvals.controller");

const router = express.Router();
router.use(requireAuth, requireRole(["SuperAdmin"]));

router.get("/", controller.list);
router.post("/", controller.createManual);
router.post("/provision-from-razorpay", controller.provisionFromRazorpay);
router.post("/:id/approve", controller.approve);
router.post("/:id/reject", controller.reject);

module.exports = { router };
