// apps/api/src/modules/doubts/doubts.controller.admin.js
const { asyncHandler } = require("../../utils/asyncHandler");
const { HttpError } = require("../../utils/httpError");
const doubtsRepo = require("./doubts.repo");
const z = require("zod");

const ReplySchema = z.object({
  body: z.string().min(1).max(4000),
});

const StatusSchema = z.object({
  status: z.enum(["open", "answered", "closed"]),
});

const listDoubts = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id ?? req.auth?.tenantId;
  if (!tenantId) return res.status(400).json({ ok: false, message: "Tenant required" });

  const courseId = req.query.courseId || null;
  const status = req.query.status || null;
  const doubtType = req.query.type || null;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  const [rows, total] = await Promise.all([
    doubtsRepo.listDoubtsForAdmin({ tenantId, courseId, status, doubtType, limit, offset }),
    doubtsRepo.countDoubtsForAdmin({ tenantId, courseId, status, doubtType }),
  ]);

  res.json({ ok: true, data: rows, total });
});

const getDoubt = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id ?? req.auth?.tenantId;
  const { doubtId } = req.params;

  const doubt = await doubtsRepo.getDoubtById({ tenantId, doubtId });
  if (!doubt) throw new HttpError(404, "Doubt not found");

  const messages = await doubtsRepo.listMessagesForDoubt({ tenantId, doubtId });
  res.json({ ok: true, data: { doubt, messages } });
});

const replyToDoubt = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id ?? req.auth?.tenantId;
  const staffId = req.auth?.userId;
  const { doubtId } = req.params;
  const body = ReplySchema.parse(req.body || {});

  const doubt = await doubtsRepo.getDoubtById({ tenantId, doubtId });
  if (!doubt) throw new HttpError(404, "Doubt not found");
  if (doubt.status === "closed") throw new HttpError(400, "Doubt is closed.");

  const message = await doubtsRepo.addMessage({
    tenantId,
    doubtId,
    authorId: staffId,
    authorRole: "staff",
    body: body.body.trim(),
  });

  res.status(201).json({ ok: true, data: message });
});

const updateStatus = asyncHandler(async (req, res) => {
  const tenantId = req.tenant?.id ?? req.auth?.tenantId;
  const { doubtId } = req.params;
  const body = StatusSchema.parse(req.body || {});

  const updated = await doubtsRepo.updateDoubtStatus({ tenantId, doubtId, status: body.status });
  if (!updated) throw new HttpError(404, "Doubt not found");

  res.json({ ok: true, data: updated });
});

module.exports = {
  listDoubts,
  getDoubt,
  replyToDoubt,
  updateStatus,
};
