"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  deleteTestimonial,
  getAdminTestimonials,
  hideTestimonial,
  publishTestimonial,
} from "@/services/testimonialsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PUBLISHED", label: "Published" },
  { value: "HIDDEN", label: "Hidden" },
];

export default function TestimonialsTab() {
  const queryClient = useQueryClient();

  const {
    data: testimonials = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminTestimonials"],
    queryFn: async () => {
      const response = await getAdminTestimonials({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const invalidateTestimonials = () => {
    queryClient.invalidateQueries({ queryKey: ["adminTestimonials"] });
    queryClient.invalidateQueries({ queryKey: ["publicTestimonials"] });
  };

  const publishMutation = useMutation({
    mutationFn: (id) => publishTestimonial(id),
    onSuccess: invalidateTestimonials,
  });

  const hideMutation = useMutation({
    mutationFn: (id) => hideTestimonial(id),
    onSuccess: invalidateTestimonials,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTestimonial(id),
    onSuccess: invalidateTestimonials,
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deletingTestimonial, setDeletingTestimonial] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredTestimonials = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return testimonials.filter((testimonial) => {
      const haystack = `${testimonial.name || ""} ${testimonial.quote || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = !statusFilter || testimonial.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [testimonials, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTestimonials.length / PAGE_SIZE));
  const paginatedTestimonials = filteredTestimonials.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handlePublish = async (testimonial) => {
    try {
      await publishMutation.mutateAsync(testimonial.id);
      toastSuccess("Testimonial published — now visible on the Future Clients page.");
    } catch (err) {
      toastError(getApiErrorMessage(err, "Unable to publish testimonial."));
    }
  };

  const handleHide = async (testimonial) => {
    try {
      await hideMutation.mutateAsync(testimonial.id);
      toastSuccess("Testimonial hidden from the public page.");
    } catch (err) {
      toastError(getApiErrorMessage(err, "Unable to hide testimonial."));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTestimonial) return;
    try {
      await deleteMutation.mutateAsync(deletingTestimonial.id);
      toastSuccess("Testimonial deleted successfully.");
      setDeletingTestimonial(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, "Unable to delete testimonial."));
    }
  };

  const columns = [
    {
      key: "name",
      header: "Submitted by",
      render: (testimonial) => (
        <div>
          <p className="font-semibold text-cn-p-ink">{testimonial.name}</p>
          {(testimonial.role || testimonial.school) && (
            <p className="text-xs text-cn-p-ink-2 font-light truncate max-w-xs">
              {[testimonial.role, testimonial.school].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "quote",
      header: "Testimonial",
      render: (testimonial) => (
        <p className="text-xs text-cn-p-ink-2 font-light italic truncate max-w-sm">&ldquo;{testimonial.quote}&rdquo;</p>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (testimonial) => (
        <div className="flex items-center gap-0.5">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-cn-p-accent text-cn-p-soft-ink" />
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (testimonial) => <StatusBadge tone="cobalt" size="lg" status={testimonial.status} />,
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (testimonial) => formatDate(testimonial.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (testimonial) => (
        <ActionMenu
          actions={[
            testimonial.status !== "PUBLISHED" && {
              key: "publish",
              label: "Publish",
              icon: Eye,
              onSelect: () => handlePublish(testimonial),
            },
            testimonial.status !== "HIDDEN" && {
              key: "hide",
              label: "Hide",
              icon: EyeOff,
              onSelect: () => handleHide(testimonial),
            },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              tone: "danger",
              onSelect: () => setDeletingTestimonial(testimonial),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Testimonials"
        subtitle="Quotes shown on the public site. Only publish with written permission."
      />

      <div className="flex flex-col gap-3 rounded-cn-p border border-cn-p-line bg-cn-p-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar tone="cobalt"
            size="lg"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search testimonials by name or quote..."
          />
          <div className="w-full sm:w-56 shrink-0">
            <SearchableSelect tone="cobalt"
              size="lg"
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt"
          size="lg"
          columns={columns}
          rows={paginatedTestimonials}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load testimonials.") : null}
          onRetry={refetch}
          emptyLabel="No testimonials found."
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt"
            size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${filteredTestimonials.length} testimonial${
              filteredTestimonials.length === 1 ? "" : "s"
            }`}
          />

        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deletingTestimonial)}
        onClose={() => setDeletingTestimonial(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteMutation.isPending}
        title="Delete testimonial"
        message={`Are you sure you want to delete this testimonial from "${deletingTestimonial?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
