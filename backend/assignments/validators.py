import os

from rest_framework import serializers

ALLOWED_ASSIGNMENT_FILE_EXTENSIONS = {
    "DOCUMENT": [".pdf", ".doc", ".docx"],
    "PRESENTATION": [".ppt", ".pptx"],
    "ARCHIVE": [".zip"],
    "IMAGE": [".jpg", ".jpeg", ".png", ".webp"],
    # Source/plain-text files — needed for programming assignments (e.g. "submit
    # your .cpp file") where the answer itself is code, not a document.
    "CODE": [
        ".txt", ".md",
        ".c", ".h", ".cpp", ".cc", ".cxx", ".hpp",
        ".py", ".java", ".js", ".ts", ".cs",
    ],
}

MAX_ASSIGNMENT_FILE_SIZE_MB = 50


def get_file_category(extension):
    for category, extensions in ALLOWED_ASSIGNMENT_FILE_EXTENSIONS.items():
        if extension in extensions:
            return category
    return None


def validate_assignment_file(value):
    if value.size > MAX_ASSIGNMENT_FILE_SIZE_MB * 1024 * 1024:
        raise serializers.ValidationError(
            f"File size must not exceed {MAX_ASSIGNMENT_FILE_SIZE_MB}MB."
        )

    extension = os.path.splitext(value.name)[1].lower()
    category = get_file_category(extension)
    if category is None:
        allowed = ", ".join(sorted({ext for exts in ALLOWED_ASSIGNMENT_FILE_EXTENSIONS.values() for ext in exts}))
        raise serializers.ValidationError(
            f"Unsupported file type '{extension}'. Allowed types: {allowed}."
        )

    return category
