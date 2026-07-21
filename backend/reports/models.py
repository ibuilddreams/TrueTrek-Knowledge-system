from django.conf import settings
from django.db import models

from common.models import BaseModel


class GeneratedReport(BaseModel):
    class ReportType(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        TEACHER = "TEACHER", "Teacher"
        COURSE = "COURSE", "Course"
        ADMIN = "ADMIN", "Admin"
        OTHER = "OTHER", "Other"

    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="generated_reports"
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    parameters = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.report_type} report by {self.generated_by}"


class ReportExport(BaseModel):
    class ExportFormat(models.TextChoices):
        PDF = "PDF", "PDF"
        CSV = "CSV", "CSV"
        XLSX = "XLSX", "XLSX"

    class ExportStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    report = models.ForeignKey(GeneratedReport, on_delete=models.CASCADE, related_name="exports")
    export_format = models.CharField(max_length=10, choices=ExportFormat.choices)
    file_path = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=ExportStatus.choices, default=ExportStatus.PENDING)

    def __str__(self):
        return f"{self.report} - {self.export_format}"
