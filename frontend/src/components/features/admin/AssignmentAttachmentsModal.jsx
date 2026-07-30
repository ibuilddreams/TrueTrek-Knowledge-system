"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, File, FileText, Image as ImageIcon, Paperclip, Pencil, Trash2, Upload } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  deleteAssignmentAttachment,
  getAssignmentAttachments,
  updateAssignmentAttachment,
  uploadAssignmentAttachment,
} from "@/services/assignmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";

const FILE_TYPE_ICONS = {
  DOCUMENT: FileText,
  PRESENTATION: FileText,
  ARCHIVE: Archive,
  IMAGE: ImageIcon,
};

function formatUploadedDate(value) {
  return formatDate(value);
}

function AttachmentRow({ attachment, onReplace, onDelete, isReplacing, isDeleting }) {
  const replaceInputRef = useRef(null);
  const Icon = FILE_TYPE_ICONS[attachment.file_type] || File;

  return (
    <li className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white">
      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <a
          href={attachment.file}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-stone-800 truncate hover:text-amber-700 hover:underline block"
        >
          {attachment.original_name}
        </a>
        <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-0.5">
          {attachment.file_type || "FILE"} · {formatUploadedDate(attachment.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          ref={replaceInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onReplace(attachment, file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => replaceInputRef.current?.click()}
          disabled={isReplacing}
          title="Replace file"
          aria-label="Replace file"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(attachment)}
          disabled={isDeleting}
          title="Delete attachment"
          aria-label="Delete attachment"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

export default function AssignmentAttachmentsModal({ isOpen, onClose, assignment, moduleId }) {
  const queryClient = useQueryClient();
  const uploadInputRef = useRef(null);
  const [deletingAttachment, setDeletingAttachment] = useState(null);

  const assignmentId = assignment?.id;

  const attachmentsQuery = useQuery({
    queryKey: ["assignment-attachments", assignmentId],
    queryFn: async () => {
      const response = await getAssignmentAttachments(assignmentId);
      return response?.data || [];
    },
    enabled: isOpen && Boolean(assignmentId),
  });
  const attachments = attachmentsQuery.data || [];

  const invalidateAttachments = () => {
    queryClient.invalidateQueries({ queryKey: ["assignment-attachments", assignmentId] });
    if (moduleId) {
      queryClient.invalidateQueries({ queryKey: ["assignments", moduleId] });
    }
  };

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadAssignmentAttachment(assignmentId, file),
    onSuccess: (response) => {
      invalidateAttachments();
      toastSuccess(response?.message || "Attachment uploaded successfully.");
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to upload attachment."));
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ id, file }) => updateAssignmentAttachment(id, file),
    onSuccess: (response) => {
      invalidateAttachments();
      toastSuccess(response?.message || "Attachment replaced successfully.");
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to replace attachment."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAssignmentAttachment(id),
    onSuccess: () => {
      invalidateAttachments();
      toastSuccess("Attachment deleted successfully.");
      setDeletingAttachment(null);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to delete attachment."));
    },
  });

  const handleUploadClick = () => uploadInputRef.current?.click();

  const handleUploadChange = (event) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => uploadMutation.mutate(file));
    event.target.value = "";
  };

  const handleReplace = (attachment, file) => {
    replaceMutation.mutate({ id: attachment.id, file });
  };

  const handleDeleteConfirm = () => {
    if (!deletingAttachment) return;
    deleteMutation.mutate(deletingAttachment.id);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        icon={Paperclip}
        title="Assignment Attachments"
        subtitle={assignment?.title}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          {attachmentsQuery.isLoading ? (
            <Loader fullScreen={false} label="Loading attachments..." />
          ) : attachments.length === 0 ? (
            <EmptyState
              icon={Paperclip}
              label="No attachments yet."
              description="Upload reference material for students to download."
              compact
            />
          ) : (
            <ul className="space-y-2">
              {attachments.map((attachment) => (
                <AttachmentRow
                  key={attachment.id}
                  attachment={attachment}
                  onReplace={handleReplace}
                  onDelete={setDeletingAttachment}
                  isReplacing={replaceMutation.isPending}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </ul>
          )}

          <input ref={uploadInputRef} type="file" multiple className="hidden" onChange={handleUploadChange} />
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploadMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Upload Attachment
              </>
            )}
          </button>
          <p className="text-[10px] font-mono text-stone-400 tracking-wider">
            Allowed: PDF, DOC/DOCX, PPT/PPTX, ZIP, JPG/PNG/WEBP · up to 50MB
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingAttachment)}
        onClose={() => setDeletingAttachment(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteMutation.isPending}
        title="Delete Attachment"
        message={`Are you sure you want to delete "${deletingAttachment?.original_name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}
