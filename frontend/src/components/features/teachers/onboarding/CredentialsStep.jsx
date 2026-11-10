"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import {
  deleteTeacherCredential,
  uploadTeacherCredential,
} from "@/services/teacherOnboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import { MAX_CREDENTIALS } from "@/constants/teacherOnboarding";
import EmptyState from "@/components/ui/EmptyState";
import CredentialRow from "./CredentialRow";
import CredentialUploadForm from "./CredentialUploadForm";

/**
 * Step 3 — the qualification documents.
 *
 * Unlike the other steps, this one writes as it goes rather than on Continue:
 * a file upload is its own request, so there is nothing for the wizard's save
 * to batch. Both mutations invalidate the application query, which is what the
 * list below (and the review step's checklist) re-reads.
 */
export default function CredentialsStep({ credentials = [], queryKey, disabled }) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const uploadMutation = useMutation({ mutationFn: uploadTeacherCredential });
  const deleteMutation = useMutation({ mutationFn: deleteTeacherCredential });

  const handleUpload = async (payload) => {
    try {
      await uploadMutation.mutateAsync(payload);
      await invalidate();
      toastSuccess("Document added.");
      return true;
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to upload that document."));
      return false;
    }
  };

  const handleDelete = async (credential) => {
    setDeletingId(credential.id);
    try {
      await deleteMutation.mutateAsync(credential.id);
      await invalidate();
      toastSuccess("Document removed.");
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to remove that document."));
    } finally {
      setDeletingId(null);
    }
  };

  const isFull = credentials.length >= MAX_CREDENTIALS;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted font-light leading-relaxed">
        Upload proof of the qualifications you listed — a degree certificate, a teaching licence,
        or a recent certification. At least one is required, and you can add up to{" "}
        {MAX_CREDENTIALS}.
      </p>

      {credentials.length > 0 ? (
        <ul className="space-y-3">
          {credentials.map((credential) => (
            <CredentialRow
              key={credential.id}
              credential={credential}
              onDelete={handleDelete}
              isDeleting={deletingId === credential.id}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={FileText}
          label="No documents yet."
          description="Add your first qualification below."
          compact
        />
      )}

      {isFull ? (
        <p className="text-xs font-mono text-muted text-center p-4 bg-porcelain border border-line rounded-xl">
          You have reached the limit of {MAX_CREDENTIALS} documents. Remove one to add another.
        </p>
      ) : (
        <CredentialUploadForm
          onUpload={handleUpload}
          isUploading={uploadMutation.isPending}
          disabled={disabled}
        />
      )}
    </div>
  );
}
