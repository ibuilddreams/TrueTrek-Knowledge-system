"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Megaphone, Send } from "lucide-react";
import { createFeedPost, deleteFeedPost, getCourseFeed } from "@/services/classFeedService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import FeedPostCard from "@/components/features/classFeed/FeedPostCard";
import AttachmentPreview from "@/components/features/messaging/AttachmentPreview";

const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm,.mkv,.avi";

export default function CourseFeedScreen({ courseId, course, onBack }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const feedQueryKey = ["courseFeed", courseId];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: feedQueryKey,
    queryFn: async () => {
      const response = await getCourseFeed(courseId);
      return response?.data?.results || [];
    },
    enabled: Boolean(courseId),
  });

  const posts = data || [];

  const resetComposer = () => {
    setTitle("");
    setCaption("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createMutation = useMutation({
    mutationFn: () => createFeedPost(courseId, { title: title.trim(), caption: caption.trim(), attachment }),
    onSuccess: () => {
      toastSuccess("Post published to the class feed.");
      resetComposer();
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (err) => {
      toastError(getApiErrorMessage(err, "Unable to publish post."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId) => deleteFeedPost(courseId, postId),
    onSuccess: () => {
      toastSuccess("Post deleted.");
      setPendingDeleteId(null);
      queryClient.invalidateQueries({ queryKey: feedQueryKey });
    },
    onError: (err) => {
      toastError(getApiErrorMessage(err, "Unable to delete post."));
    },
  });

  const canPublish = Boolean(caption.trim() || attachment) && !createMutation.isPending;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canPublish) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-line hover:border-pine/25 hover:text-pine text-muted text-xs font-mono uppercase tracking-wider rounded-xl transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to My Courses
      </button>

      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-gold" />
        <h2 className="font-serif font-bold text-xl text-ink">
          {course?.title ? `${course.title} — Class Feed` : "Class Feed"}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-line rounded-card shadow-soft p-5 space-y-3"
      >
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title (optional)"
          className="w-full bg-porcelain border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-pine transition"
        />
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          rows={3}
          placeholder="Share an update, tip, or short video with this class..."
          className="w-full bg-porcelain border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-pine transition resize-none"
        />

        {attachment && <AttachmentPreview file={attachment} onRemove={() => setAttachment(null)} />}

        <div className="flex items-center justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            onChange={(event) => setAttachment(event.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-line hover:bg-porcelain text-muted text-xs font-mono uppercase tracking-wider rounded-xl transition disabled:opacity-40"
          >
            <ImagePlus className="w-4 h-4" />
            Add Image/Video
          </button>
          <button
            type="submit"
            disabled={!canPublish}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pine hover:bg-moss text-paper text-xs font-bold font-mono uppercase tracking-wider rounded-xl shadow-md transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            {createMutation.isPending ? "Publishing..." : "Publish"}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          <div className="h-32 rounded-2xl bg-porcelain animate-pulse" />
          <div className="h-32 rounded-2xl bg-porcelain animate-pulse" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-rose-600">
          {getApiErrorMessage(error, "Unable to load the class feed.")}
        </p>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <div className="bg-paper border border-line rounded-card shadow-soft">
          <EmptyState
            icon={Megaphone}
            label="No posts yet"
            description="Posts you publish here appear to every student enrolled in this course."
            size="lg"
          />
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            canDelete
            onDelete={() => setPendingDeleteId(post.id)}
            isDeleting={deleteMutation.isPending && pendingDeleteId === post.id}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(pendingDeleteId)}
        title="Delete this post?"
        message="Students will no longer see this post in the class feed. This cannot be undone."
        confirmLabel="Delete"
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}
