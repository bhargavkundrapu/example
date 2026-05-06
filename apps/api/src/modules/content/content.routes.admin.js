// apps/api/src/modules/content/content.routes.admin.js
const express = require("express");
const { requireAuth } = require("../../middlewares/auth/requireAuth");
const { requirePermission } = require("../../middlewares/rbac/requirePermission");
const ctrl = require("./content.controller");

const router = express.Router();

// All admin content routes require auth + permission
router.use(requireAuth, requirePermission("content:write"));

router.post("/courses", ctrl.createCourse);
router.get("/courses", ctrl.listCoursesAdmin);
router.patch("/courses/:courseId", ctrl.updateCourse);
router.get("/courses/:courseId/delete-impact", ctrl.getCourseDeleteImpact);
router.delete("/courses/:courseId", ctrl.deleteCourse);
router.patch("/courses/:courseId/status", ctrl.setCourseStatus);

router.post("/courses/:courseId/modules", ctrl.createModule);
router.patch("/modules/:moduleId", ctrl.updateModule);
router.delete("/modules/:moduleId", ctrl.deleteModule);
router.patch("/modules/:moduleId/status", ctrl.setModuleStatus);

router.post("/modules/:moduleId/lessons", ctrl.createLesson);
router.patch("/lessons/:lessonId", ctrl.updateLesson);
router.delete("/lessons/:lessonId", ctrl.deleteLesson);

router.patch("/lessons/:lessonId/status", ctrl.setLessonStatus);

router.post("/lessons/:lessonId/resources", ctrl.addResource);
router.patch("/resources/:resourceId", ctrl.updateResource);
router.delete("/resources/:resourceId", ctrl.deleteResource);
router.get("/lessons/:lessonId/resources", ctrl.listLessonResourcesAdmin);
router.get("/lessons/:lessonId/practice", ctrl.listLessonPracticeAdmin);


router.post("/lessons/:lessonId/practice", ctrl.addPractice);
router.patch("/practice/:practiceId", ctrl.updatePractice);
router.delete("/practice/:practiceId", ctrl.deletePractice);

router.get("/lessons/:lessonId/mcqs", ctrl.listLessonMcqsAdmin);
router.post("/lessons/:lessonId/mcqs", ctrl.addMcq);
router.patch("/mcqs/:mcqId", ctrl.updateMcq);
router.delete("/mcqs/:mcqId", ctrl.deleteMcq);

router.get("/lessons/:lessonId/slides", ctrl.listLessonSlidesAdmin);
router.post("/lessons/:lessonId/slides", ctrl.addSlide);
router.patch("/slides/:slideId", ctrl.updateSlide);
router.delete("/slides/:slideId", ctrl.deleteSlide);

router.get("/courses/:courseId/tree", ctrl.courseTreeAdmin);

router.get("/packs", ctrl.listCoursePacksAdmin);
router.patch("/packs/:packId", ctrl.updateCoursePack);
router.get("/packs/:packId/courses", ctrl.getPackCoursesAdmin);
router.put("/packs/:packId/courses", ctrl.setPackCourses);

module.exports = { router };
