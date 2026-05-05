// apps/api/src/modules/payments/razorpayAdmin.routes.js
const express = require("express");
const { requireAuth } = require("../../middlewares/auth/requireAuth");
const { requireRole } = require("../../middlewares/rbac/requireRole");
const controller = require("./razorpayAdmin.controller");

const router = express.Router();
router.use(requireAuth, requireRole(["SuperAdmin"]));

router.get("/payments", controller.listPayments);
router.get("/payments/:paymentId", controller.getPayment);
router.get("/orders/:orderId", controller.getOrder);

module.exports = { router };
