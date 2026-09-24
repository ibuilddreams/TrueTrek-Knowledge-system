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

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
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
      header: "Submitted By",
      render: (testimonial) => (
        <div>
          <p className="font-semibold text-ink">{testimonial.name}</p>
          {(testimonial.role || testimonial.school) && (
            <p className="text-xs text-muted font-light truncate max-w-xs">
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
        <p className="text-xs text-muted font-light italic truncate max-w-sm">&ldquo;{testimonial.quote}&rdquo;</p>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (testimonial) => (
        <div className="flex items-center gap-0.5">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (testimonial) => <StatusBadge size="lg" status={testimonial.status} />,
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar
            size="lg"
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search testimonials by name or quote..."
          />
          <div className="w-full sm:w-56 shrink-0">
            <SearchableSelect
              size="lg"
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={paginatedTestimonials}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load testimonials.") : null}
          onRetry={refetch}
          emptyLabel="No testimonials found."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredTestimonials.length} testimonial${
            filteredTestimonials.length === 1 ? "" : "s"
          }`}
        />
      </div>

      <ConfirmDialog
        size="lg"
        isOpen={Boolean(deletingTestimonial)}
        onClose={() => setDeletingTestimonial(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteMutation.isPending}
        title="Delete Testimonial"
        message={`Are you sure you want to delete this testimonial from "${deletingTestimonial?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
