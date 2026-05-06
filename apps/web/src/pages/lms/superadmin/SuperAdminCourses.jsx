import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiFetch } from "../../../services/api";
import { GenericPageSkeleton } from "../../../Components/common/SkeletonLoaders";
import { ButtonLoading } from "../../../Components/common/LoadingStates";
import {
  FiBook,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiChevronRight,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiGlobe,
  FiCode,
  FiSave,
  FiChevronDown,
} from "react-icons/fi";

export default function SuperAdminCourses() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { courseId, moduleId, lessonId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [courseDeleteModal, setCourseDeleteModal] = useState({
    open: false,
    loading: false,
    deleting: false,
    impact: null,
    typedValue: "",
  });
  const [filterLevel, setFilterLevel] = useState("all");
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null); // Track which status dropdown is open
  
  // Form states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", level: "beginner" });
  const [moduleForm, setModuleForm] = useState({ title: "" });
  const [courseEditForm, setCourseEditForm] = useState({ title: "", description: "", level: "beginner", priceRupees: "" });
  const [moduleEditForm, setModuleEditForm] = useState({ title: "" });

  // Determine current view
  const getCurrentView = () => {
    const path = window.location.pathname;
    if (lessonId) return "lesson";
    if (moduleId && path.includes("/modules/") && !path.includes("/lessons/create") && !(path.includes("/lessons/") && path.includes("/edit"))) return "modules";
    if (courseId && path.includes("/courses/") && !path.includes("/modules/")) return "course";
    if (path.includes("/list")) return "course-list";
    return "main";
  };

  const view = getCurrentView();

  // Filter courses by level (for course-list view)
  const filteredCourses =
    filterLevel === "all"
      ? courses
      : courses.filter((c) => (c.level || "beginner") === filterLevel);

  useEffect(() => {
    if (!token) return;
    
    if (view === "main" || view === "course-list") {
      fetchCourses();
    } else if (view === "course" && courseId) {
      fetchCourseModules();
    } else if (view === "modules" && courseId && moduleId) {
      fetchModuleLessons();
    }
  }, [token, view, courseId, moduleId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/v1/admin/courses", { token });
      setCourses(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseModules = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/v1/admin/courses/${courseId}/tree`, { token });
      const tree = res?.data ?? res ?? {};
      setCourse(tree.course ?? tree);
      setModules(Array.isArray(tree.modules) ? tree.modules : []);
    } catch (error) {
      console.error("Failed to fetch course modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleLessons = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/v1/admin/courses/${courseId}/tree`, { token });
      const tree = res?.data ?? res ?? {};
      setCourse(tree.course ?? tree);
      const mods = Array.isArray(tree.modules) ? tree.modules : [];
      const foundModule = mods.find(m => String(m.id) === String(moduleId));
      setModule(foundModule ?? null);
      setLessons(Array.isArray(foundModule?.lessons) ? foundModule.lessons : []);
    } catch (error) {
      console.error("Failed to fetch module lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const treeRes = await apiFetch(`/api/v1/admin/courses/${courseId}/tree`, { token });
      if (treeRes?.data) {
        setCourse(treeRes.data.course || treeRes.data);
        const foundModule = treeRes.data.modules?.find(m => String(m.id) === String(moduleId));
        setModule(foundModule);
        const foundLesson = foundModule?.lessons?.find(l => String(l.id) === String(lessonId));
        if (foundLesson) {
          // Parse prompts if it's a string
          if (foundLesson.prompts && typeof foundLesson.prompts === 'string') {
            try {
              foundLesson.prompts = JSON.parse(foundLesson.prompts);
            } catch (e) {
              foundLesson.prompts = null;
            }
          }
          setLesson(foundLesson);
        }
      }
    } catch (error) {
      console.error("Failed to fetch lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title.trim()) {
      alert("Course title is required");
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch("/api/v1/admin/courses", {
        method: "POST",
        token,
        body: { title: courseForm.title.trim(), description: courseForm.description?.trim() || undefined, level: courseForm.level },
      });
      if (res && (res.ok === true || res.data?.id)) {
        setShowCourseForm(false);
        setCourseForm({ title: "", description: "", level: "beginner" });
        await fetchCourses();
      } else {
        alert(res?.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Failed to create course:", error);
      alert(error?.message || error?.payload?.error || "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      alert("Module title is required");
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch(`/api/v1/admin/courses/${courseId}/modules`, {
        method: "POST",
        token,
        body: { title: moduleForm.title.trim() },
      });
      if (res && (res.ok === true || res.data?.id)) {
        setShowModuleForm(false);
        setModuleForm({ title: "" });
        await fetchCourseModules();
      } else {
        alert(res?.error || "Failed to create module");
      }
    } catch (error) {
      console.error("Failed to create module:", error);
      alert(error?.message || error?.payload?.error || "Failed to create module");
    } finally {
      setSaving(false);
    }
  };

  const openEditCourse = (c) => {
    setEditingCourse(c);
    const pricePaise = c.price_in_paise ?? 0;
    setCourseEditForm({
      title: c.title || "",
      description: c.description || "",
      level: c.level || "beginner",
      priceRupees: pricePaise > 0 ? String(Math.round(pricePaise / 100)) : "",
    });
    setShowEditCourseModal(true);
    setShowDeleteConfirm(null);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse?.id || !courseEditForm.title.trim()) {
      alert("Course title is required");
      return;
    }
    try {
      setSaving(true);
      const pricePaise = courseEditForm.priceRupees && !isNaN(Number(courseEditForm.priceRupees))
        ? Math.round(Number(courseEditForm.priceRupees) * 100)
        : undefined;
      const editingId = editingCourse.id;
      const res = await apiFetch(`/api/v1/admin/courses/${editingId}`, {
        method: "PATCH",
        token,
        body: {
          title: courseEditForm.title.trim(),
          description: courseEditForm.description?.trim() || undefined,
          level: courseEditForm.level,
          ...(pricePaise !== undefined && { price_in_paise: Math.max(0, pricePaise) }),
        },
      });
      if (res && (res.ok === true || res.data?.id)) {
        const updatedCourse = res.data;
        setCourses((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...updatedCourse } : c))
        );
        if (courseId === editingId) {
          setCourse((prev) => (prev ? { ...prev, ...updatedCourse } : prev));
        }
        setShowEditCourseModal(false);
        setEditingCourse(null);
        setTimeout(() => fetchCourses(), 1500);
      } else {
        alert(res?.error || "Failed to update course");
      }
    } catch (error) {
      alert(error?.message || error?.payload?.error || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const openEditModule = (m) => {
    setEditingModule(m);
    setModuleEditForm({ title: m.title || "" });
    setShowEditModuleModal(true);
    setShowDeleteConfirm(null);
  };

  const handleUpdateModule = async () => {
    if (!editingModule?.id || !moduleEditForm.title.trim()) {
      alert("Module title is required");
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch(`/api/v1/admin/modules/${editingModule.id}`, {
        method: "PATCH",
        token,
        body: { title: moduleEditForm.title.trim() },
      });
      if (res && (res.ok === true || res.data?.id)) {
        setShowEditModuleModal(false);
        setEditingModule(null);
        await fetchCourseModules();
        if (moduleId === editingModule.id) await fetchModuleLessons();
      } else {
        alert(res?.error || "Failed to update module");
      }
    } catch (error) {
      alert(error?.message || error?.payload?.error || "Failed to update module");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      setSaving(true);
      const endpoints = {
        course: `/api/v1/admin/courses/${id}`,
        module: `/api/v1/admin/modules/${id}`,
        lesson: `/api/v1/admin/lessons/${id}`,
      };
      const endpoint = endpoints[type];
      if (!endpoint) return;
      await apiFetch(endpoint, { method: "DELETE", token });
      setShowDeleteConfirm(null);
      if (type === "course") {
        setCourseDeleteModal({ open: false, loading: false, deleting: false, impact: null, typedValue: "" });
      }
      if (type === "course") {
        navigate("/lms/superadmin/courses");
        await fetchCourses();
      } else if (type === "module") {
        await fetchCourseModules();
      } else if (type === "lesson") {
        await fetchModuleLessons();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert(error?.message || error?.payload?.error || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const openCourseDeleteConfirm = async (courseId) => {
    try {
      setCourseDeleteModal({
        open: true,
        loading: true,
        deleting: false,
        impact: null,
        typedValue: "",
      });
      const res = await apiFetch(`/api/v1/admin/courses/${courseId}/delete-impact`, { token });
      setCourseDeleteModal((prev) => ({
        ...prev,
        loading: false,
        impact: res?.data || null,
      }));
    } catch (error) {
      console.error("Failed to load delete impact:", error);
      alert(error?.message || error?.payload?.error || "Failed to load course delete impact");
      setCourseDeleteModal({ open: false, loading: false, deleting: false, impact: null, typedValue: "" });
    }
  };

  const closeCourseDeleteModal = () => {
    if (courseDeleteModal.deleting) return;
    setCourseDeleteModal({ open: false, loading: false, deleting: false, impact: null, typedValue: "" });
  };

  const isCourseDeleteTypedMatch = (() => {
    const expectedSlug = String(courseDeleteModal.impact?.slug || "").trim();
    const expectedTitle = String(courseDeleteModal.impact?.title || "").trim().toLowerCase();
    const typed = String(courseDeleteModal.typedValue || "").trim();
    if (!typed) return false;
    return typed === expectedSlug || typed.toLowerCase() === expectedTitle;
  })();

  const handleConfirmCourseDelete = async () => {
    const courseIdToDelete = courseDeleteModal.impact?.course_id;
    if (!courseIdToDelete || !isCourseDeleteTypedMatch) return;
    try {
      setCourseDeleteModal((prev) => ({ ...prev, deleting: true }));
      await handleDelete("course", courseIdToDelete);
    } finally {
      setCourseDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleStatusChange = async (type, id, status) => {
    try {
      setSaving(true);
      const endpoints = {
        course: `/api/v1/admin/courses/${id}/status`,
        module: `/api/v1/admin/modules/${id}/status`,
        lesson: `/api/v1/admin/lessons/${id}/status`,
      };
      const endpoint = endpoints[type];
      if (!endpoint) return;
      await apiFetch(endpoint, { method: "PATCH", token, body: { status } });
      setShowDeleteConfirm(null);
      if (type === "course") await fetchCourses();
      else if (type === "module") await fetchCourseModules();
      else if (type === "lesson") await fetchModuleLessons();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(error?.message || error?.payload?.error || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      published: "bg-green-100 text-green-700",
      unpublished: "bg-yellow-100 text-yellow-700",
      draft: "bg-slate-100 text-slate-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.draft}`}>
        {status?.toUpperCase() || "DRAFT"}
      </span>
    );
  };

  const StatusDropdown = ({ type, id, currentStatus, onStatusChange }) => {
    const isOpen = openStatusDropdown === `${type}-${id}`;
    const statusOptions = [
      { value: "draft", label: "Draft", icon: FiFileText, color: "text-slate-600" },
      { value: "published", label: "Published", icon: FiEye, color: "text-green-600" },
      { value: "unpublished", label: "Unpublished", icon: FiEyeOff, color: "text-yellow-600" },
    ];

    return (
      <div className="relative status-dropdown-container">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenStatusDropdown(isOpen ? null : `${type}-${id}`);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
            currentStatus === "published"
              ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              : currentStatus === "unpublished"
              ? "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {getStatusBadge(currentStatus)}
          <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[200] min-w-[180px] py-1">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isActive = currentStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActive) {
                      onStatusChange(type, id, option.value);
                    }
                    setOpenStatusDropdown(null);
                  }}
                  disabled={isActive}
                  className={`w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors ${
                    isActive ? "bg-slate-50 opacity-60 cursor-not-allowed" : option.color
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{option.label}</span>
                  {isActive && <FiCheck className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getCourseIcon = (course, index) => {
    if (course.title?.toLowerCase().includes('website') || course.title?.toLowerCase().includes('web')) {
      return <FiGlobe className="w-6 h-6 text-blue-500" />;
    }
    if (course.title?.toLowerCase().includes('programming') || course.title?.toLowerCase().includes('code')) {
      return <FiCode className="w-6 h-6 text-blue-500" />;
    }
    return <FiBook className="w-6 h-6 text-blue-500" />;
  };

  const courseDeleteModalUI = courseDeleteModal.open ? (
    <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl border border-slate-200 shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Delete Course - Confirmation</h3>
          <p className="mt-1 text-sm text-slate-600">
            This action permanently deletes the course and related content.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {courseDeleteModal.loading ? (
            <p className="text-sm text-slate-600">Loading impact summary...</p>
          ) : (
            <>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-semibold">Please review the impact before deleting:</p>
                <ul className="mt-2 space-y-1">
                  <li>Course: <span className="font-semibold">{courseDeleteModal.impact?.title || "-"}</span></li>
                  <li>Slug: <span className="font-mono">{courseDeleteModal.impact?.slug || "-"}</span></li>
                  <li>Modules: <span className="font-semibold">{courseDeleteModal.impact?.modules_count ?? 0}</span></li>
                  <li>Lessons: <span className="font-semibold">{courseDeleteModal.impact?.lessons_count ?? 0}</span></li>
                  <li>Active enrollments affected: <span className="font-semibold">{courseDeleteModal.impact?.total_active_enrollments ?? 0}</span></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Type exact slug <span className="font-mono bg-slate-100 px-1 rounded">{courseDeleteModal.impact?.slug || "-"}</span>
                  {" "}or exact course title to enable final delete.
                </p>
                <input
                  type="text"
                  value={courseDeleteModal.typedValue}
                  onChange={(e) => setCourseDeleteModal((prev) => ({ ...prev, typedValue: e.target.value }))}
                  placeholder="Type slug or title exactly"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
                />
              </div>
            </>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeCourseDeleteModal}
            disabled={courseDeleteModal.deleting}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmCourseDelete}
            disabled={courseDeleteModal.loading || courseDeleteModal.deleting || !isCourseDeleteTypedMatch}
            className="px-5 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {courseDeleteModal.deleting ? "Deleting..." : "Delete Course Permanently"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Main View - All Courses Card + Create Course Card
  if (view === "main") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">COURSES MANAGEMENT</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Manage Courses</h1>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* All Courses Card */}
            <div
              onClick={() => navigate("/lms/superadmin/courses/list")}
              className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FiBook className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">ALL COURSES</p>
                    <h3 className="text-lg font-bold text-slate-900">View All Courses</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">Browse and manage all your courses</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-600 font-medium">
                    <span className="text-sm">View Courses</span>
                    <FiChevronRight className="w-4 h-4 ml-2" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {courses.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Create Course Card */}
            <div
              onClick={() => setShowCourseForm(true)}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <FiPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-600">CREATE NEW</p>
                    <h3 className="text-lg font-bold text-slate-900">Create Course</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">Start building a new course</p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span className="text-sm">Create Now</span>
                  <FiChevronRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Course Modal */}
        {showCourseForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Create New Course</h2>
                  <button
                    onClick={() => {
                      setShowCourseForm(false);
                      setCourseForm({ title: "", description: "", level: "beginner" });
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="Enter course title"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Enter course description"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCourseForm(false);
                    setCourseForm({ title: "", description: "", level: "beginner" });
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={saving || !courseForm.title.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? <ButtonLoading text="Creating..." size="sm" /> : "Create Course"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <GenericPageSkeleton />;
  }

  // Courses List View
  if (view === "course-list" || (view === "course" && !courseId)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <button
                  onClick={() => navigate("/lms/superadmin/courses")}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">ALL COURSES</p>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Courses</h1>
              </div>
              <button
                onClick={() => setShowCourseForm(true)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Create Course
              </button>
            </div>
            
            {/* Level Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">Filter by level:</span>
              <button
                onClick={() => setFilterLevel("all")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filterLevel === "all" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterLevel("beginner")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  filterLevel === "beginner" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Beginner
              </button>
              <button
                onClick={() => setFilterLevel("intermediate")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  filterLevel === "intermediate" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Intermediate
              </button>
              <button
                onClick={() => setFilterLevel("advanced")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                  filterLevel === "advanced" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Advanced
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-lg p-12 border border-slate-200 text-center shadow-sm">
              <FiBook className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-600 mb-4">Create your first course to get started</p>
              <button
                onClick={() => setShowCourseForm(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, index) => (
                <div
                  key={course.id}
                  onClick={() => navigate(`/lms/superadmin/courses/${course.id}`)}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-visible relative"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                          {getCourseIcon(course, index)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 truncate">{course.title || "Untitled Course"}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(course.status)}
                            <span className="text-xs text-slate-500 capitalize">{course.level || "beginner"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCourseDeleteConfirm(course.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                          title="Delete course"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(showDeleteConfirm === course.id ? null : course.id);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative z-20"
                          title="More options"
                        >
                          <FiMoreVertical className="w-5 h-5 text-slate-600" />
                        </button>
                      </div>
                      {showDeleteConfirm === course.id && (
                        <div className="absolute right-4 top-16 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] min-w-[200px] py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/lms/superadmin/courses/${course.id}`);
                              setShowDeleteConfirm(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <FiChevronRight className="w-4 h-4" />
                            View Modules
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditCourse(course);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <FiEdit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <div className="border-t border-slate-200">
                            {course.status === "published" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange("course", course.id, "unpublished");
                                  setShowDeleteConfirm(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <FiEyeOff className="w-4 h-4" />
                                Unpublish
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange("course", course.id, "published");
                                  setShowDeleteConfirm(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <FiEye className="w-4 h-4" />
                                Publish
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange("course", course.id, "draft");
                                setShowDeleteConfirm(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                            >
                              <FiFileText className="w-4 h-4" />
                              Set as Draft
                            </button>
                          </div>
                          <div className="border-t border-slate-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCourseDeleteConfirm(course.id);
                                setShowDeleteConfirm(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                      {course.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>{course.module_count ?? course.modules?.length ?? 0} Modules</span>
                      <span className="capitalize">{course.level || "beginner"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Course Modal - Same as main view */}
        {showCourseForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Create New Course</h2>
                  <button
                    onClick={() => {
                      setShowCourseForm(false);
                      setCourseForm({ title: "", description: "", level: "beginner" });
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="Enter course title"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Enter course description"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCourseForm(false);
                    setCourseForm({ title: "", description: "", level: "beginner" });
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={saving || !courseForm.title.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? <ButtonLoading text="Creating..." size="sm" /> : "Create Course"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Modal (course list view) */}
        {showEditCourseModal && editingCourse && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Edit Course</h2>
                  <button onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }} className="p-2 hover:bg-slate-100 rounded-lg"><FiX className="w-5 h-5 text-slate-600" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Course Title <span className="text-red-500">*</span></label>
                  <input type="text" value={courseEditForm.title} onChange={(e) => setCourseEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Enter course title" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                  <textarea value={courseEditForm.description} onChange={(e) => setCourseEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Enter course description" rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Level</label>
                  <select value={courseEditForm.level} onChange={(e) => setCourseEditForm((f) => ({ ...f, level: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={courseEditForm.priceRupees}
                    onChange={(e) => setCourseEditForm((f) => ({ ...f, priceRupees: e.target.value }))}
                    placeholder="e.g. 199 (leave empty for free)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">Amount in rupees. Minimum ₹1 for paid courses.</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md">Cancel</button>
                <button onClick={handleUpdateCourse} disabled={saving || !courseEditForm.title.trim()} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {saving ? <ButtonLoading text="Saving..." size="sm" /> : <><FiSave className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </div>
          </div>
        )}
        {courseDeleteModalUI}
      </div>
    );
  }

  // Modules List View (when courseId is present)
  if (view === "course" && courseId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/lms/superadmin/courses/list")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Courses</span>
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">MODULES</p>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{course?.title || "Course"}</h1>
                {getStatusBadge(course?.status)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => course && openEditCourse(course)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 flex items-center gap-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit Course
                </button>
                <button
                  onClick={() => {
                    if (course?.id) {
                      openCourseDeleteConfirm(course.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-md hover:bg-red-100 flex items-center gap-2"
                  title="Delete course"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Course
                </button>
                <button
                  onClick={() => setShowModuleForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Create Module
                </button>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          {modules.length === 0 ? (
            <div className="bg-white rounded-lg p-12 border border-slate-200 text-center shadow-sm">
              <FiFileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No modules found</h3>
              <p className="text-slate-600 mb-4">Create your first module to get started</p>
              <button
                onClick={() => setShowModuleForm(true)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
              >
                Create Module
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module, index) => (
                <div
                  key={module.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-visible relative"
                >
                  <div className="p-6 relative">
                    {/* Status Dropdown and Three Dots - Top Right */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        type="module"
                        id={module.id}
                        currentStatus={module.status || "draft"}
                        onStatusChange={handleStatusChange}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(showDeleteConfirm === module.id ? null : module.id);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative z-20"
                        title="More options"
                      >
                        <FiMoreVertical className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                    
                    {/* Main Content */}
                    <div 
                      onClick={() => navigate(`/lms/superadmin/courses/${courseId}/modules/${module.id}`)}
                      className="cursor-pointer pr-32"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiFileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 break-words leading-tight">
                            {index + 1}. {module.title || "Untitled Module"}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{module.lessons?.length || 0} Lessons</span>
                        <span className="flex items-center gap-1">
                          View Lessons
                          <FiChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                    
                    {/* Delete Button - Bottom Right */}
                    <div className="flex items-center justify-end mt-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this module? This will remove all lessons in it.")) {
                            handleDelete("module", module.id);
                          }
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                        title="Delete module"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Module Actions Menu */}
                  {showDeleteConfirm === module.id && (
                    <div className="absolute right-4 top-16 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] min-w-[200px] py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lms/superadmin/courses/${courseId}/modules/${module.id}`);
                          setShowDeleteConfirm(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <FiChevronRight className="w-4 h-4" />
                        View Lessons
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModule(module);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <div className="border-t border-slate-200">
                        {module.status === "published" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange("module", module.id, "unpublished");
                              setShowDeleteConfirm(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <FiEyeOff className="w-4 h-4" />
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange("module", module.id, "published");
                              setShowDeleteConfirm(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <FiEye className="w-4 h-4" />
                            Publish
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange("module", module.id, "draft");
                            setShowDeleteConfirm(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                        >
                          <FiFileText className="w-4 h-4" />
                          Set as Draft
                        </button>
                      </div>
                      <div className="border-t border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this module?")) {
                              handleDelete("module", module.id);
                            }
                            setShowDeleteConfirm(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Module Modal */}
        {showModuleForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Create New Module</h2>
                  <button
                    onClick={() => {
                      setShowModuleForm(false);
                      setModuleForm({ title: "" });
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Module Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    placeholder="Enter module title"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModuleForm(false);
                    setModuleForm({ title: "" });
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateModule}
                  disabled={saving || !moduleForm.title.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? <ButtonLoading text="Creating..." size="sm" /> : "Create Module"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Module Modal */}
        {showEditModuleModal && editingModule && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Edit Module</h2>
                  <button
                    onClick={() => { setShowEditModuleModal(false); setEditingModule(null); }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Module Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={moduleEditForm.title}
                    onChange={(e) => setModuleEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Enter module title"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowEditModuleModal(false); setEditingModule(null); }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateModule}
                  disabled={saving || !moduleEditForm.title.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <ButtonLoading text="Saving..." size="sm" /> : <><FiSave className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Modal (also in modules view so "Edit Course" works here) */}
        {showEditCourseModal && editingCourse && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Edit Course</h2>
                  <button onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }} className="p-2 hover:bg-slate-100 rounded-lg"><FiX className="w-5 h-5 text-slate-600" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Course Title <span className="text-red-500">*</span></label>
                  <input type="text" value={courseEditForm.title} onChange={(e) => setCourseEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Enter course title" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                  <textarea value={courseEditForm.description} onChange={(e) => setCourseEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Enter course description" rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Level</label>
                  <select value={courseEditForm.level} onChange={(e) => setCourseEditForm((f) => ({ ...f, level: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={courseEditForm.priceRupees}
                    onChange={(e) => setCourseEditForm((f) => ({ ...f, priceRupees: e.target.value }))}
                    placeholder="e.g. 199 (leave empty for free)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">Amount in rupees. Minimum ₹1 for paid courses.</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button onClick={() => { setShowEditCourseModal(false); setEditingCourse(null); }} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md">Cancel</button>
                <button onClick={handleUpdateCourse} disabled={saving || !courseEditForm.title.trim()} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {saving ? <ButtonLoading text="Saving..." size="sm" /> : <><FiSave className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </div>
          </div>
        )}
        {courseDeleteModalUI}
      </div>
    );
  }

  // Lessons List View (when moduleId is present)
  if (view === "modules" && moduleId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(`/lms/superadmin/courses/${courseId}`)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Modules</span>
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">LESSONS</p>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{module?.title || "Module"}</h1>
                  {module && (
                    <StatusDropdown
                      type="module"
                      id={module.id}
                      currentStatus={module.status || "draft"}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => module && openEditModule(module)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 flex items-center gap-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit Module
                </button>
                <button
                  onClick={async () => {
                    if (moduleId && confirm("Are you sure you want to delete this module? This will remove all lessons in it.")) {
                      await handleDelete("module", moduleId);
                      navigate(`/lms/superadmin/courses/${courseId}`);
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-md hover:bg-red-100 flex items-center gap-2"
                  title="Delete module"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Module
                </button>
                <button
                  onClick={() => navigate(`/lms/superadmin/courses/${courseId}/modules/${moduleId}/lessons/create`)}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Create Lesson
                </button>
              </div>
            </div>
          </div>

          {/* Lessons Grid */}
          {lessons.length === 0 ? (
            <div className="bg-white rounded-lg p-12 border border-slate-200 text-center shadow-sm">
              <FiFileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No lessons found</h3>
              <p className="text-slate-600 mb-4">Create your first lesson to get started</p>
              <button
                onClick={() => navigate(`/lms/superadmin/courses/${courseId}/modules/${moduleId}/lessons/create`)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
              >
                Create Lesson
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden relative"
                >
                  <div className="p-6 relative">
                    {/* Status Dropdown and Three Dots - Top Right */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown
                        type="lesson"
                        id={lesson.id}
                        currentStatus={lesson.status || "draft"}
                        onStatusChange={handleStatusChange}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(showDeleteConfirm === lesson.id ? null : lesson.id);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative z-20"
                        title="More options"
                      >
                        <FiMoreVertical className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                    
                    {/* Main Content */}
                    <div 
                      onClick={() => navigate(`/lms/superadmin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`)}
                      className="cursor-pointer pr-32"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiFileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 break-words leading-tight">
                            {index + 1}. {lesson.title || "Untitled Lesson"}
                          </h3>
                        </div>
                      </div>
                      {lesson.summary && (
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{lesson.summary}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{lesson.duration_seconds ? `${Math.round(lesson.duration_seconds / 60)} mins` : "No duration"}</span>
                        <span className="flex items-center gap-1">
                          View Details
                          <FiChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Actions Menu */}
                  {showDeleteConfirm === lesson.id && (
                    <div className="absolute right-4 top-16 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lms/superadmin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`);
                          setShowDeleteConfirm(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <FiChevronRight className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lms/superadmin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/edit`);
                          setShowDeleteConfirm(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <div className="border-t border-slate-200">
                        {lesson.status === "published" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange("lesson", lesson.id, "unpublished");
                              setShowDeleteConfirm(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <FiEyeOff className="w-4 h-4" />
                            Unpublish
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange("lesson", lesson.id, "published");
                              setShowDeleteConfirm(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <FiEye className="w-4 h-4" />
                            Publish
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange("lesson", lesson.id, "draft");
                            setShowDeleteConfirm(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                        >
                          <FiFileText className="w-4 h-4" />
                          Set as Draft
                        </button>
                      </div>
                      <div className="border-t border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this lesson?")) {
                              handleDelete("lesson", lesson.id);
                            }
                            setShowDeleteConfirm(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lesson view is now handled by SuperAdminViewLesson component
  return null;
}
