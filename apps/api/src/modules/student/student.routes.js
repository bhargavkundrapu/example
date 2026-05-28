// apps/api/src/modules/student/student.routes.js
const express = require("express");
const ctrl = require("./student.controller");
const feedbackCtrl = require("../feedback/feedback.controller.student");
const doubtsCtrl = require("../doubts/doubts.controller.student");
const { requireAuth } = require("../../middlewares/auth/requireAuth");
const { requirePermission } = require("../../middlewares/rbac/requirePermission");

const router = express.Router();

// All routes require authentication and student permission
router.use(requireAuth);
router.use(requirePermission("student:read"));

// Dashboard & Home
router.get("/schedule", ctrl.getSchedule);
router.get("/current-course", ctrl.getCurrentCourse);
router.get("/progress", ctrl.getProgress);
router.get("/streak", ctrl.getStreak);
router.get("/events", ctrl.getEvents);

// Courses
router.get("/courses", ctrl.listCourses);
router.get("/search", ctrl.search);
router.get("/courses/:courseSlug/continue-target", ctrl.getContinueTarget);
router.get("/courses/:courseSlug/doubts", doubtsCtrl.listCourseDoubts);
router.post("/courses/:courseSlug/doubts", requirePermission("student:write"), doubtsCtrl.createCourseDoubt);
router.get("/courses/:courseSlug", ctrl.getCourseTree);
router.post("/courses/:courseSlug/feedback", requirePermission("student:write"), feedbackCtrl.submitCourseFeedback);
// POST lesson routes (literal /complete and /feedback) before GET lesson so they match correctly
router.post("/courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug/complete", ctrl.completeLesson);
router.get("/courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug/doubts", doubtsCtrl.listLessonDoubts);
router.post(
  "/courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug/doubts",
  requirePermission("student:write"),
  doubtsCtrl.createLessonDoubt
);
router.post("/courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug/feedback", requirePermission("student:write"), feedbackCtrl.submitLessonFeedback);
router.get("/courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug", ctrl.getLesson);

// Discussions
router.get("/discussions", ctrl.listDiscussions);
router.post("/discussions", requirePermission("student:write"), ctrl.createDiscussion);
router.get("/discussions/:discussionId", ctrl.getDiscussion);
router.post("/discussions/:discussionId/replies", requirePermission("student:write"), ctrl.replyToDiscussion);
router.post("/discussions/:discussionId/upvote", requirePermission("student:write"), ctrl.upvoteDiscussion);

// Bookmarks
router.get("/bookmarks", ctrl.listBookmarks);
router.post("/bookmarks", requirePermission("student:write"), ctrl.createBookmark);
router.delete("/bookmarks/:bookmarkId", requirePermission("student:write"), ctrl.deleteBookmark);

// Lesson-level synced learning state (cross-device)
router.get("/learning-state", ctrl.getLearningState);
router.put("/lesson-bookmarks", requirePermission("student:write"), ctrl.upsertLessonBookmark);
router.delete("/lesson-bookmarks", requirePermission("student:write"), ctrl.deleteLessonBookmark);
router.put("/lesson-notes", requirePermission("student:write"), ctrl.upsertLessonNote);
router.delete("/lesson-notes", requirePermission("student:write"), ctrl.deleteLessonNote);

// Doubt threads (student-owned)
router.get("/doubts/:doubtId", doubtsCtrl.getDoubtThread);
router.post("/doubts/:doubtId/messages", requirePermission("student:write"), doubtsCtrl.replyToDoubt);

// Profile
router.get("/profile", ctrl.getProfile);
router.patch("/profile", requirePermission("student:write"), ctrl.updateProfile);

module.exports = { router };
