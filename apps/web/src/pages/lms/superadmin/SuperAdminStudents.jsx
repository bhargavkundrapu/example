import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiFetch } from "../../../services/api";
import { PageLoading, ButtonLoading } from "../../../Components/common/LoadingStates";
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiEdit2,
  FiEye,
  FiX,
  FiSave,
  FiTrash2,
  FiMail,
  FiPhone,
  FiUser,
  FiTrendingUp,
  FiBriefcase,
  FiCalendar,
  FiKey,
  FiCopy,
  FiCheck,
  FiRefreshCw,
  FiLock,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiBook,
  FiAlertCircle,
  FiLayers,
  FiDownload,
} from "react-icons/fi";
import {
  buildStudentExportFilterSummary,
  downloadStudentsCsv,
} from "../../../utils/exportStudentsCsv";

const PAGE_SIZES = [10, 25, 50, 100];

function StudentProgressMeter({ percent, completed, total, compact = false }) {
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  const barColor =
    pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct > 0 ? "bg-amber-500" : "bg-slate-300";

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">{pct}% complete</span>
        {total > 0 ? (
          <span>
            {completed}/{total} lessons
          </span>
        ) : (
          <span className="text-slate-400">No published lessons</span>
        )}
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-slate-200 ${compact ? "h-1.5" : "h-2.5"}`}>
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QUICK_SEARCH_MAX = 200;

function buildEnrollmentStudentQuery(enrolledItem) {
  const qs = new URLSearchParams();
  const v = (enrolledItem || "").trim();
  if (!v) return qs;
  if (v.startsWith("course:")) {
    const id = v.slice(7).trim();
    if (UUID_RE.test(id)) qs.set("enrollment_course_id", id);
  } else if (v.startsWith("pack:")) {
    const id = v.slice(5).trim();
    if (UUID_RE.test(id)) qs.set("enrollment_pack_id", id);
  }
  return qs;
}

/** Course/pack enrollment filter (server-backed list). Used on the list toolbar, Advanced Filters, and Add Student. */
function EnrollmentCoursePackSelect({
  id,
  value,
  onChange,
  catalogOptions,
  selectClassName = "",
  emptyLabel = "All courses and packs",
  disabled = false,
  ariaLabel,
}) {
  return (
    <div className="relative">
      <FiLayers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
      <select
        id={id}
        aria-label={ariaLabel || "Filter students by course or pack"}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${selectClassName}`}
      >
        <option value="">{emptyLabel}</option>
        <optgroup label="Courses (includes students on a pack that contains this course)">
          {[...(catalogOptions.courses || [])]
            .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
            .map((c) => (
              <option key={c.id} value={`course:${c.id}`}>
                {c.title}
                {c.slug ? ` (${c.slug})` : ""}
              </option>
            ))}
        </optgroup>
        <optgroup label="Packs only">
          {[...(catalogOptions.packs || [])]
            .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
            .map((p) => (
              <option key={p.id} value={`pack:${p.id}`}>
                {p.title}
                {p.slug ? ` (${p.slug})` : ""}
              </option>
            ))}
        </optgroup>
      </select>
    </div>
  );
}

export default function SuperAdminStudents() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // Determine view from route
  const getViewFromPath = () => {
    const path = location.pathname;
    if (path.includes("/edit")) return "edit";
    if (path.includes("/details") || (params.id && !path.includes("/edit") && !path.includes("/enrollments") && !path.includes("/progress"))) return "details";
    if (path.includes("/create") || path.includes("/add")) return "add";
    if (path.includes("/undo")) return "undo";
    if (path.includes("/list")) return "list";
    if (path.includes("/cards")) return "cards";
    if (path.includes("/enrollments")) return "enrollments";
    if (path.includes("/progress")) return "progress";
    if (params.id) return "details";
    return "cards"; // default
  };
  
  const view = getViewFromPath();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsListError, setStudentsListError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "" });
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    enrollmentItem: "",
    password: "",
    generatePassword: true,
  });
  const [saving, setSaving] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [studentCredentials, setStudentCredentials] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
    enrolledItem: "",
  });
  const [catalogOptions, setCatalogOptions] = useState({ courses: [], packs: [] });
  const [catalogHydrated, setCatalogHydrated] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailRefreshBusy, setDetailRefreshBusy] = useState(false);
  const lastVisibilityRefetchAt = useRef(0);
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [restoringStudentEmail, setRestoringStudentEmail] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const exportFilterSummary = useMemo(
    () =>
      buildStudentExportFilterSummary({
        searchQuery,
        filters,
        catalogOptions,
      }),
    [searchQuery, filters, catalogOptions]
  );

  const activeFilterCount = useMemo(() => {
    const filterStrings = Object.values(filters).filter((v) => typeof v === "string" && v.trim());
    return filterStrings.length + (searchQuery.trim() ? 1 : 0);
  }, [filters, searchQuery]);

  const handleDownloadStudents = () => {
    if (filteredStudents.length === 0) {
      alert("No students match your current filters. Adjust filters or clear them, then try again.");
      return;
    }
    downloadStudentsCsv(filteredStudents, { filterSummary: exportFilterSummary });
    setShowExportModal(false);
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      email: "",
      phone: "",
      college: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
      enrolledItem: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
    setStudentsListError(null);
  };

  const reloadUndoStudents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/api/v1/admin/students/undo", { token });
      setDeletedStudents(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load undo students:", error);
      setDeletedStudents([]);
    }
  }, [token]);

  // Load courses & packs for enrollment filter dropdown (admin content API)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setCatalogHydrated(false);
    (async () => {
      const settled = await Promise.allSettled([
        apiFetch("/api/v1/admin/courses", { token }),
        apiFetch("/api/v1/admin/packs", { token }),
      ]);
      if (cancelled) return;
      const cRes = settled[0].status === "fulfilled" ? settled[0].value : null;
      const pRes = settled[1].status === "fulfilled" ? settled[1].value : null;
      setCatalogOptions({
        courses: cRes?.ok && Array.isArray(cRes.data) ? cRes.data : [],
        packs: pRes?.ok && Array.isArray(pRes.data) ? pRes.data : [],
      });
      setCatalogHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const reloadStudentsList = useCallback(
    async (signal) => {
      if (!token) return;
      const effectiveSignal = signal ?? new AbortController().signal;
      try {
        setLoading(true);
        setStudentsListError(null);
        const qs = buildEnrollmentStudentQuery(filters.enrolledItem);
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        const json = await apiFetch(`/api/v1/admin/students${suffix}`, {
          token,
          signal: effectiveSignal,
        });
        if (effectiveSignal.aborted) return;
        setStudents(Array.isArray(json?.data) ? json.data : []);
      } catch (error) {
        const aborted =
          error?.name === "AbortError" ||
          (error?.message && /abort|signal\s+is\s+aborted/i.test(String(error.message)));
        if (aborted) return;
        console.error("Failed to fetch students:", error);
        setStudents([]);
        setStudentsListError(error?.message || "Could not load students.");
      } finally {
        if (!effectiveSignal.aborted) {
          setLoading(false);
        }
      }
    },
    [token, filters.enrolledItem]
  );

  useEffect(() => {
    if (!token) return undefined;
    const ac = new AbortController();
    reloadStudentsList(ac.signal);
    return () => ac.abort();
  }, [token, filters.enrolledItem, reloadStudentsList]);

  useEffect(() => {
    if (!token) setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    reloadUndoStudents();
  }, [token, view, reloadUndoStudents]);

  // After catalog loads: drop bad enrollment filter values (invalid id, removed course/pack, or no catalog access)
  useEffect(() => {
    if (!catalogHydrated) return;

    const enrolled = filters.enrolledItem;
    if (!enrolled?.trim()) return;

    let kind;
    let id;
    if (enrolled.startsWith("course:")) {
      kind = "course";
      id = enrolled.slice(7).trim();
    } else if (enrolled.startsWith("pack:")) {
      kind = "pack";
      id = enrolled.slice(5).trim();
    } else {
      setFilters((f) => ({ ...f, enrolledItem: "" }));
      return;
    }
    if (!UUID_RE.test(id)) {
      setFilters((f) => ({ ...f, enrolledItem: "" }));
      return;
    }

    const hasCourses = catalogOptions.courses.length > 0;
    const hasPacks = catalogOptions.packs.length > 0;
    if (!hasCourses && !hasPacks) {
      setFilters((f) => ({ ...f, enrolledItem: "" }));
      return;
    }

    if (kind === "course" && !catalogOptions.courses.some((c) => String(c.id) === id)) {
      setFilters((f) => ({ ...f, enrolledItem: "" }));
      return;
    }
    if (kind === "pack" && !catalogOptions.packs.some((p) => String(p.id) === id)) {
      setFilters((f) => ({ ...f, enrolledItem: "" }));
    }
  }, [catalogHydrated, catalogOptions.courses, catalogOptions.packs, filters.enrolledItem]);

  const refetchStudentDetail = useCallback(async () => {
    if (!token || !params.id) return;
    setDetailRefreshBusy(true);
    try {
      const res = await apiFetch(`/api/v1/admin/students/${params.id}`, { token });
      if (res?.ok) setSelectedStudent(res.data);
    } catch (e) {
      console.error("Failed to refresh student details:", e);
    } finally {
      setDetailRefreshBusy(false);
    }
  }, [token, params.id]);

  // Load student details/edit when route has :id - details always refetched for up-to-date purchases/enrollments
  useEffect(() => {
    if (!token || !params.id) return;

    if (view === "edit" && selectedStudent && String(selectedStudent.id) === String(params.id)) {
      setEditForm({
        fullName: selectedStudent.full_name || "",
        email: selectedStudent.email || "",
        phone: selectedStudent.phone || "",
      });
      return;
    }

    const loadStudentData = async () => {
      try {
        if (view === "details") {
          const res = await apiFetch(`/api/v1/admin/students/${params.id}`, { token });
          if (res?.ok) {
            setSelectedStudent(res.data);
          } else {
            console.error("Failed to load student details from API");
          }
        } else if (view === "edit") {
          const student = students.find((s) => String(s.id) === String(params.id));
          if (student) {
            setSelectedStudent(student);
            setEditForm({
              fullName: student.full_name || "",
              email: student.email || "",
              phone: student.phone || "",
            });
          } else {
            const res = await apiFetch(`/api/v1/admin/students/${params.id}`, { token });
            if (res?.ok) {
              const studentData = res.data;
              setSelectedStudent(studentData);
              setEditForm({
                fullName: studentData.full_name || "",
                email: studentData.email || "",
                phone: studentData.phone || "",
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load student data from route:", error);
      }
    };

    loadStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, view, token]);

  // When returning to the tab, silently refresh student details (latest enrollments / approvals)
  useEffect(() => {
    if (!token || !params.id || view !== "details") return;

    const silentRefetch = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastVisibilityRefetchAt.current < 2500) return;
      lastVisibilityRefetchAt.current = now;
      apiFetch(`/api/v1/admin/students/${params.id}`, { token })
        .then((res) => {
          if (res?.ok) setSelectedStudent(res.data);
        })
        .catch(() => {});
    };

    document.addEventListener("visibilitychange", silentRefetch);
    window.addEventListener("focus", silentRefetch);
    return () => {
      document.removeEventListener("visibilitychange", silentRefetch);
      window.removeEventListener("focus", silentRefetch);
    };
  }, [token, params.id, view]);

  // Filter students
  useEffect(() => {
    let result = students;

    // Global search (bounded length so pathological paste does not freeze the UI)
    const q = searchQuery.trim().toLowerCase().slice(0, QUICK_SEARCH_MAX);
    if (q) {
      result = result.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
          s.college?.toLowerCase().includes(q) ||
          (s.id && String(s.id).toLowerCase().includes(q))
      );
    }

    // Individual filters
    const fn = filters.name.trim().toLowerCase();
    if (fn) result = result.filter((s) => s.full_name?.toLowerCase().includes(fn));

    const fe = filters.email.trim().toLowerCase();
    if (fe) result = result.filter((s) => s.email?.toLowerCase().includes(fe));

    const fp = filters.phone.trim();
    if (fp) result = result.filter((s) => s.phone?.includes(fp));

    const fc = filters.college.trim().toLowerCase();
    if (fc) result = result.filter((s) => s.college?.toLowerCase().includes(fc));

    const fuid = filters.userId.trim().toLowerCase();
    if (fuid) result = result.filter((s) => s.id && String(s.id).toLowerCase().includes(fuid));

    let fromD = filters.dateFrom ? new Date(filters.dateFrom) : null;
    let toD = filters.dateTo ? new Date(filters.dateTo) : null;
    if (fromD && toD && fromD.getTime() > toD.getTime()) {
      const swap = fromD;
      fromD = toD;
      toD = swap;
    }
    if (fromD) {
      fromD.setHours(0, 0, 0, 0);
      result = result.filter((s) => new Date(s.created_at) >= fromD);
    }
    if (toD) {
      toD.setHours(23, 59, 59, 999);
      result = result.filter((s) => new Date(s.created_at) <= toD);
    }

    setFilteredStudents(result);
    setCurrentPage(1);
  }, [searchQuery, students, filters]);

  // Generate secure random password
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    // Ensure at least one uppercase, one lowercase, one number, one special char
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    // Shuffle the password
    return password.split("").sort(() => Math.random() - 0.5).join("");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleAddStudent = async () => {
    if (!addForm.email || !addForm.fullName) {
      alert("Email and Name are required");
      return;
    }

    const enrollment = (addForm.enrollmentItem || "").trim();
    const useApprovalFlow = enrollment.startsWith("course:") || enrollment.startsWith("pack:");

    if (useApprovalFlow) {
      if (!addForm.phone?.trim()) {
        alert("Phone is required when assigning a course or pack (used on the Approvals page).");
        return;
      }
      const itemId = enrollment.startsWith("course:") ? enrollment.slice(7).trim() : enrollment.slice(5).trim();
      if (!UUID_RE.test(itemId)) {
        alert("Invalid course or pack selection.");
        return;
      }
    } else if (!addForm.generatePassword && (!addForm.password || addForm.password.length < 8)) {
      alert("Password must be at least 8 characters, or enable auto-generate.");
      return;
    }

    try {
      setSaving(true);

      if (useApprovalFlow) {
        const itemType = enrollment.startsWith("course:") ? "course" : "pack";
        const itemId = enrollment.startsWith("course:") ? enrollment.slice(7).trim() : enrollment.slice(5).trim();

        const res = await apiFetch("/api/v1/admin/approvals", {
          method: "POST",
          token,
          body: {
            fullName: addForm.fullName,
            email: addForm.email,
            phone: addForm.phone.trim(),
            college: addForm.college?.trim() || undefined,
            itemType,
            itemId,
          },
        });

        if (res?.ok) {
          await reloadStudentsList();
          setAddForm({
            fullName: "",
            email: "",
            phone: "",
            college: "",
            enrollmentItem: "",
            password: "",
            generatePassword: true,
          });
          if (window.confirm("Request submitted for approval. The student account is created when you approve it on the Approvals page. Open Approvals now?")) {
            navigate("/lms/superadmin/approvals");
          }
        }
      } else {
        const password = addForm.generatePassword ? generatePassword() : addForm.password;

        const res = await apiFetch("/api/v1/admin/students", {
          method: "POST",
          token,
          body: {
            fullName: addForm.fullName,
            email: addForm.email,
            phone: addForm.phone || undefined,
            password: password || undefined,
          },
        });

        if (res?.ok) {
          setStudentCredentials({
            email: addForm.email,
            password: password,
            name: addForm.fullName,
            isReset: false,
          });
          setShowCredentialsModal(true);

          await reloadStudentsList();
          setAddForm({
            fullName: "",
            email: "",
            phone: "",
            college: "",
            enrollmentItem: "",
            password: "",
            generatePassword: true,
          });
        }
      }
    } catch (error) {
      alert(error?.message || "Failed to add student");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (studentId, email) => {
    if (!confirm(`Reset password for ${email}? A new password will be generated.`)) return;

    try {
      setResettingPassword(true);
      const newPassword = generatePassword();
      
      // Update student with new password
      const res = await apiFetch(`/api/v1/admin/students/${studentId}`, {
        method: "PATCH",
        token,
        body: { password: newPassword },
      });

      if (res?.ok) {
        setStudentCredentials({
          email: email,
          password: newPassword,
          name: selectedStudent?.full_name || email,
          isReset: true,
        });
        setShowCredentialsModal(true);
        setResettingPassword(false);
      }
    } catch (error) {
      alert(error?.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;

    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const res = await apiFetch(`/api/v1/admin/students/${selectedStudent.id}`, {
        method: "PATCH",
        token,
        body: editForm,
      });

      if (res?.ok) {
        await reloadStudentsList();
        navigate("/lms/superadmin/students/list");
        setSelectedStudent(null);
      }
    } catch (error) {
      alert(error?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm("Are you sure you want to remove this student?")) return;

    try {
      const deletedStudent = students.find((s) => String(s.id) === String(studentId)) || selectedStudent;
      const res = await apiFetch(`/api/v1/admin/students/${studentId}`, {
        method: "DELETE",
        token: token ?? localStorage.getItem("token"),
      });

      if (res?.ok) {
        if (deletedStudent?.email) await reloadUndoStudents();
        const wasViewingDeleted = selectedStudent?.id === studentId;
        if (wasViewingDeleted) {
          setSelectedStudent(null);
          if (view === "details") {
            navigate("/lms/superadmin/students/list");
          }
        }
        await reloadStudentsList();
      }
    } catch (error) {
      alert(error?.message || "Failed to delete student. Ensure the API server is running.");
    }
  };

  const handleRestoreDeletedStudent = async (student) => {
    if (!student?.user_id || restoringStudentEmail) return;

    const showStudentInListNow = async () => {
      const json = await apiFetch("/api/v1/admin/students", { token });
      const list = Array.isArray(json?.data) ? json.data : [];
      setStudents(list);
      setSearchQuery("");
      setFilters({
        name: "",
        email: "",
        phone: "",
        college: "",
        userId: "",
        dateFrom: "",
        dateTo: "",
        enrolledItem: "",
      });
      setCurrentPage(1);
      setShowFilters(false);
      navigate("/lms/superadmin/students/list");
      return list;
    };

    try {
      setRestoringStudentEmail(student.email || student.user_id);
      const res = await apiFetch(`/api/v1/admin/students/${student.user_id}/restore`, {
        method: "POST",
        token,
      });
      if (res?.ok) {
        await showStudentInListNow();
        await reloadUndoStudents();
      } else {
        alert(res?.error?.message || res?.error || res?.message || "Could not undo removal.");
      }
    } catch (error) {
      alert(error?.message || "Could not undo removal.");
    } finally {
      setRestoringStudentEmail(null);
    }
  };

  const openEdit = (student) => {
    setSelectedStudent(student);
    setEditForm({
      fullName: student.full_name || "",
      email: student.email || "",
      phone: student.phone || "",
    });
    navigate(`/lms/superadmin/students/${student.id}/edit`);
  };

  const openDetails = (student) => {
    navigate(`/lms/superadmin/students/${student.id}/details`);
  };

  // Credentials Modal Component
  const CredentialsModal = () => {
    if (!showCredentialsModal || !studentCredentials) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-md p-8 border border-slate-200 shadow-2xl max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <FiCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {studentCredentials.isReset ? "Password Reset Successfully!" : "Student Created Successfully!"}
            </h2>
            <p className="text-slate-600">Save these credentials securely</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 rounded-md p-4 border-2 border-slate-200">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Student Name</label>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-slate-900">{studentCredentials.name}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-md p-4 border-2 border-blue-200">
              <label className="block text-xs font-semibold text-blue-600 mb-1">Email</label>
              <div className="flex items-center justify-between">
                <p className="text-lg font-mono font-bold text-blue-900">{studentCredentials.email}</p>
                <button
                  onClick={() => copyToClipboard(studentCredentials.email)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Copy email"
                >
                  <FiCopy className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="bg-amber-50 rounded-md p-4 border-2 border-amber-200">
              <label className="block text-xs font-semibold text-amber-600 mb-1">Password</label>
              <div className="flex items-center justify-between">
                <p className="text-lg font-mono font-bold text-amber-900">{studentCredentials.password}</p>
                <button
                  onClick={() => copyToClipboard(studentCredentials.password)}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                  title="Copy password"
                >
                  <FiCopy className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-sm text-yellow-800 flex items-start gap-2">
              <FiLock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Important:</strong> This password will not be shown again. Please copy it now and share it securely with the student.
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCredentialsModal(false);
                setStudentCredentials(null);
                if (!studentCredentials.isReset) {
                  navigate("/lms/superadmin/students/list");
                }
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Done
            </button>
            <button
              onClick={() => {
                const credentials = `Student Login Credentials\n\nName: ${studentCredentials.name}\nEmail: ${studentCredentials.email}\nPassword: ${studentCredentials.password}\n\nPlease keep this information secure.`;
                copyToClipboard(credentials);
              }}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <FiCopy className="w-4 h-4" />
              Copy All
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Cards View
  if (view === "cards") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-8"
            >
              Students Management
            </motion.h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* All Students Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => navigate("/lms/superadmin/students/list")}
                className="bg-white rounded-md p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <FiUsers className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">
                      {loading ? "..." : students.length}
                    </div>
                    <div className="text-sm text-slate-600">Total Students</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">All Students</h3>
                <p className="text-slate-600">View and manage all registered students</p>
              </motion.div>

              {/* Add Student Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => {
                  setAddForm({ fullName: "", email: "", phone: "", password: "", generatePassword: true });
                  navigate("/lms/superadmin/students/create");
                }}
                className="bg-white rounded-md p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <FiUserPlus className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Add Student</h3>
                <p className="text-slate-600">Register a new student to the platform</p>
              </motion.div>
            </div>
          </div>
        </div>
        <CredentialsModal />
      </>
    );
  }

  // List View
  if (view === "list") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <button
                onClick={() => navigate("/lms/superadmin/students/cards")}
                className="text-slate-600 hover:text-slate-900 mb-2 flex items-center gap-2"
              >
                <FiX className="w-4 h-4 rotate-45" />
                <span>Back</span>
              </button>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                All Students ({filteredStudents.length})
              </h1>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/lms/superadmin/students/list")}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs sm:text-sm font-medium"
                >
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  disabled={loading}
                  title="Download student details as CSV (uses current filters)"
                  className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  <FiDownload className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Download ({filteredStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/lms/superadmin/students/undo")}
                  className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50"
                >
                  Undo Students ({deletedStudents.length})
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setAddForm({ fullName: "", email: "", phone: "", password: "", generatePassword: true });
                navigate("/lms/superadmin/students/create");
              }}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <FiUserPlus className="w-5 h-5" />
              Add Student
            </button>
          </div>

          {/* Search + Filter Toggle */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Quick search by name, email, phone, college, user ID…"
                  value={searchQuery}
                  maxLength={QUICK_SEARCH_MAX}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`flex items-center gap-2 px-5 py-3 rounded-md border font-medium transition-all whitespace-nowrap ${
                  showFilters || activeFilterCount > 0
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-3 flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
              <div className="w-full lg:max-w-md shrink-0">
                <label
                  htmlFor="student-list-enrollment-filter"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Only students in this course or pack
                </label>
                <EnrollmentCoursePackSelect
                  id="student-list-enrollment-filter"
                  value={filters.enrolledItem}
                  onChange={(v) => setFilters((f) => ({ ...f, enrolledItem: v }))}
                  catalogOptions={catalogOptions}
                  selectClassName="bg-white"
                />
              </div>
              <p className="text-xs text-slate-500 lg:pb-2 lg:flex-1">
                Pick a <strong>course</strong> to see everyone with that product (single-course or through a bundle), or
                a <strong>pack</strong> for that bundle only. Matches active enrollments.
              </p>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">Advanced Filters</h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <FiX className="w-3 h-3" />
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* User ID */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">User ID</label>
                        <div className="relative">
                          <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter by user ID"
                            value={filters.userId}
                            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono text-xs"
                          />
                        </div>
                      </div>
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter by name"
                            value={filters.name}
                            onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                        <div className="relative">
                          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter by email"
                            value={filters.email}
                            onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
                        <div className="relative">
                          <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            placeholder="Filter by phone"
                            value={filters.phone}
                            onChange={(e) => setFilters((f) => ({ ...f, phone: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      {/* College */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">College</label>
                        <div className="relative">
                          <FiBook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter by college"
                            value={filters.college}
                            onChange={(e) => setFilters((f) => ({ ...f, college: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      {/* Course / pack (same control as toolbar; server-side enrollment filter) */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5" htmlFor="student-adv-enrollment-filter">
                          Only students in this course or pack
                        </label>
                        <EnrollmentCoursePackSelect
                          id="student-adv-enrollment-filter"
                          value={filters.enrolledItem}
                          onChange={(v) => setFilters((f) => ({ ...f, enrolledItem: v }))}
                          catalogOptions={catalogOptions}
                          selectClassName="bg-slate-50"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          Same as the dropdown above the list. Inactive enrollments are excluded.
                        </p>
                      </div>
                      {/* Date From */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Joined From</label>
                        <div className="relative">
                          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      {/* Date To */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Joined To</label>
                        <div className="relative">
                          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {studentsListError && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex flex-wrap items-center justify-between gap-3"
              role="alert"
            >
              <span className="min-w-0">{studentsListError}</span>
              <button
                type="button"
                onClick={() => reloadStudentsList()}
                className="shrink-0 font-semibold text-red-900 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Students Grid */}
          {(() => {
            const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
            const safePage = Math.min(currentPage, totalPages);
            const paginatedStudents = filteredStudents.slice((safePage - 1) * pageSize, safePage * pageSize);
            const startIdx = (safePage - 1) * pageSize + 1;
            const endIdx = Math.min(safePage * pageSize, filteredStudents.length);

            const getPageNumbers = () => {
              const pages = [];
              const maxVisible = 5;
              let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
              let end = Math.min(totalPages, start + maxVisible - 1);
              if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              return pages;
            };

            return loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-200 rounded-full shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 w-56 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-9 w-20 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
                <FiUsers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No students found</h3>
                <p className="text-slate-600">
                  {searchQuery || activeFilterCount > 0 ? "Try different filters" : "Get started by adding your first student"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 sm:w-12 text-xs sm:text-sm font-semibold text-slate-400 tabular-nums flex-shrink-0">
                          {filteredStudents.length - ((safePage - 1) * pageSize + index)}.
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {student.full_name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-slate-900 font-medium truncate">{student.full_name || "Unnamed Student"}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              student.is_active ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
                            }`}>
                              {student.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <FiMail className="w-4 h-4 shrink-0" />
                              <span className="truncate">{student.email}</span>
                            </span>
                            {student.phone && (
                              <span className="flex items-center gap-1.5">
                                <FiPhone className="w-4 h-4 shrink-0" />
                                {student.phone}
                              </span>
                            )}
                            {student.college && (
                              <span className="text-slate-400 truncate">{student.college}</span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs flex items-center gap-2 flex-wrap">
                            <span>ID: <code className="font-mono text-slate-500">{String(student.id).slice(0, 8)}…</code></span>
                            <span>Joined {new Date(student.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openDetails(student)}
                          className="px-4 py-2 bg-slate-50 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 text-sm"
                        >
                          <FiEye className="w-4 h-4" />
                          Details
                        </button>
                        <button
                          onClick={() => openEdit(student)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {filteredStudents.length > PAGE_SIZES[0] && (
                  <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span>Showing <strong>{startIdx}–{endIdx}</strong> of <strong>{filteredStudents.length}</strong></span>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Per page</span>
                        <select
                          value={pageSize}
                          onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                          className="border border-slate-200 rounded-md px-2 py-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        >
                          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setCurrentPage(1)} disabled={safePage <= 1}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="First">
                        <FiChevronsLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Previous">
                        <FiChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      {getPageNumbers().map((p) => (
                        <button key={p} onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            p === safePage ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >{p}</button>
                      ))}
                      <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Next">
                        <FiChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Last">
                        <FiChevronsRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        </div>
        <AnimatePresence>
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowExportModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.15 }}
                role="dialog"
                aria-labelledby="student-export-title"
                className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
                  <div>
                    <h2 id="student-export-title" className="text-lg font-semibold text-slate-900">
                      Download student data
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Exports a structured CSV for students matching your current filters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-700">
                      <strong>{filteredStudents.length}</strong> student
                      {filteredStudents.length === 1 ? "" : "s"} will be included in this file.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Use quick search, advanced filters, course/pack enrollment, and joined dates above the list to narrow the export.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Active filters
                    </h3>
                    {exportFilterSummary.length === 0 ? (
                      <p className="text-sm text-slate-600">No filters — all students currently loaded from the server.</p>
                    ) : (
                      <ul className="text-sm text-slate-700 space-y-1.5 max-h-40 overflow-y-auto">
                        {exportFilterSummary.map((row) => (
                          <li key={row.key} className="flex gap-2">
                            <span className="font-medium text-slate-500 shrink-0">{row.key}:</span>
                            <span className="min-w-0 break-words">{row.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    Columns: name, email, phone, college, user ID, status, role, joined date — plus export metadata at the top of the file.
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadStudents}
                    disabled={filteredStudents.length === 0 || loading}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    <FiDownload className="w-4 h-4 shrink-0" aria-hidden />
                    Download CSV
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CredentialsModal />
      </>
    );
  }

  // Undo Students View
  if (view === "undo") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <button
                  onClick={() => navigate("/lms/superadmin/students/list")}
                  className="text-slate-600 hover:text-slate-900 mb-2 flex items-center gap-2"
                >
                  <FiX className="w-4 h-4 rotate-45" />
                  <span>Back</span>
                </button>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                  Undo Students ({deletedStudents.length})
                </h1>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/lms/superadmin/students/list")}
                    className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50"
                  >
                    Students
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/lms/superadmin/students/undo")}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs sm:text-sm font-medium"
                  >
                    Undo Students ({deletedStudents.length})
                  </button>
                </div>
              </div>
            </div>

            {deletedStudents.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
                <FiUsers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No removed students yet</h3>
                <p className="text-slate-600">When you remove students, they appear here for restore.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deletedStudents.map((student, index) => (
                  <motion.div
                    key={`${student.email}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-slate-900 font-medium truncate">
                          {student.full_name || "Unnamed Student"}
                        </span>
                        {student.status === "restored" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-800 border-emerald-200">
                            Restored
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-100 text-amber-800 border-amber-200">
                            Removed
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <FiMail className="w-4 h-4 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </span>
                        {student.phone && (
                          <span className="flex items-center gap-1.5">
                            <FiPhone className="w-4 h-4 shrink-0" />
                            {student.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">
                        {student.status === "restored"
                          ? `Restored ${student.restored_at ? new Date(student.restored_at).toLocaleString() : "just now"}`
                          : `Removed ${student.deleted_at ? new Date(student.deleted_at).toLocaleString() : "just now"}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreDeletedStudent(student)}
                      disabled={restoringStudentEmail === student.email || student.status === "restored"}
                      className="shrink-0 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      {student.status === "restored"
                        ? "Restored"
                        : restoringStudentEmail === student.email
                          ? "Restoring..."
                          : "Restore"}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        <CredentialsModal />
      </>
    );
  }

  // Add Student View
  if (view === "add") {
    const enrollmentRaw = (addForm.enrollmentItem || "").trim();
    const approvalMode = enrollmentRaw.startsWith("course:") || enrollmentRaw.startsWith("pack:");
    const enrollmentId =
      enrollmentRaw.startsWith("course:") ? enrollmentRaw.slice(7).trim() : enrollmentRaw.startsWith("pack:") ? enrollmentRaw.slice(5).trim() : "";
    const enrollmentValid = UUID_RE.test(enrollmentId);
    const addDisabled =
      saving ||
      !addForm.email ||
      !addForm.fullName ||
      (approvalMode
        ? !addForm.phone?.trim() || !enrollmentValid
        : !addForm.generatePassword && (!addForm.password || addForm.password.length < 8));

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-md p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Add New Student</h2>
              <button
                onClick={() => navigate("/lms/superadmin/students/list")}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50/90 text-sm text-amber-950">
              <p className="font-medium text-amber-900 mb-1">Course or pack</p>
              <p className="text-amber-900/90 leading-relaxed">
                Choose a course or pack to send this signup to <strong>Payment Approvals</strong> (pending). The student
                account and LMS access are created when you approve the row—same flow as after a paid checkout.
                Leave the selector empty to create an account immediately with a password (no catalog access until you
                enroll them elsewhere).
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    placeholder="Enter student name"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Phone Number
                  {approvalMode ? <span className="text-red-500"> *</span> : null}
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder={approvalMode ? "Required for approvals" : "Enter phone number"}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">College (optional)</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={addForm.college}
                    onChange={(e) => setAddForm({ ...addForm, college: e.target.value })}
                    placeholder="Institution name"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Course or pack</label>
                <EnrollmentCoursePackSelect
                  id="add-student-enrollment"
                  value={addForm.enrollmentItem}
                  onChange={(v) => setAddForm({ ...addForm, enrollmentItem: v })}
                  catalogOptions={catalogOptions}
                  emptyLabel={catalogHydrated ? "None — create account only (no approval queue)" : "Loading catalog…"}
                  disabled={!catalogHydrated}
                  ariaLabel="Course or pack for student access"
                  selectClassName="bg-slate-50 py-3 text-base"
                />
              </div>

              {!approvalMode ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Password
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.generatePassword}
                        onChange={(e) => setAddForm({ ...addForm, generatePassword: e.target.checked, password: "" })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Auto-generate secure password</span>
                    </label>
                  </div>
                  {!addForm.generatePassword ? (
                    <div className="relative">
                      <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={addForm.password}
                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                        placeholder="Enter custom password (min 8 characters)"
                        minLength={8}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <FiLock className="w-4 h-4" />
                        A secure password will be automatically generated
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-600">
                  <FiAlertCircle className="inline w-4 h-4 mr-1.5 text-amber-600 align-text-bottom" />
                  No password is set yet. After you approve this request, the student can use{" "}
                  <strong>Forgot password</strong> on the login page (or reset from student details).
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={handleAddStudent}
                  disabled={addDisabled}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <ButtonLoading text={approvalMode ? "Submitting…" : "Adding…"} size="sm" />
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      {approvalMode ? "Submit for approval" : "Add Student"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate("/lms/superadmin/students/list")}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
        <CredentialsModal />
      </>
    );
  }

  // Edit Student View
  if (view === "edit") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-md p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Student</h2>
              <button
                onClick={() => navigate("/lms/superadmin/students/list")}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="Enter student name"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={handleEditStudent}
                  disabled={saving || !editForm.email || !editForm.fullName}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <ButtonLoading text="Saving..." size="sm" />
                  ) : (
                    <>
                      <FiSave className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate("/lms/superadmin/students/list")}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-md hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
        <CredentialsModal />
      </>
    );
  }

  const detailsDataMismatch =
    view === "details" && params.id && (!selectedStudent || String(selectedStudent.id) !== String(params.id));

  if (detailsDataMismatch) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col items-center justify-center p-8 gap-3">
          <PageLoading />
          <p className="text-sm text-slate-500">Loading student…</p>
        </div>
        <CredentialsModal />
      </>
    );
  }

  // Student Details View
  if (view === "details" && selectedStudent) {
    const student = selectedStudent;
    const progress = student.progress || {};
    const overallPercent = progress.progress_percent ?? 0;
    const enrolledLessonTotal = progress.total_lessons ?? 0;
    const enrolledLessonCompleted =
      progress.enrolled_completed_lessons ?? progress.completed_lessons ?? 0;
    const allTimeCompleted = progress.completed_lessons ?? 0;
    const streakDays = student.streak_days || 0;
    const totalProjects = student.total_projects || 0;
    const enrollments = Array.isArray(student.enrollments) ? student.enrollments : [];
    const paidPurchases = Array.isArray(student.paid_purchases) ? student.paid_purchases : [];
    const purchaseApprovals = Array.isArray(student.purchase_approvals) ? student.purchase_approvals : [];
    const formatMoney = (amount, currency) => {
      if (amount == null) return "—";
      const cur = (currency || "INR").toUpperCase();
      const major = Number(amount) / 100;
      try {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(major);
      } catch {
        return `${cur} ${major.toFixed(2)}`;
      }
    };
    const typeLabel = (t) => (t === "pack" ? "All courses pack" : "Single course");

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-md p-4 sm:p-6 lg:p-8 border border-slate-200 shadow-lg">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl flex-shrink-0">
                  {student.full_name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                    {student.full_name || "Unnamed Student"}
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base truncate">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => refetchStudentDetail()}
                  disabled={detailRefreshBusy}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  title="Refresh from server"
                >
                  <FiRefreshCw className={`w-5 h-5 text-slate-600 ${detailRefreshBusy ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/lms/superadmin/students/list")}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Close"
                >
                  <FiX className="w-6 h-6 text-slate-600" />
                </button>
              </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <FiTrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-700">Streak</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600">{streakDays}</div>
                <div className="text-xs text-slate-600 mt-1">Days active</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-md p-6 border border-emerald-100">
                <div className="flex items-center gap-3 mb-2">
                  <FiTrendingUp className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-700">Course completion</h3>
                </div>
                <div className="text-3xl font-bold text-emerald-600">{overallPercent}%</div>
                <div className="text-xs text-slate-600 mt-1">
                  {enrolledLessonTotal > 0
                    ? `${enrolledLessonCompleted}/${enrolledLessonTotal} lessons across enrolled courses`
                    : "No enrolled course lessons yet"}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-md p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-2">
                  <FiBriefcase className="w-6 h-6 text-purple-600" />
                  <h3 className="text-sm font-semibold text-slate-700">Projects</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600">{totalProjects}</div>
                <div className="text-xs text-slate-600 mt-1">Active projects</div>
              </div>
              </div>

              {/* Overall learning completion */}
              <div className="mb-8 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Overall learning completion</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Based on published lessons in courses this student is enrolled in (including courses inside packs).
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600 tabular-nums">{overallPercent}%</div>
                    <div className="text-xs text-slate-500">
                      {progress.enrolled_courses_count ?? 0} course
                      {(progress.enrolled_courses_count ?? 0) === 1 ? "" : "s"} tracked
                    </div>
                  </div>
                </div>
                <StudentProgressMeter
                  percent={overallPercent}
                  completed={enrolledLessonCompleted}
                  total={enrolledLessonTotal}
                />
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="rounded-lg bg-white/80 border border-slate-100 px-3 py-2">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">{enrolledLessonCompleted}</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Enrolled done</div>
                  </div>
                  <div className="rounded-lg bg-white/80 border border-slate-100 px-3 py-2">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">{allTimeCompleted}</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">All-time completed</div>
                  </div>
                  <div className="rounded-lg bg-white/80 border border-slate-100 px-3 py-2">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">
                      {progress.in_progress_lessons || 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">In progress</div>
                  </div>
                  <div className="rounded-lg bg-white/80 border border-slate-100 px-3 py-2">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">
                      {Math.max(0, enrolledLessonTotal - enrolledLessonCompleted)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Remaining</div>
                  </div>
                  <div className="rounded-lg bg-white/80 border border-slate-100 px-3 py-2">
                    <div className="text-lg font-bold text-slate-900 tabular-nums">
                      {Math.floor((progress.total_watch_seconds || 0) / 60)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Watch min</div>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">User ID</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 font-mono truncate">{student.id}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(student.id)}
                        className="p-1.5 rounded-md hover:bg-slate-200 transition-colors shrink-0"
                        title="Copy user ID"
                      >
                        <FiCopy className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Full Name</div>
                    <div className="text-sm font-medium text-slate-900">
                      {student.full_name || "Not provided"}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Email</div>
                    <div className="text-sm font-medium text-slate-900">{student.email}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Phone Number</div>
                    <div className="text-sm font-medium text-slate-900">
                      {student.phone || "Not provided"}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">College</div>
                    <div className="text-sm font-medium text-slate-900">
                      {student.college || "Not provided"}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Status</div>
                    <div className="text-sm font-medium">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          student.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Joined Date</div>
                    <div className="text-sm font-medium text-slate-900">
                      {new Date(student.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses & packs (enrollment + paid orders) */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FiBook className="w-5 h-5 text-indigo-600" />
                  Courses and purchases
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  <strong>Current access</strong> comes from enrollments (manual or after payment).{" "}
                  <strong>Paid checkout</strong> includes Razorpay orders linked by checkout email or by an approval
                  record tied to this account (covers email changes after purchase).{" "}
                  <strong>Approvals</strong> show pending access (paid, waiting on auto-approve or you), approved, or rejected flows.
                </p>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Current access</h4>
                  {enrollments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      No enrollments yet. If checkout used a different email, check <strong>Paid checkout</strong> and{" "}
                      <strong>Approvals</strong> below. Grant access from Approvals when pending.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {enrollments.map((row, idx) => (
                        <li
                          key={`${row.item_type}-${row.item_id}-${idx}`}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{row.item_title}</div>
                              <div className="text-xs text-slate-500">
                                {typeLabel(row.item_type)}
                                {row.item_slug ? ` · ${row.item_slug}` : ""}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full tabular-nums ${
                                  (row.progress_percent ?? 0) >= 100
                                    ? "bg-emerald-100 text-emerald-800"
                                    : (row.progress_percent ?? 0) > 0
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {row.progress_percent ?? 0}%
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  row.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {row.active ? "Active" : "Inactive"}
                              </span>
                              {row.created_at && (
                                <span className="text-xs text-slate-500">
                                  From {new Date(row.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3">
                            <StudentProgressMeter
                              percent={row.progress_percent ?? 0}
                              completed={row.completed_lessons ?? 0}
                              total={row.total_lessons ?? 0}
                              compact
                            />
                          </div>
                          {row.item_type === "pack" &&
                            Array.isArray(row.course_progress) &&
                            row.course_progress.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              <div className="text-xs font-semibold text-slate-500">Per course in pack</div>
                              {row.course_progress.map((c) => (
                                <div
                                  key={`${row.item_id}-${c.course_id || c.slug}`}
                                  className="rounded-lg bg-slate-50/80 border border-slate-100 px-3 py-2"
                                >
                                  <div className="text-sm font-medium text-slate-800 mb-1 truncate">
                                    {c.title}
                                    {c.slug ? (
                                      <span className="text-slate-400 font-normal"> · {c.slug}</span>
                                    ) : null}
                                  </div>
                                  <StudentProgressMeter
                                    percent={c.progress_percent ?? 0}
                                    completed={c.completed_lessons ?? 0}
                                    total={c.total_lessons ?? 0}
                                    compact
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Purchase / approval timeline</h4>
                  {purchaseApprovals.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      No approval rows for this email or user id (students created only in admin, with no checkout, look
                      normal here).
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {purchaseApprovals.map((row) => {
                        const statusClass =
                          row.status === "pending"
                            ? "bg-amber-100 text-amber-900"
                            : row.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800";
                        return (
                          <li
                            key={row.id}
                            className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
                                  {row.status === "pending"
                                    ? "Pending approval"
                                    : row.status === "approved"
                                      ? "Approved"
                                      : "Rejected"}
                                </span>
                                {row.payment_order_status && row.payment_order_status !== "paid" && (
                                  <span className="text-xs text-slate-500">Payment: {row.payment_order_status}</span>
                                )}
                              </div>
                              <div className="font-medium text-slate-900 truncate">{row.item_title}</div>
                              <div className="text-xs text-slate-500">
                                {typeLabel(row.item_type)}
                                {row.item_slug ? ` · ${row.item_slug}` : ""}
                              </div>
                              {row.checkout_email && (
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <FiMail className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">Checkout: {row.checkout_email}</span>
                                </div>
                              )}
                              {row.status === "rejected" && row.notes && (
                                <div className="text-xs text-red-700 mt-2 flex items-start gap-1">
                                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{row.notes}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0 text-xs text-slate-500 space-y-1">
                              {row.amount != null && (
                                <div className="text-sm font-semibold text-slate-900">
                                  {formatMoney(row.amount, row.currency)}
                                </div>
                              )}
                              <div>Created {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</div>
                              {row.approved_at && (
                                <div>Decided {new Date(row.approved_at).toLocaleString()}</div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Paid checkout history</h4>
                  {paidPurchases.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      No paid orders linked to this profile (try matching checkout email, or approvals above). Free or
                      admin-granted access can still appear under Current access.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {paidPurchases.map((row) => (
                        <li
                          key={row.payment_order_id || `paid-${row.item_type}-${row.item_id}-${row.paid_at}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{row.item_title}</div>
                            <div className="text-xs text-slate-500">
                              {typeLabel(row.item_type)}
                              {row.item_slug ? ` · ${row.item_slug}` : ""}
                            </div>
                            {row.checkout_email && (
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <FiMail className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{row.checkout_email}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-slate-900">
                              {formatMoney(row.amount, row.currency)}
                            </div>
                            {row.paid_at && (
                              <div className="text-xs text-slate-500">{new Date(row.paid_at).toLocaleString()}</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Per-enrollment completion breakdown */}
              {enrollments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Completion by enrollment</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Progress</th>
                          <th className="px-4 py-3 text-right">%</th>
                          <th className="px-4 py-3 text-right">Lessons</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {enrollments.map((row, idx) => (
                          <tr key={`${row.item_type}-${row.item_id}-${idx}`} className="bg-white">
                            <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                              {row.item_title}
                            </td>
                            <td className="px-4 py-3 text-slate-600 capitalize">{row.item_type}</td>
                            <td className="px-4 py-3 min-w-[140px]">
                              <StudentProgressMeter
                                percent={row.progress_percent ?? 0}
                                completed={row.completed_lessons ?? 0}
                                total={row.total_lessons ?? 0}
                                compact
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                              {row.progress_percent ?? 0}%
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                              {row.completed_lessons ?? 0}/{row.total_lessons ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {enrollments.some((r) => r.item_type === "pack" && r.course_progress?.length > 0) && (
                    <div className="mt-4 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800">Pack courses (detail)</h4>
                      {enrollments
                        .filter((r) => r.item_type === "pack" && r.course_progress?.length > 0)
                        .map((pack) => (
                          <div key={pack.item_id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                            <div className="text-sm font-medium text-slate-900 mb-3">{pack.item_title}</div>
                            <ul className="space-y-2">
                              {pack.course_progress.map((c) => (
                                <li
                                  key={`${pack.item_id}-${c.course_id}`}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white rounded-lg border border-slate-100 px-3 py-2"
                                >
                                  <span className="text-sm text-slate-800 sm:w-48 shrink-0 truncate">
                                    {c.title}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <StudentProgressMeter
                                      percent={c.progress_percent ?? 0}
                                      completed={c.completed_lessons ?? 0}
                                      total={c.total_lessons ?? 0}
                                      compact
                                    />
                                  </div>
                                  <span className="text-sm font-semibold tabular-nums text-slate-700 shrink-0">
                                    {c.progress_percent ?? 0}%
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => openEdit(selectedStudent)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                >
                  <FiEdit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Edit
                </button>
                <button
                  onClick={() => handleResetPassword(student.id, student.email)}
                  disabled={resettingPassword}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  {resettingPassword ? (
                    <ButtonLoading text="Resetting..." size="sm" />
                  ) : (
                    <>
                      <FiRefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                      Reset Password
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteStudent(selectedStudent.id)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-red-50 text-red-600 font-semibold rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 text-sm sm:text-base"
                >
                  <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Remove
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
        <CredentialsModal />
      </>
    );
  }

  return null;
}
