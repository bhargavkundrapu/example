

const { listPermissionsForUser } = require("../modules/rbac/rbac.repo");
const progressRepo = require("../modules/progress/progress.repo");
const clientLabEligibilityRepo = require("../modules/clientLab/clientLabEligibility.repo");
const clientLabEligibilityService = require("../modules/clientLab/clientLabEligibility.service");
const studentRepo = require("../modules/student/student.repo");

// apps/api/src/server/createApp.js
const { router: leadsPublic } = require("../modules/leads/leads.routes.public");
const { router: leadsAdmin } = require("../modules/leads/leads.routes.admin");

const { router: workshopsPublic } = require("../modules/workshops/workshops.routes.public");
const { router: workshopsAdmin } = require("../modules/workshops/workshops.routes.admin");

const { router: podcastsAdmin } = require("../modules/podcasts/podcasts.routes.admin");

const { router: certAdmin } = require("../modules/certificates/certificates.routes.admin");
const { router: certPublic } = require("../modules/certificates/certificates.routes.public");
const { router: certLms } = require("../modules/certificates/certificates.routes.lms");
const { router: certificationsRouter } = require("../modules/certifications/certifications.routes");
const { router: certificationsAdminRouter } = require("../modules/certifications/certifications.routes.admin");

const { router: featureFlagsAdmin } = require("../modules/featureFlags/featureFlags.routes.admin");
const { router: featureFlagsPublic } = require("../modules/featureFlags/featureFlags.routes.public");

const { router: referralsRoutes } = require("../modules/referrals/referrals.routes");
const { router: resumeRouter } = require("../modules/resume/resume.routes");

const { router: adminClientLabRouter } = require("../modules/clientLab/clientLab.routes.admin");
const { router: clientLabRealWorldRouter } = require("../modules/clientLab/clientLabRealWorld.routes");
const { router: lmsClientLabRouter } = require("../modules/clientLab/clientLab.routes.lms");
const { router: mentorClientLabRouter } = require("../modules/clientLab/clientLab.routes.mentor");

const { router: usersAdminRouter } = require("../modules/users/users.routes.admin");
const { router: approvalsAdminRouter } = require("../modules/approvals/approvals.routes.admin");
const { router: feedbackAdminRouter } = require("../modules/feedback/feedback.routes.admin");
const { router: dashboardRouter } = require("../modules/dashboard/dashboard.routes");
const { router: collegesPublicRouter } = require("../modules/colleges/colleges.routes.public");

const { router: lmsInternRouter } = require("../modules/internships/internships.routes.lms");
const { router: mentorInternRouter } = require("../modules/internships/internships.routes.mentor");

const debugRoutes = require("../modules/debug/debug.routes");
const mediaRoutes = require("../modules/media/media.routes");
const { router: lmsSubmissionsRouter } = require("../modules/submissions/submissions.routes.lms");
const { router: mentorSubmissionsRouter } = require("../modules/submissions/submissions.routes.mentor");
const { router: progressRouter } = require("../modules/progress/progress.routes");
const { router: adminContentRouter } = require("../modules/content/content.routes.admin");
const { router: publicContentRouter } = require("../modules/content/content.routes.public");
const { router: studentRouter } = require("../modules/student/student.routes");
const feedbackControllerStudent = require("../modules/feedback/feedback.controller.student");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const crypto = require("crypto");
const { env } = require("../config/env");
const { resolveTenant } = require("../middlewares/tenant/resolveTenant");
const { notFound,errorHandler } = require("../middlewares/error-handler/errorHandler");
const { requireAuth } = require("../middlewares/auth/requireAuth");
const { requirePermission } = require("../middlewares/rbac/requirePermission");
const { router: authRouter } = require("../modules/auth/auth.routes");
const { router: paymentsRouter } = require("../modules/payments/payments.routes");
const paymentsController = require("../modules/payments/payments.controller");
function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  // Razorpay webhook needs raw body for signature verification - must be before express.json
  app.post(
    "/api/v1/payments/razorpay/webhook",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      req.rawBody = req.body && Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
      next();
    },
    paymentsController.webhook
  );

  app.use(express.json({ limit: "1mb" }));
 

  // CORS
 

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:4173",
  "https://expograph.in",
  "https://www.expograph.in",
];
const allowlist = new Set([...defaultOrigins, ...env.CORS_ORIGINS]);

function isAllowed(origin) {
  if (!origin) return true; // curl/postman
  if (allowlist.has(origin)) return true;
  return false;
}

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowed(origin)) return cb(null, true);
    return cb(null, false); // IMPORTANT: don't throw, just block
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Sentry tracing (W3C baggage + traceparent) may add extra headers.
  // If the API doesn't allow them, the browser blocks requests during preflight.
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Device-Id",
    "X-Tenant-Slug",
    "baggage",
    "sentry-trace",
    "traceparent",
    "tracestate",
  ],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));


  // Request timeout - 60s for /api/v1/me (heavy aggregate), 30s for others
  const ME_PATH = "/api/v1/me";
  app.use((req, res, next) => {
    const ms = req.method === "GET" && req.path === ME_PATH ? 60_000 : 30_000;
    req.setTimeout(ms);
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(503).json({ ok: false, error: "Request timeout" });
      }
    });
    next();
  });

  // Public health (before tenant resolver so it always works)
  app.get("/health", (req, res) => res.status(200).send("OK"));

  // Tenant resolver must run before auth
  app.use(resolveTenant);
  
  
  app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
});
morgan.token("id", (req) => req.id);

app.use(
  morgan(":date[iso] id=:id :method :url :status :response-time ms :res[content-length]")
);


  // Versioned API
  app.use("/api/v1/auth", authRouter);

  // Explicit lesson feedback route so it always matches (avoids router mount/path issues on localhost)
  app.post(
    "/api/v1/student/courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug/feedback",
    requireAuth,
    requirePermission("student:write"),
    feedbackControllerStudent.submitLessonFeedback
  );
  // Explicit course feedback route for consistency
  app.post(
    "/api/v1/student/courses/:courseSlug/feedback",
    requireAuth,
    requirePermission("student:write"),
    feedbackControllerStudent.submitCourseFeedback
  );

  // Mount usersAdminRouter (colleges, students, mentors, etc.) BEFORE adminContentRouter
  // so GET/POST/DELETE /api/v1/admin/colleges are matched and not 404'd by content router
  app.use("/api/v1/admin", usersAdminRouter);
  app.use("/api/v1/admin", adminContentRouter);

  // Mount /api/v1/student, /api/v1/lms, /api/v1/mentor etc. BEFORE generic /api/v1 (publicContentRouter)
  // so POST .../lessons/:slug/feedback and other student routes match on localhost and production
  app.use("/api/v1/certifications", certificationsRouter);
  app.use("/api/v1/lms", progressRouter);
  app.use("/api/v1/lms", lmsSubmissionsRouter);
  app.use("/api/v1/lms", certLms);
  app.use("/api/v1/student", studentRouter);
  app.use("/api/v1/mentor", mentorSubmissionsRouter);
  app.use("/api/v1/media", mediaRoutes);
  app.use("/api/v1/debug", debugRoutes);
  app.use("/api/v1/lms/internships", lmsInternRouter);
  app.use("/api/v1/mentor/internships", mentorInternRouter);
  app.use("/api/v1/admin/client-lab", adminClientLabRouter);
  app.use("/api/v1/client-lab", clientLabRealWorldRouter);
  app.use("/api/v1/lms/client-lab", lmsClientLabRouter);
  app.use("/api/v1/mentor/client-lab", mentorClientLabRouter);
  app.use("/api/v1/public", leadsPublic);
  app.use("/api/v1/public", workshopsPublic);
  app.use("/api/v1/public", collegesPublicRouter);
  app.use("/api/v1/public", certPublic);
  app.use("/api/v1/public", featureFlagsPublic);

  app.use("/api/v1", publicContentRouter);

  app.use("/api/v1/admin", leadsAdmin);
  app.use("/api/v1/admin", workshopsAdmin);
  app.use("/api/v1/admin", podcastsAdmin);
  app.use("/api/v1/admin", certAdmin);
  app.use("/api/v1/admin/certifications", certificationsAdminRouter);
  app.use("/api/v1/admin", featureFlagsAdmin);
  app.use("/api/v1/admin/approvals", approvalsAdminRouter);
  app.use("/api/v1/admin/feedback", feedbackAdminRouter);
  app.use("/api/v1/admin/dashboard", dashboardRouter);

  app.use("/api/v1/referrals", referralsRoutes);
  app.use("/api/v1/resume", resumeRouter);
  app.use("/api/v1/payments", paymentsRouter);

  // Presentations (stub until full API exists) – returns empty list so frontend doesn't 404
  app.get("/api/v1/presentations", requireAuth, (req, res) => {
    res.json({ ok: true, data: [] });
  });

// last line:





  // Auth test endpoint
 

app.get("/api/v1/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const tenantId = req.tenant?.id ?? req.auth?.tenantId;

    let overallProgressPercent = 0;
    let eligibleClientLab = false;
    let clientLabChecklist = null;

    const permissionsPromise = listPermissionsForUser({ tenantId, userId });

    if (req.auth?.role === "Student") {
      const checklistPromise = (async () => {
        try {
          return await clientLabEligibilityService.getClientLabChecklist({ tenantId, userId });
        } catch (e) {
          console.error("getClientLabChecklist failed:", e?.message);
          return { courses: [], hasAccess: false, allPurchased: false, allCompleted: false, eligible: false };
        }
      })();
      const [permissions, progressPercent, eligibilityResult, rawChecklist] = await Promise.all([
        permissionsPromise,
        progressRepo.getOverallProgressPercent({ tenantId, userId }),
        (async () => {
          await clientLabEligibilityService.recomputeEligibility({ tenantId, userId });
          return clientLabEligibilityRepo.getEligibility({ userId });
        })(),
        checklistPromise,
      ]);
      overallProgressPercent = progressPercent ?? 0;
      eligibleClientLab = !!eligibilityResult?.eligible_client_lab;
      clientLabChecklist = rawChecklist;
      if (!clientLabChecklist || typeof clientLabChecklist !== "object" || !Array.isArray(clientLabChecklist.courses)) {
        clientLabChecklist = { courses: [], hasAccess: false, allPurchased: false, allCompleted: false, eligible: false };
      }
      if (clientLabChecklist.hasAccess === undefined) {
        clientLabChecklist = { ...clientLabChecklist, hasAccess: !!clientLabChecklist.eligible };
      }
      const packPurchased = await studentRepo.hasPackEnrollment({ tenantId, userId }).catch(() => false);
      if (res.headersSent) return;
      return res.json({
        ok: true,
        data: {
          userId,
          tenantId,
          membershipId: req.auth?.membershipId,
          role: req.auth?.role,
          permissions,
          overall_progress_percent: overallProgressPercent,
          eligible_client_lab: eligibleClientLab,
          client_lab_checklist: clientLabChecklist,
          pack_purchased: !!packPurchased,
        },
      });
    }

    const permissions = await permissionsPromise;
    if (res.headersSent) return;
    res.json({
      ok: true,
      data: {
        userId,
        tenantId,
        membershipId: req.auth?.membershipId,
        role: req.auth?.role,
        permissions,
        overall_progress_percent: overallProgressPercent,
        eligible_client_lab: eligibleClientLab,
        client_lab_checklist: clientLabChecklist,
      },
    });
  } catch (e) {
    next(e);
  }
});



  // RBAC test endpoint (only users with content:write)
  app.get(
    "/api/v1/admin/ping",
    requireAuth,
    requirePermission("content:write"),
    (req, res) => res.json({ ok: true, data: "admin pong" })
  );
  // Helper: set CORS on response when Origin is allowed (for 404 and error responses)
  function setCorsIfAllowed(req, res) {
    if (res.headersSent) return;
    const origin = req.get("Origin");
    if (origin && allowlist.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  app.use((req, res, next) => {
    setCorsIfAllowed(req, res);
    notFound(req, res);
  });
  app.use((err, req, res, next) => {
    setCorsIfAllowed(req, res);
    errorHandler(err, req, res, next);
  });
  return app;
}

module.exports = { createApp };