const STUDENT_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Password",
  "Phone",
  "Gender",
];

const ENROLLMENT_HEADERS = ["Student Email", "Course Code"];

const ALLOWED_EXTENSIONS = [".csv", ".xlsx"];

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\s+/g, " ");
}

function getExtension(filename) {
  if (!filename || !filename.includes(".")) return "";
  return `.${filename.split(".").pop().toLowerCase()}`;
}

export function validateImportFile(file, requiredHeaders) {
  if (!file) {
    return { ok: false, error: "Please select a CSV or XLSX file." };
  }

  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { ok: false, error: "Only CSV and XLSX files are supported." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "File size must not exceed 5MB." };
  }

  return { ok: true, extension, requiredHeaders };
}

export async function validateImportFileHeaders(file, requiredHeaders) {
  const basic = validateImportFile(file, requiredHeaders);
  if (!basic.ok) return basic;

  if (basic.extension !== ".csv") {
    return { ok: true, warning: null };
  }

  const text = await file.text();
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const headers = parseCsvLine(firstLine).map(normalizeHeader);
  const missing = requiredHeaders.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required column(s): ${missing.join(", ")}. Expected: ${requiredHeaders.join(", ")}.`,
    };
  }

  return { ok: true };
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

export function buildErrorReportCsv(errors, type) {
  const headers =
    type === "students"
      ? ["Row", "Email", "First Name", "Last Name", "Error"]
      : ["Row", "Student Email", "Course Code", "Error"];

  const lines = [headers.join(",")];
  (errors || []).forEach((entry) => {
    const data = entry.data || {};
    const cells =
      type === "students"
        ? [
            entry.row,
            data.email || "",
            data.first_name || "",
            data.last_name || "",
            entry.error || "",
          ]
        : [
            entry.row,
            data.student_email || "",
            data.course_code || "",
            entry.error || "",
          ];
    lines.push(cells.map(escapeCsvCell).join(","));
  });

  return lines.join("\n");
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const BULK_IMPORT_CONFIG = {
  students: {
    title: "Bulk Import Students",
    subtitle: "Upload a CSV or XLSX file to create multiple student accounts.",
    requiredHeaders: STUDENT_HEADERS,
    instructions: [
      "Download the sample template and keep the header row unchanged.",
      "Required columns: First Name, Last Name, Email, Password, Phone, Gender.",
      "Gender must be Male, Female, or Other.",
      "Phone is optional. Username is auto-generated from email.",
      "Valid rows will be imported even if some rows fail.",
    ],
  },
  enrollments: {
    title: "Bulk Enrollment",
    subtitle: "Upload a CSV or XLSX file to enroll students into courses.",
    requiredHeaders: ENROLLMENT_HEADERS,
    instructions: [
      "Download the sample template and keep the header row unchanged.",
      "Required columns: Student Email, Course Code.",
      "Course Code must match the course slug (e.g. cs101).",
      "Student must already exist and be Active.",
      "Course must be Published. Valid rows import even if some fail.",
    ],
  },
};
