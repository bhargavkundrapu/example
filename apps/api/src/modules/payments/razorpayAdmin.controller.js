// apps/api/src/modules/payments/razorpayAdmin.controller.js
const { asyncHandler } = require("../../utils/asyncHandler");
const razorpayAdminService = require("./razorpayAdmin.service");

const listPayments = asyncHandler(async (req, res) => {
  const data = await razorpayAdminService.listPayments(req.query || {});
  res.json({ ok: true, data });
});

const getPayment = asyncHandler(async (req, res) => {
  const data = await razorpayAdminService.fetchPayment(req.params.paymentId);
  res.json({ ok: true, data });
});

const getOrder = asyncHandler(async (req, res) => {
  const data = await razorpayAdminService.fetchOrder(req.params.orderId);
  res.json({ ok: true, data });
});

module.exports = {
  listPayments,
  getPayment,
  getOrder,
};
