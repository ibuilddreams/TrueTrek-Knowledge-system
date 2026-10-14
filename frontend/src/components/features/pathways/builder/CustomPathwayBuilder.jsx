"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  LogIn,
  RefreshCw,
  UserPlus,
  Wand2,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { MAX_CUSTOM_PATHWAY_COURSES } from "@/constants/pathways";
import { buildAuthUrl } from "@/lib/authRedirect";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { getPublicCourses } from "@/services/coursesService";
import {
  checkoutPathways,
  createCustomPathway,
  deleteCustomPathway,
  getMyCustomPathways,
  updateCustomPathway,
} from "@/services/pathwaysService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import SearchBar from "@/components/ui/SearchBar";
import PathwayCheckoutModal from "@/components/features/pathways/PathwayCheckoutModal";
import BuilderCourseCard from "./BuilderCourseCard";
import BuilderSummaryPanel from "./BuilderSummaryPanel";
import SavedCustomPathwaysPanel from "./SavedCustomPathwaysPanel";

const PAGE_SIZE = 9;
const CUSTOM_PATHWAYS_QUERY_KEY = ["my-custom-pathways"];

const PRIMARY_LINK =
  "inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper text-xs font-sans font-medium uppercase tracking-widest px-6 py-3 rounded-full shadow-soft transition";

export default function CustomPathwayBuilder() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status: authStatus, isAuthenticated, isStudent, role } = useAuth();
  const isAuthResolved = authStatus !== "idle" && authStatus !== "loading";

  const builderRef = useRef(null);

  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  // Keyed by course id so a selection survives paginating or searching away
  // from the course that made it. Insertion order is the pathway's course
  // order, which is what the backend stores.
  const [selectedMap, setSelectedMap] = useState(new Map());
  const [editingPathway, setEditingPathway] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  // The pathway currently in checkout, and the one queued for deletion. Both
  // are kept around while their modal animates out.
  const [checkoutPathway, setCheckoutPathway] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    isFetching: isFetchingCourses,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["builder-courses", page, debouncedSearch],
    queryFn: async () => {
      const response = await getPublicCourses({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        // Courses the student already owns can't go in a bundle — the backend
        // rejects them, so they're never offered here either.
        excludeEnrolled: true,
        sort: "title",
      });
      return response?.data || { results: [], count: 0 };
    },
    enabled: isStudent,
    placeholderData: keepPreviousData,
  });

  const courses = coursesData?.results || [];
  const totalCourses = coursesData?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCourses / PAGE_SIZE));

  const { data: customPathways = [], isLoading: isLoadingCustomPathways } = useQuery({
    queryKey: CUSTOM_PATHWAYS_QUERY_KEY,
    queryFn: async () => {
      const response = await getMyCustomPathways();
      return response?.data || [];
    },
    enabled: isStudent,
  });

  const selectedCourses = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const selectedTotal = useMemo(
    () => selectedCourses.reduce((sum, course) => sum + (Number(course.amount) || 0), 0),
    [selectedCourses],
  );

  function resetForm() {
    setName("");
    setSummary("");
    setSelectedMap(new Map());
    setEditingPathway(null);
  }

  function toggleCourse(course) {
    const isSelected = selectedMap.has(course.id);

    if (!isSelected && selectedMap.size >= MAX_CUSTOM_PATHWAY_COURSES) {
      toastInfo(`A pathway can hold at most ${MAX_CUSTOM_PATHWAY_COURSES} courses.`);
      return;
    }

    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(course.id)) {
        next.delete(course.id);
      } else {
        next.set(course.id, course);
      }
      return next;
    });
  }

  function removeCourse(courseId) {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      next.delete(courseId);
      return next;
    });
  }

  function openCheckout(pathway) {
    setCheckoutPathway(pathway);
    setIsCheckoutOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: ({ pathwayId, payload }) =>
      pathwayId ? updateCustomPathway(pathwayId, payload) : createCustomPathway(payload),
    onSuccess: (response, variables) => {
      const pathway = response?.data;
      queryClient.invalidateQueries({ queryKey: CUSTOM_PATHWAYS_QUERY_KEY });
      toastSuccess(
        variables.pathwayId ? "Your pathway has been updated." : "Your pathway has been saved.",
      );
      resetForm();

      if (variables.checkoutAfterSave && pathway) {
        openCheckout(pathway);
      }
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to save your pathway. Please try again."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (pathwayId) => deleteCustomPathway(pathwayId),
    onSuccess: (_response, pathwayId) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_PATHWAYS_QUERY_KEY });
      toastSuccess("Pathway deleted.");
      setIsDeleteOpen(false);
      // Deleting the pathway being edited would otherwise leave the form
      // pointing at a row that no longer exists.
      if (editingPathway?.id === pathwayId) resetForm();
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to delete this pathway."));
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (pathwayId) => checkoutPathways([pathwayId]),
    onSuccess: (response, pathwayId) => {
      const result = response?.data || {};
      const enrolled = result.enrolled_pathways || [];
      const alreadyEnrolled = result.already_enrolled_pathways || [];
      const failed = result.failed_pathways || [];

      if (enrolled.length > 0) {
        toastSuccess("Payment successful — your pathway is unlocked!");
      } else if (alreadyEnrolled.length > 0 && failed.length === 0) {
        toastInfo("You already have access to this pathway.");
      }

      (enrolled[0]?.courses_without_instructor || []).forEach((title) => {
        toastInfo(`${title}: an instructor hasn't been assigned yet.`);
      });
      failed.forEach((item) => toastError(item.reason));

      setIsCheckoutOpen(false);
      if (editingPathway?.id === pathwayId) resetForm();

      queryClient.invalidateQueries({ queryKey: CUSTOM_PATHWAYS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["builder-courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-pathways"] });
      queryClient.invalidateQueries({ queryKey: ["store-public-courses"] });
      queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["curriculum-enrollment"] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Checkout failed. Please try again."));
    },
  });

  function handleSubmit({ checkoutAfterSave }) {
    const trimmedName = name.trim();
    if (!trimmedName || selectedCourses.length === 0) return;

    saveMutation.mutate({
      pathwayId: editingPathway?.id || null,
      checkoutAfterSave,
      payload: {
        name: trimmedName,
        summary: summary.trim(),
        course_ids: selectedCourses.map((course) => course.id),
      },
    });
  }

  function handleEdit(pathway) {
    setEditingPathway(pathway);
    setName(pathway.name);
    setSummary(pathway.summary || "");
    setSelectedMap(
      new Map(
        (pathway.courses || [])
          .filter((entry) => entry.course)
          .map((entry) => [entry.course.id, entry.course]),
      ),
    );
    builderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleDelete(pathway) {
    setPendingDelete(pathway);
    setIsDeleteOpen(true);
  }

  // --- Gated states --------------------------------------------------------

  let gate = null;

  if (!isAuthResolved) {
    gate = (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading builder..." />
      </div>
    );
  } else if (!isAuthenticated) {
    // Reached by deep link rather than the /pathways banner (which prompts
    // with a modal first); same destination either way.
    gate = (
      <div className="rounded-card border border-line bg-paper shadow-soft">
        <EmptyState
          icon={Wand2}
          size="lg"
          label="Sign in to build your pathway"
          description="Bundle any courses you like into a pathway of your own, then buy them together."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={buildAuthUrl(ROUTES.LOGIN, ROUTES.PATHWAY_BUILDER)}
                className={PRIMARY_LINK}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href={buildAuthUrl(ROUTES.SIGNUP, ROUTES.PATHWAY_BUILDER)}
                className="inline-flex items-center justify-center gap-2 bg-porcelain hover:bg-line/40 border border-line text-ink text-xs font-sans font-medium uppercase tracking-widest px-6 py-3 rounded-full transition"
              >
                <UserPlus className="w-4 h-4" />
                Create Student Account
              </Link>
            </div>
          }
        />
      </div>
    );
  } else if (!isStudent) {
    gate = (
      <div className="rounded-card border border-line bg-paper shadow-soft">
        <EmptyState
          icon={Wand2}
          size="lg"
          label="Building pathways is for student accounts"
          description="Bundling and purchasing courses is available to student accounts only."
          action={
            <button
              type="button"
              onClick={() => router.push(getPortalRouteForRole(role))}
              className={PRIMARY_LINK}
            >
              Open My Portal
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div id="pathway-builder-container" className="min-h-screen cn-page-bg text-ink pb-24">
      <div className="bg-pine text-paper py-16 px-6 border-b border-white/10 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-gold/12 blur-[130px] -translate-y-1/2"
        />
        <div className="max-w-6xl mx-auto relative z-10 space-y-3">
          <Link
            href={ROUTES.PATHWAYS}
            className="inline-flex items-center gap-1.5 text-paper/70 hover:text-gold font-sans text-xs uppercase tracking-widest font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Pathways
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif font-light leading-[0.92] tracking-tight text-paper">
            Build Your Own Pathway
          </h1>
          <p className="text-paper/70 text-xs md:text-sm font-light max-w-xl leading-relaxed">
            Pick the courses you want, name your bundle, and buy it in one go —
            you&apos;ll be enrolled in every course inside it straight away.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {gate || (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8 items-start">
              <div ref={builderRef} className="min-w-0 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-gold">
                      Step 1
                    </span>
                    <h2 className="text-2xl font-serif font-light text-ink leading-tight">
                      Choose your courses
                    </h2>
                  </div>
                  <SearchBar
                    id="pathway-builder-course-search"
                    value={searchInput}
                    onChange={setSearchInput}
                    placeholder="Search courses..."
                    className="w-full sm:max-w-xs"
                    inputClassName="bg-paper font-sans focus:bg-paper"
                  />
                </div>

                {isLoadingCourses && (
                  <div
                    className="flex min-h-[40vh] items-center justify-center"
                    aria-busy="true"
                  >
                    <Loader fullScreen={false} label="Loading courses..." />
                  </div>
                )}

                {isCoursesError && (
                  <div className="border border-line bg-paper rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-serif font-light mb-2 text-ink">
                      Failed to Load Courses
                    </h3>
                    <p className="text-xs font-light mb-6 text-muted">
                      {getApiErrorMessage(coursesError, "Unable to load courses right now.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetchCourses()}
                      className="inline-flex items-center gap-2 px-5 py-3 font-sans font-medium text-xs uppercase tracking-widest rounded-full transition border border-line text-ink hover:bg-porcelain"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                )}

                {!isLoadingCourses && !isCoursesError && courses.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-line bg-paper/70">
                    <EmptyState
                      icon={BookOpen}
                      label={
                        debouncedSearch
                          ? "No courses match your search"
                          : "No courses available right now"
                      }
                      description={
                        debouncedSearch
                          ? "Try a different term."
                          : "Courses you're already enrolled in aren't shown here."
                      }
                    />
                  </div>
                )}

                {!isLoadingCourses && !isCoursesError && courses.length > 0 && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 transition-opacity duration-200 ${
                        isFetchingCourses ? "opacity-60" : "opacity-100"
                      }`}
                    >
                      {courses.map((course) => (
                        <BuilderCourseCard
                          key={course.id}
                          course={course}
                          isSelected={selectedMap.has(course.id)}
                          isDisabled={selectedMap.size >= MAX_CUSTOM_PATHWAY_COURSES}
                          onToggle={toggleCourse}
                        />
                      ))}
                    </motion.div>

                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      totalLabel={`${totalCourses} course${totalCourses === 1 ? "" : "s"}`}
                    />
                  </>
                )}
              </div>

              <BuilderSummaryPanel
                name={name}
                summary={summary}
                selectedCourses={selectedCourses}
                total={selectedTotal}
                isEditing={Boolean(editingPathway)}
                isSaving={saveMutation.isPending}
                onNameChange={setName}
                onSummaryChange={setSummary}
                onRemoveCourse={removeCourse}
                onClearAll={() => setSelectedMap(new Map())}
                onSubmit={handleSubmit}
                onCancelEdit={resetForm}
              />
            </div>

            <SavedCustomPathwaysPanel
              pathways={customPathways}
              isLoading={isLoadingCustomPathways}
              editingId={editingPathway?.id || null}
              buyingId={checkoutMutation.isPending ? checkoutPathway?.id : null}
              deletingId={deleteMutation.isPending ? pendingDelete?.id : null}
              onBuy={openCheckout}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      <PathwayCheckoutModal
        isOpen={isCheckoutOpen}
        pathways={checkoutPathway ? [checkoutPathway] : []}
        isSubmitting={checkoutMutation.isPending}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={() => checkoutPathway && checkoutMutation.mutate(checkoutPathway.id)}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        isConfirming={deleteMutation.isPending}
        title="Delete this pathway?"
        message={`"${pendingDelete?.name}" will be removed. The courses inside it stay available.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
