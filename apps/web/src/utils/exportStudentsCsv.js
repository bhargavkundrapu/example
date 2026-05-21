function escapeCsvCell(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells) {
  return cells.map(escapeCsvCell).join(",");
}

function formatJoinedDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function resolveEnrollmentFilterLabel(enrolledItem, catalogOptions = {}) {
  const v = (enrolledItem || "").trim();
  if (!v) return "";
  if (v.startsWith("course:")) {
    const id = v.slice(7).trim();
    const course = (catalogOptions.courses || []).find((c) => String(c.id) === id);
    return course ? `Course: ${course.title}` : `Course ID: ${id}`;
  }
  if (v.startsWith("pack:")) {
    const id = v.slice(5).trim();
    const pack = (catalogOptions.packs || []).find((p) => String(p.id) === id);
    return pack ? `Pack: ${pack.title}` : `Pack ID: ${id}`;
  }
  return v;
}

/** Human-readable summary of filters applied on the students list (for export UI / CSV metadata). */
export function buildStudentExportFilterSummary({ searchQuery = "", filters = {}, catalogOptions = {} }) {
  const rows = [];
  const q = searchQuery.trim();
  if (q) rows.push({ key: "Quick search", value: q });

  const f = filters;
  if (f.name?.trim()) rows.push({ key: "Name", value: f.name.trim() });
  if (f.email?.trim()) rows.push({ key: "Email", value: f.email.trim() });
  if (f.phone?.trim()) rows.push({ key: "Phone", value: f.phone.trim() });
  if (f.college?.trim()) rows.push({ key: "College", value: f.college.trim() });
  if (f.userId?.trim()) rows.push({ key: "User ID", value: f.userId.trim() });
  if (f.dateFrom) rows.push({ key: "Joined from", value: f.dateFrom });
  if (f.dateTo) rows.push({ key: "Joined to", value: f.dateTo });

  const enrollment = resolveEnrollmentFilterLabel(f.enrolledItem, catalogOptions);
  if (enrollment) rows.push({ key: "Enrollment", value: enrollment });

  return rows;
}

const DATA_HEADERS = [
  "S.No.",
  "Full Name",
  "Email",
  "Phone",
  "College",
  "User ID",
  "Status",
  "Role",
  "Joined Date",
];

function buildDataRows(students) {
  return students.map((s, index) =>
    csvRow([
      index + 1,
      s.full_name || "",
      s.email || "",
      s.phone || "",
      s.college || "",
      s.id || "",
      s.is_active === false ? "Inactive" : "Active",
      s.role_name || "Student",
      formatJoinedDate(s.created_at),
    ])
  );
}

/**
 * Builds a UTF-8 CSV string with optional filter metadata, then triggers download in the browser.
 */
export function downloadStudentsCsv(students, { filterSummary = [] } = {}) {
  const list = Array.isArray(students) ? students : [];
  const lines = [];

  lines.push(csvRow(["Field", "Value"]));
  lines.push(csvRow(["Export generated", new Date().toISOString()]));
  lines.push(csvRow(["Total students", list.length]));

  if (filterSummary.length > 0) {
    filterSummary.forEach(({ key, value }) => {
      lines.push(csvRow([key, value]));
    });
  } else {
    lines.push(csvRow(["Applied filters", "None (all loaded students)"]));
  }

  lines.push("");
  lines.push(csvRow(DATA_HEADERS));
  lines.push(...buildDataRows(list));

  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `expograph-students-${stamp}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
