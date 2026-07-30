const STUDENT_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Password",
  "Phone",
  "Gender",
];

const ENROLLMENT_HEADERS = ["Student Email"];
const ENROLLMENT_COURSE_HEADERS = ["Course Code", "Course Title"];

const ALLOWED_EXTENSIONS = [".csv", ".xlsx"];

const HEADER_ALIASES = {
  firstname: "First Name",
  lastname: "Last Name",
  email: "Email",
  password: "Password",
  phone: "Phone",
  phonenumber: "Phone",
  gender: "Gender",
  studentemail: "Student Email",
  coursecode: "Course Code",
  code: "Course Code",
  coursetitle: "Course Title",
  title: "Course Title",
};

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function headerKey(value) {
  return normalizeHeader(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function canonicalizeHeader(value, knownHeaders) {
  const normalized = normalizeHeader(value);
  const knownByKey = Object.fromEntries(
    knownHeaders.map((header) => [headerKey(header), header])
  );
  const key = headerKey(normalized);
  if (knownByKey[key]) return knownByKey[key];
  if (HEADER_ALIASES[key] && knownHeaders.includes(HEADER_ALIASES[key])) {
    return HEADER_ALIASES[key];
  }
  return normalized;
}

function getExtension(filename) {
  if (!filename || !filename.includes(".")) return "";
  return `.${filename.split(".").pop().toLowerCase()}`;
}

export function validateImportFile(file) {
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

  return { ok: true, extension };
}

export async function validateImportFileHeaders(
  file,
  requiredHeaders,
  { optionalHeaders = [], requireOneOf = [] } = {}
) {
  const basic = validateImportFile(file);
  if (!basic.ok) return basic;

  if (basic.extension !== ".csv") {
    return { ok: true, warning: null };
  }

  const knownHeaders = [...requiredHeaders, ...optionalHeaders, ...requireOneOf];
  const text = await file.text();
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const delimiter = detectDelimiter(firstLine);
  const headers = parseCsvLine(firstLine, delimiter).map((header) =>
    canonicalizeHeader(header, knownHeaders)
  );
  const present = new Set(headers.map(headerKey));
  const missing = requiredHeaders.filter((header) => !present.has(headerKey(header)));

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required column(s): ${missing.join(", ")}. Expected: ${requiredHeaders.join(", ")}. Found: ${headers.filter(Boolean).join(", ") || "(none)"}.`,
    };
  }

  if (requireOneOf.length > 0) {
    const hasOne = requireOneOf.some((header) => present.has(headerKey(header)));
    if (!hasOne) {
      return {
        ok: false,
        error: `Missing course column. Provide either ${requireOneOf.join(" or ")}. Found: ${headers.filter(Boolean).join(", ") || "(none)"}.`,
      };
    }
  }

  return { ok: true };
}

function detectDelimiter(line) {
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (semicolons > commas && semicolons >= tabs) return ";";
  if (tabs > commas && tabs >= semicolons) return "\t";
  return ",";
}

function parseCsvLine(line, delimiter = ",") {
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
    if (char === delimiter && !inQuotes) {
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
    type === "enrollments"
      ? ["Row", "Student Email", "Course Code", "Error"]
      : ["Row", "Email", "First Name", "Last Name", "Error"];

  const lines = [headers.join(",")];
  (errors || []).forEach((entry) => {
    const data = entry.data || {};
    const cells =
      type === "enrollments"
        ? [
            entry.row,
            data.student_email || "",
            data.course_code || "",
            entry.error || "",
          ]
        : [
            entry.row,
            data.email || "",
            data.first_name || "",
            data.last_name || "",
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
    optionalHeaders: [],
    requireOneOf: [],
    instructions: [
      "Download the sample template and keep the header row unchanged.",
      "Required columns: First Name, Last Name, Email, Password, Phone, Gender.",
      "Gender must be Male, Female, or Other.",
      "Phone is optional. Username is auto-generated from email.",
      "Valid rows will be imported even if some rows fail.",
    ],
  },
  teachers: {
    title: "Bulk Import Teachers",
    subtitle: "Upload a CSV or XLSX file to create multiple teacher accounts.",
    requiredHeaders: STUDENT_HEADERS,
    optionalHeaders: [],
    requireOneOf: [],
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
    optionalHeaders: ENROLLMENT_COURSE_HEADERS,
    requireOneOf: ENROLLMENT_COURSE_HEADERS,
    instructions: [
      "Download the sample template and keep the header row unchanged.",
      "Required: Student Email, plus Course Code or Course Title.",
      "Course Code is preferred (e.g. CS101). Course Title also works.",
      "Student must already exist and be Active.",
      "Course must be Published. Valid rows import even if some fail.",
    ],
  },
};
