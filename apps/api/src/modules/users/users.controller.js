// apps/api/src/modules/users/users.controller.js
const { asyncHandler } = require("../../utils/asyncHandler");
const { HttpError } = require("../../utils/httpError");
const repo = require("./users.repo");
const { audit } = require("../audit/audit.service");
const z = require("zod");

const UpdateUserRoleSchema = z.object({
  roleId: z.string().uuid(),
});

const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

const CreateStudentSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
});

const CreateStudentBulkSchema = z.object({
  students: z.array(
    z.object({
      email: z.string().email(),
      fullName: z.string().min(1),
      phone: z.string().optional().nullable(),
      password: z.string().min(8).optional().nullable(),
      college: z.string().optional().nullable(),
    })
  ),
  generatePassword: z.boolean().optional(),
});

const UpdateStudentSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
});

const ListStudentsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  enrollment_course_id: z.string().uuid().optional(),
  enrollment_pack_id: z.string().uuid().optional(),
});

const StudentsLeaderboardQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

/** Express can surface duplicate keys as string[]; take first scalar for validation. */
function firstQueryString(val) {
  if (val == null) return undefined;
  if (Array.isArray(val)) {
    const first = val[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof val === "string" ? val : undefined;
}

const CreateMentorSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
});

const UpdateMentorSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const RestoreStudentParamsSchema = z.object({
  userId: z.string().uuid(),
});

// Tenant Admin: List all users in tenant
const listTenantUsers = asyncHandler(async (req, res) => {
  const rows = await repo.listTenantUsers({ tenantId: req.tenant.id });
  res.json({ ok: true, data: rows });
});

// Tenant Admin: Get user details
const getTenantUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const user = await repo.getTenantUser({ tenantId: req.tenant.id, userId });
  if (!user) throw new HttpError(404, "User not found");
  res.json({ ok: true, data: user });
});

// Tenant Admin: Update user role
const updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const parsed = UpdateUserRoleSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  // Verify user exists in tenant
  const user = await repo.getTenantUser({ tenantId: req.tenant.id, userId });
  if (!user) throw new HttpError(404, "User not found");

  // Verify role exists in tenant
  const roles = await repo.listTenantRoles({ tenantId: req.tenant.id });
  const roleExists = roles.some(r => r.id === parsed.data.roleId);
  if (!roleExists) throw new HttpError(400, "Role not found in tenant");

  const updated = await repo.updateUserRole({
    tenantId: req.tenant.id,
    userId,
    roleId: parsed.data.roleId,
  });

  await audit(req, {
    action: "user.role.update",
    entityType: "user",
    entityId: userId,
    payload: { roleId: parsed.data.roleId },
  });

  res.json({ ok: true, data: updated });
});

// Tenant Admin: Update user status (active/inactive)
const updateUserStatus = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const parsed = UpdateUserStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  // Verify user exists in tenant
  const user = await repo.getTenantUser({ tenantId: req.tenant.id, userId });
  if (!user) throw new HttpError(404, "User not found");

  const updated = await repo.updateUserStatus({
    userId,
    isActive: parsed.data.isActive,
  });

  await audit(req, {
    action: "user.status.update",
    entityType: "user",
    entityId: userId,
    payload: { isActive: parsed.data.isActive },
  });

  res.json({ ok: true, data: updated });
});

// Tenant Admin: List available roles
const listTenantRoles = asyncHandler(async (req, res) => {
  const rows = await repo.listTenantRoles({ tenantId: req.tenant.id });
  res.json({ ok: true, data: rows });
});

// SuperAdmin: List all students
const listStudents = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const parsed = ListStudentsQuerySchema.safeParse({
    search: firstQueryString(req.query.search),
    enrollment_course_id: firstQueryString(req.query.enrollment_course_id) || undefined,
    enrollment_pack_id: firstQueryString(req.query.enrollment_pack_id) || undefined,
  });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());

  const { enrollment_course_id, enrollment_pack_id, search: searchRaw } = parsed.data;
  const search = (searchRaw ?? "").trim();
  const enrollmentCourseId = enrollment_course_id || undefined;
  const enrollmentPackId =
    enrollment_course_id ? undefined : enrollment_pack_id || undefined;

  const students = await repo.listStudents({
    tenantId,
    search,
    enrollmentCourseId,
    enrollmentPackId,
  });
  res.json({ ok: true, data: students });
});

const listStudentsLeaderboard = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const parsed = StudentsLeaderboardQuerySchema.safeParse({
    search: firstQueryString(req.query.search),
    limit: firstQueryString(req.query.limit),
  });
  if (!parsed.success) throw new HttpError(400, "Invalid query", parsed.error.flatten());

  const rows = await repo.listStudentsLeaderboard({
    tenantId,
    search: parsed.data.search?.trim() || "",
    limit: parsed.data.limit ?? 200,
  });
  res.json({ ok: true, data: rows });
});

// SuperAdmin: Get student with stats
const getStudentWithStats = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const userId = req.params.userId;
  
  const student = await repo.getStudentWithStats({ tenantId, userId });
  if (!student) throw new HttpError(404, "Student not found");
  
  res.json({ ok: true, data: student });
});

// SuperAdmin: Create student
const createStudent = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const parsed = CreateStudentSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());

  // Check if email exists. If it belongs to an inactive student in this tenant, reactivate instead.
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const existing = await repo.findUserByEmail(normalizedEmail);

  // Hash password (default password if not provided)
  const bcrypt = require("bcrypt");
  const password = parsed.data.password || "Student@123"; // Default password
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    const membership = await repo.getMembershipWithRole({ tenantId, userId: existing.id });
    const canReactivate =
      membership &&
      membership.role_name === "Student" &&
      existing.is_active === false;

    if (canReactivate) {
      const restored = await repo.reactivateStudent({
        userId: existing.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        passwordHash,
      });
      await repo.markStudentUndoRestored({
        tenantId,
        userId: existing.id,
        fullName: restored?.full_name || parsed.data.fullName,
        email: restored?.email || normalizedEmail,
        phone: restored?.phone || parsed.data.phone || null,
      });

      await audit(req, {
        action: "student.restore",
        entityType: "user",
        entityId: existing.id,
        payload: { email: normalizedEmail },
      });

      return res.status(200).json({ ok: true, data: restored, restored: true });
    }

    throw new HttpError(409, "Email already registered");
  }
  
  const student = await repo.createStudent({
    tenantId,
    email: normalizedEmail,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone || null,
    passwordHash,
  });
  
  await audit(req, {
    action: "student.create",
    entityType: "user",
    entityId: student.id,
    payload: { email: student.email },
  });
  
  res.status(201).json({ ok: true, data: student });
});

// SuperAdmin: Create bulk students
const createStudentBulk = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  
  if (!req.body || !Array.isArray(req.body.students)) {
    throw new HttpError(400, "Invalid input: 'students' array is required");
  }

  const { students, generatePassword } = req.body;
  const bcrypt = require("bcrypt");

  // Secure password generation helper
  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password.split("").sort(() => Math.random() - 0.5).join("");
  };

  // Helper function for processing a single student record
  const processOneStudent = async (s) => {
    let rawName = typeof s?.fullName === "string" ? s.fullName.trim() : "";
    let rawEmail = typeof s?.email === "string" ? s.email.trim().toLowerCase() : "";
    let phone = typeof s?.phone === "string" && s.phone.trim() ? s.phone.trim() : null;
    const college = typeof s?.college === "string" && s.college.trim() ? s.college.trim() : null;
    let password = typeof s?.password === "string" && s.password.trim() ? s.password.trim() : null;

    // Skip empty row or header rows
    if (rawName.toLowerCase().includes("name") && (rawEmail.includes("mobile") || rawEmail.includes("phone"))) {
      return null;
    }

    // Auto-fix email if missing '@' or is a phone number
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
        phone,
        college,
        status: "error",
        error: "Student name is required",
      };
    }

    if (password && password.length < 8) {
      return {
        email: rawEmail,
        fullName: rawName,
        phone,
        college,
        status: "error",
        error: "Password must be at least 8 characters",
      };
    }

    if (!password && generatePassword) {
      password = generateRandomPassword();
    } else if (!password) {
      password = "Student@123";
    }

    try {
      // Use bcrypt round 8 for fast bulk hashing (~8ms per hash instead of ~300ms)
      const passwordHash = await bcrypt.hash(password, 8);
      const existing = await repo.findUserByEmail(rawEmail);

      if (existing) {
        const membership = await repo.getMembershipWithRole({ tenantId, userId: existing.id });
        const canReactivate =
          membership &&
          membership.role_name === "Student" &&
          existing.is_active === false;

        if (canReactivate) {
          const restored = await repo.reactivateStudent({
            userId: existing.id,
            fullName: rawName,
            phone,
            passwordHash,
          });

          if (college) {
            await repo.updateStudentDetails({
              userId: existing.id,
              college,
            });
            restored.college = college;
          }

          await repo.markStudentUndoRestored({
            tenantId,
            userId: existing.id,
            fullName: restored?.full_name || rawName,
            email: restored?.email || rawEmail,
            phone: restored?.phone || phone,
          });

          await audit(req, {
            action: "student.restore",
            entityType: "user",
            entityId: existing.id,
            payload: { email: rawEmail, bulk: true },
          });

          return {
            email: rawEmail,
            fullName: rawName,
            phone,
            college,
            status: "reactivated",
            student: restored,
            password,
          };
        } else {
          return {
            email: rawEmail,
            fullName: rawName,
            phone,
            college,
            status: "error",
            error: "Email already registered and active",
          };
        }
      } else {
        const student = await repo.createStudent({
          tenantId,
          email: rawEmail,
          fullName: rawName,
          phone,
          college,
          passwordHash,
        });

        await audit(req, {
          action: "student.create",
          entityType: "user",
          entityId: student.id,
          payload: { email: student.email, bulk: true },
        });

        return {
          email: rawEmail,
          fullName: rawName,
          phone,
          college,
          status: "created",
          student,
          password,
        };
      }
    } catch (err) {
      return {
        email: rawEmail,
        fullName: rawName,
        phone,
        college,
        status: "error",
        error: err.message || "Failed to process",
      };
    }
  };

  // Run in concurrent worker batches of 10
  const concurrency = 10;
  const results = new Array(students.length);
  let index = 0;

  const workers = Array.from({ length: Math.min(concurrency, students.length) }, async () => {
    while (index < students.length) {
      const i = index++;
      results[i] = await processOneStudent(students[i]);
    }
  });

  await Promise.all(workers);

  const filteredResults = results.filter(Boolean);
  res.status(200).json({ ok: true, data: filteredResults });
});

// SuperAdmin: Update student details
const updateStudent = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const userId = req.params.userId;
  const parsed = UpdateStudentSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
  
  // Verify student exists
  const student = await repo.getTenantUser({ tenantId, userId });
  if (!student || student.role_name !== "Student") {
    throw new HttpError(404, "Student not found");
  }
  
  // Check email uniqueness if updating email
  if (parsed.data.email) {
    const existing = await repo.findUserByEmail(parsed.data.email);
    if (existing && existing.id !== userId) {
      throw new HttpError(409, "Email already in use");
    }
  }
  
  // Hash password if updating password
  let passwordHash = undefined;
  if (parsed.data.password) {
    const bcrypt = require("bcrypt");
    passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }
  
  const updated = await repo.updateStudentDetails({
    userId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    passwordHash,
  });
  
  await audit(req, {
    action: "student.update",
    entityType: "user",
    entityId: userId,
    payload: parsed.data,
  });
  
  res.json({ ok: true, data: updated });
});

// SuperAdmin: Delete student (soft delete)
const deleteStudent = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const userId = req.params.userId;
  
  // Verify student exists
  const student = await repo.getTenantUser({ tenantId, userId });
  if (!student || student.role_name !== "Student") {
    throw new HttpError(404, "Student not found");
  }
  
  const deleted = await repo.deleteStudent({ userId });
  await repo.upsertStudentUndoRemoved({
    tenantId,
    userId,
    fullName: student.full_name,
    email: student.email,
    phone: student.phone || null,
  });
  
  await audit(req, {
    action: "student.delete",
    entityType: "user",
    entityId: userId,
    payload: { email: student.email },
  });
  
  res.json({ ok: true, data: deleted });
});

// SuperAdmin: DB-backed undo list for students
const listStudentUndoLogs = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const rows = await repo.listStudentUndoLogs({ tenantId });
  res.json({ ok: true, data: rows });
});

// SuperAdmin: Restore a soft-deleted student by id
const restoreStudent = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const parsed = RestoreStudentParamsSchema.safeParse(req.params);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
  const userId = parsed.data.userId;

  const student = await repo.getTenantUser({ tenantId, userId });
  if (!student || student.role_name !== "Student") {
    throw new HttpError(404, "Student not found");
  }
  if (student.is_active) {
    const activeLog = await repo.markStudentUndoRestored({
      tenantId,
      userId,
      fullName: student.full_name,
      email: student.email,
      phone: student.phone || null,
    });
    return res.json({ ok: true, data: { student, undo: activeLog, already_active: true } });
  }

  const restored = await repo.updateUserStatus({ userId, isActive: true });
  const undoLog = await repo.markStudentUndoRestored({
    tenantId,
    userId,
    fullName: restored?.full_name || student.full_name,
    email: restored?.email || student.email,
    phone: restored?.phone || student.phone || null,
  });

  await audit(req, {
    action: "student.restore",
    entityType: "user",
    entityId: userId,
    payload: { email: student.email, source: "undo_tab" },
  });

  res.json({ ok: true, data: { student: restored, undo: undoLog } });
});

// SuperAdmin: List all mentors
const listMentors = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const search = req.query.search || "";
  
  const mentors = await repo.listMentors({ tenantId, search });
  res.json({ ok: true, data: mentors });
});

// SuperAdmin: Get mentor with students
const getMentorWithStudents = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const mentorId = req.params.mentorId;
  
  const mentor = await repo.getMentorWithStudents({ tenantId, mentorId });
  if (!mentor) throw new HttpError(404, "Mentor not found");
  
  res.json({ ok: true, data: mentor });
});

// SuperAdmin: Create mentor
const createMentor = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const parsed = CreateMentorSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
  
  // Check if email exists
  const existing = await repo.findUserByEmail(parsed.data.email);
  if (existing) throw new HttpError(409, "Email already registered");
  
  // Hash password (default password if not provided)
  const bcrypt = require("bcrypt");
  const password = parsed.data.password || "Mentor@123"; // Default password
  const passwordHash = await bcrypt.hash(password, 12);
  
  const mentor = await repo.createMentor({
    tenantId,
    email: parsed.data.email.trim().toLowerCase(),
    fullName: parsed.data.fullName,
    phone: parsed.data.phone || null,
    passwordHash,
  });
  
  await audit(req, {
    action: "mentor.create",
    entityType: "user",
    entityId: mentor.id,
    payload: { email: mentor.email },
  });
  
  res.status(201).json({ ok: true, data: mentor });
});

// SuperAdmin: Update mentor details
const updateMentor = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const userId = req.params.mentorId;
  const parsed = UpdateMentorSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, "Invalid input", parsed.error.flatten());
  
  // Verify mentor exists
  const mentor = await repo.getTenantUser({ tenantId, userId });
  if (!mentor || mentor.role_name !== "Mentor") {
    throw new HttpError(404, "Mentor not found");
  }
  
  // Check email uniqueness if updating email
  if (parsed.data.email) {
    const existing = await repo.findUserByEmail(parsed.data.email);
    if (existing && existing.id !== userId) {
      throw new HttpError(409, "Email already in use");
    }
  }
  
  const updated = await repo.updateMentorDetails({
    userId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
  });
  
  await audit(req, {
    action: "mentor.update",
    entityType: "user",
    entityId: userId,
    payload: parsed.data,
  });
  
  res.json({ ok: true, data: updated });
});

// SuperAdmin: Delete mentor (soft delete)
const deleteMentor = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.id;
  const userId = req.params.mentorId;
  
  // Verify mentor exists
  const mentor = await repo.getTenantUser({ tenantId, userId });
  if (!mentor || mentor.role_name !== "Mentor") {
    throw new HttpError(404, "Mentor not found");
  }
  
  const deleted = await repo.deleteMentor({ userId });
  
  await audit(req, {
    action: "mentor.delete",
    entityType: "user",
    entityId: userId,
    payload: { email: mentor.email },
  });
  
  res.json({ ok: true, data: deleted });
});

module.exports = {
  listTenantUsers,
  getTenantUser,
  updateUserRole,
  updateUserStatus,
  listTenantRoles,
  listStudents,
  listStudentsLeaderboard,
  getStudentWithStats,
  createStudent,
  createStudentBulk,
  updateStudent,
  deleteStudent,
  listStudentUndoLogs,
  restoreStudent,
  listMentors,
  getMentorWithStudents,
  createMentor,
  updateMentor,
  deleteMentor,
};

