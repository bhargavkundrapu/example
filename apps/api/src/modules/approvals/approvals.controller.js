// apps/api/src/modules/approvals/approvals.controller.js
const { asyncHandler } = require("../../utils/asyncHandler");
const { HttpError } = require("../../utils/httpError");
const { audit } = require("../audit/audit.service");
const z = require("zod");
const approvalsService = require("./approvals.service");
const paymentsService = require("../payments/payments.service");

const CreateManualApprovalSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  college: z.string().optional().nullable(),
  itemType: z.enum(["course", "pack"]),
  itemId: z.string().uuid(),
});

const CreateManualApprovalBulkSchema = z.object({
  students: z.array(
    z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      college: z.string().optional().nullable(),
    })
  ),
  itemType: z.enum(["course", "pack"]),
  itemId: z.string().uuid(),
});

const ProvisionFromRazorpaySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1).optional().nullable(),
});

async function list(req, res) {
  const status = req.query.status;
  const rows = await approvalsService.listApprovals({
    tenantId: req.tenant.id,
    status: status || undefined,
  });
  res.json({ ok: true, data: rows });
}

async function approve(req, res) {
  const { id } = req.params;
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  await approvalsService.approveById({ approvalId: id, approvedByUserId: userId });
  res.json({ ok: true, message: "Approved" });
}

async function reject(req, res) {
  const { id } = req.params;
  const notes = req.body?.notes;
  await approvalsService.rejectById({ approvalId: id, notes });
  res.json({ ok: true, message: "Rejected" });
}

async function createManual(req, res) {
  const parsed = CreateManualApprovalSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const { fullName, email, phone, college, itemType, itemId } = parsed.data;
  const approval = await approvalsService.createManualApproval({
    tenantId: req.tenant.id,
    fullName,
    email,
    phone,
    college: college ?? null,
    itemType,
    itemId,
  });

  await audit(req, {
    action: "approval.manual.create",
    entityType: "approval",
    entityId: approval.id,
    payload: { email: approval.customer_email, itemType, itemId },
  });

  res.status(201).json({ ok: true, data: approval });
}

async function createManualBulk(req, res) {
  const parsed = CreateManualApprovalBulkSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const { students, itemType, itemId } = parsed.data;
  const results = [];

  for (const s of students) {
    try {
      const approval = await approvalsService.createManualApproval({
        tenantId: req.tenant.id,
        fullName: s.fullName.trim(),
        email: s.email.trim().toLowerCase(),
        phone: s.phone.trim(),
        college: s.college?.trim() || null,
        itemType,
        itemId,
      });

      await audit(req, {
        action: "approval.manual.create",
        entityType: "approval",
        entityId: approval.id,
        payload: { email: approval.customer_email, itemType, itemId, bulk: true },
      });

      results.push({
        email: s.email,
        fullName: s.fullName,
        status: "created",
        approval,
      });
    } catch (err) {
      results.push({
        email: s.email,
        fullName: s.fullName,
        status: "error",
        error: err.message || "Failed to submit for approval",
      });
    }
  }

  res.status(201).json({ ok: true, data: results });
}

async function provisionFromRazorpay(req, res) {
  const parsed = ProvisionFromRazorpaySchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { razorpay_order_id, razorpay_payment_id } = parsed.data;
  const result = await paymentsService.adminManualApproveFromRazorpayOrder({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id ?? undefined,
    approvedByUserId: userId,
  });

  await audit(req, {
    action: "approval.provision_from_razorpay",
    entityType: "approval",
    entityId: result.approvalId ?? razorpay_order_id,
    payload: {
      razorpay_order_id,
      outcome: result.outcome ?? null,
    },
  });

  res.json({ ok: true, data: result });
}

module.exports = {
  list: asyncHandler(list),
  createManual: asyncHandler(createManual),
  createManualBulk: asyncHandler(createManualBulk),
  provisionFromRazorpay: asyncHandler(provisionFromRazorpay),
  approve: asyncHandler(approve),
  reject: asyncHandler(reject),
};
