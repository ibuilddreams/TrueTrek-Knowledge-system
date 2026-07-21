from django.contrib import admin

from .models import FileFolder, UploadedFile


@admin.register(FileFolder)
class FileFolderAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "owner", "created_at")
    search_fields = ("name", "owner__username")
    autocomplete_fields = ("parent", "owner")


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ("original_name", "mime_type", "size", "folder", "uploaded_by", "created_at")
    list_filter = ("mime_type",)
    search_fields = ("original_name", "uploaded_by__username")
    autocomplete_fields = ("folder", "uploaded_by")
