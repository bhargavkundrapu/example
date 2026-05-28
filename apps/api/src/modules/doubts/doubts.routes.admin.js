// apps/api/src/modules/doubts/doubts.routes.admin.js
const express = require("express");
const { requireAuth } = require("../../middlewares/auth/requireAuth");
const { requireRole } = require("../../middlewares/rbac/requireRole");
const controller = require("./doubts.controller.admin");

const router = express.Router();
router.use(requireAuth, requireRole(["SuperAdmin"]));

router.get("/", controller.listDoubts);
router.get("/:doubtId", controller.getDoubt);
router.post("/:doubtId/reply", controller.replyToDoubt);
router.patch("/:doubtId/status", controller.updateStatus);

module.exports = { router };
