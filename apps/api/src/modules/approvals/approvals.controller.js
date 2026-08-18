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
  if (!req.body || !Array.isArray(req.body.students)) {
    throw new HttpError(400, "Invalid input: 'students' array is required");
  }

  const { students, itemType, itemId } = req.body;
  if (!itemType || !["course", "pack"].includes(itemType) || !itemId) {
    throw new HttpError(400, "Invalid input: valid itemType ('course' or 'pack') and itemId required");
  }

  const processOneApproval = async (s) => {
    let rawName = typeof s?.fullName === "string" ? s.fullName.trim() : "";
    let rawEmail = typeof s?.email === "string" ? s.email.trim().toLowerCase() : "";
    let phone = typeof s?.phone === "string" ? s.phone.trim() : "";
    const college = typeof s?.college === "string" && s.college.trim() ? s.college.trim() : null;

    if (rawName.toLowerCase().includes("name") && (rawEmail.includes("mobile") || rawEmail.includes("phone"))) {
      return null;
    }

    if (!rawEmail || !rawEmail.includes("@")) {
      if (rawEmail && /^\+?\d[\d\s-]{6,}$/.test(rawEmail)) {
        phone = phone || rawEmail;
        rawEmail = `${rawEmail.replace(/\D/g, "")}@student.expograph.in`;
      } else if (phone && /^\+?\d[\d\s-]{6,}$/.test(phone)) {
        rawEmail = `${phone.replace(/\D/g, "")}@student.expograph.in`;
      } else {
        const cleanName = (rawName || "student").toLowerCase().replace(/[^a-z0-9]/g, "");
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        rawEmail = `${cleanName || "student"}_${randSuffix}@student.expograph.in`;
      }
    }

    if (!rawName) {
      return {
        email: rawEmail,
        fullName: "Student",
        status: "error",
        error: "Student name is required",
      };
    }

    if (!phone) {
      return {
        email: rawEmail,
        fullName: rawName,
        status: "error",
        error: "Phone number is required for approvals",
      };
    }

    try {
      const approval = await approvalsService.createManualApproval({
        tenantId: req.tenant.id,
        fullName: rawName,
        email: rawEmail,
        phone,
        college,
        itemType,
        itemId,
      });

      await audit(req, {
        action: "approval.manual.create",
        entityType: "approval",
        entityId: approval.id,
        payload: { email: approval.customer_email, itemType, itemId, bulk: true },
      });

      return {
        email: rawEmail,
        fullName: rawName,
        status: "created",
        approval,
      };
    } catch (err) {
      return {
        email: rawEmail,
        fullName: rawName,
        status: "error",
        error: err.message || "Failed to submit for approval",
      };
    }
  };

  const concurrency = 10;
  const results = new Array(students.length);
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, students.length) }, async () => {
    while (index < students.length) {
      const i = index++;
      results[i] = await processOneApproval(students[i]);
    }
  });

  await Promise.all(workers);

  const filteredResults = results.filter(Boolean);
  res.status(201).json({ ok: true, data: filteredResults });
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
