"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BookOpen, Layers, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SortablePathwayCourseItem from "@/components/features/admin/SortablePathwayCourseItem";
import { getCourses } from "@/services/coursesService";
import {
  attachCourseToPathway,
  detachCourseFromPathway,
  getPathwayById,
  reorderPathwayCourses,
} from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

export default function ManagePathwayCoursesModal({ isOpen, onClose, pathway }) {
  const pathwayId = pathway?.id;
  const queryClient = useQueryClient();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [localCourseOrderIds, setLocalCourseOrderIds] = useState(null);
  const [detachingCourse, setDetachingCourse] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pathwayDetailQuery = useQuery({
    queryKey: ["pathway", pathwayId],
    queryFn: async () => {
      const response = await getPathwayById(pathwayId);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(pathwayId),
  });

  const coursesQuery = useQuery({
    queryKey: ["courses", "pathwayPicker"],
    queryFn: async () => {
      const response = await getCourses({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  const attachedCourses = pathwayDetailQuery.data?.courses || [];
  const allCourses = coursesQuery.data || [];

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCourseId("");
    setLocalCourseOrderIds(null);
    setDetachingCourse(null);
  }, [isOpen, pathwayId]);

  const attachMutation = useMutation({
    mutationFn: (courseId) => attachCourseToPathway(pathwayId, courseId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["pathway", pathwayId] });
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
      toastSuccess(response?.message || "Course attached successfully.");
      setSelectedCourseId("");
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to attach course."));
    },
  });

  const detachMutation = useMutation({
    mutationFn: (courseId) => detachCourseFromPathway(pathwayId, courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathway", pathwayId] });
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
      toastSuccess("Course detached successfully.");
      setDetachingCourse(null);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to detach course."));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (entries) => reorderPathwayCourses(pathwayId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathway", pathwayId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to reorder courses."));
    },
  });

  const displayCourses = useMemo(() => {
    if (!localCourseOrderIds) return attachedCourses;
    const currentIds = attachedCourses.map((pc) => pc.id);
    const sameSet =
      localCourseOrderIds.length === currentIds.length &&
      localCourseOrderIds.every((id) => currentIds.includes(id));
    if (!sameSet) return attachedCourses;
    const pathwayCourseById = new Map(attachedCourses.map((pc) => [pc.id, pc]));
    return localCourseOrderIds.map((id) => pathwayCourseById.get(id));
  }, [attachedCourses, localCourseOrderIds]);

  const availableCourseOptions = useMemo(() => {
    const attachedCourseIds = new Set(attachedCourses.map((pc) => pc.course?.id));
    return allCourses
      .filter((course) => !attachedCourseIds.has(course.id))
      .map((course) => ({
        value: course.id,
        label: course.code ? `${course.title} (${course.code})` : course.title,
      }));
  }, [allCourses, attachedCourses]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayCourses.map((pc) => pc.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalCourseOrderIds(newOrderIds);

    const payload = newOrderIds.map((id, index) => ({ pathwaycourse_id: id, order: index + 1 }));
    reorderMutation.mutate(payload);
  };

  const handleAttach = () => {
    if (!selectedCourseId) return;
    attachMutation.mutate(selectedCourseId);
  };

  const handleDetachConfirm = async () => {
    if (!detachingCourse) return;
    detachMutation.mutate(detachingCourse.course?.id);
  };

  const handleClose = () => {
    onClose();
  };

  const isLoading = pathwayDetailQuery.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Layers}
      title="Manage Pathway Courses"
      subtitle={pathway?.name ? `Attach and reorder courses — ${pathway.name}` : "Attach and reorder courses"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <SearchableSelect
              label="Add a Course"
              placeholder="Select a course to attach"
              searchPlaceholder="Search courses..."
              options={availableCourseOptions}
              value={selectedCourseId}
              onChange={setSelectedCourseId}
              loading={coursesQuery.isLoading}
              disabled={attachMutation.isPending}
              emptyLabel="No more courses available to attach."
            />
          </div>
          <button
            type="button"
            onClick={handleAttach}
            disabled={!selectedCourseId || attachMutation.isPending}
            className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 disabled:opacity-60 disabled:cursor-not-allowed text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {attachMutation.isPending ? "Attaching..." : "Attach"}
          </button>
        </div>

        <div>
          <p className="text-[10px] font-mono text-stone-450 uppercase tracking-wider mb-2 font-semibold">
            Attached Courses
          </p>

          {isLoading ? (
            <Loader fullScreen={false} label="Loading courses..." />
          ) : displayCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              label="No courses attached yet."
              description="Use the picker above to attach a course to this pathway."
            />
          ) : (
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={displayCourses.map((pc) => pc.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {displayCourses.map((pathwayCourse) => (
                    <SortablePathwayCourseItem
                      key={pathwayCourse.id}
                      pathwayCourse={pathwayCourse}
                      onDetach={setDetachingCourse}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(detachingCourse)}
        onClose={() => setDetachingCourse(null)}
        onConfirm={handleDetachConfirm}
        isConfirming={detachMutation.isPending}
        title="Detach Course"
        message={`Are you sure you want to detach "${detachingCourse?.course?.title}" from this pathway?`}
        confirmLabel="Detach"
      />
    </Modal>
  );
}
