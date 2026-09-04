export const ALLOWED_ASSIGNMENT_FILE_EXTENSIONS = {
  DOCUMENT: [".pdf", ".doc", ".docx"],
  PRESENTATION: [".ppt", ".pptx"],
  ARCHIVE: [".zip"],
  IMAGE: [".jpg", ".jpeg", ".png", ".webp"],
  // Source/plain-text files — needed for programming assignments (e.g.
  // "submit your .cpp file") where the answer itself is code, not a document.
  CODE: [
    ".txt", ".md",
    ".c", ".h", ".cpp", ".cc", ".cxx", ".hpp",
    ".py", ".java", ".js", ".ts", ".cs",
  ],
};

export const MAX_ASSIGNMENT_FILE_SIZE_MB = 50;

export const ALL_ALLOWED_ASSIGNMENT_EXTENSIONS = Object.values(
  ALLOWED_ASSIGNMENT_FILE_EXTENSIONS
).flat();

export const ASSIGNMENT_FILE_ACCEPT = ALL_ALLOWED_ASSIGNMENT_EXTENSIONS.join(",");

export function getAssignmentFileExtension(fileName) {
  const match = /\.[^.]+$/.exec(fileName || "");
  return match ? match[0].toLowerCase() : "";
}

export function isAllowedAssignmentFile(file) {
  const extension = getAssignmentFileExtension(file?.name);
  if (!ALL_ALLOWED_ASSIGNMENT_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      reason: `Unsupported file type '${extension || "unknown"}'. Allowed types: ${ALL_ALLOWED_ASSIGNMENT_EXTENSIONS.join(", ")}.`,
    };
  }
  if (file.size > MAX_ASSIGNMENT_FILE_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      reason: `File size must not exceed ${MAX_ASSIGNMENT_FILE_SIZE_MB}MB.`,
    };
  }
  return { valid: true, reason: null };
}
