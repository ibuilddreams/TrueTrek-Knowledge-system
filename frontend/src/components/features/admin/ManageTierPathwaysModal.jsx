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
import { Layers3, Plus, Route } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SearchableSelect from "@/components/ui/SearchableSelect";
import SortableTierPathwayItem from "@/components/features/admin/SortableTierPathwayItem";
import { getAdminPathways } from "@/services/pathwaysService";
import {
  attachPathwayToTier,
  detachPathwayFromTier,
  getTierById,
  reorderTierPathways,
} from "@/services/tiersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

export default function ManageTierPathwaysModal({ isOpen, onClose, tier }) {
  const tierId = tier?.id;
  const queryClient = useQueryClient();

  const [selectedPathwayId, setSelectedPathwayId] = useState("");
  const [localPathwayOrderIds, setLocalPathwayOrderIds] = useState(null);
  const [detachingPathway, setDetachingPathway] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tierDetailQuery = useQuery({
    queryKey: ["tier", tierId],
    queryFn: async () => {
      const response = await getTierById(tierId);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(tierId),
  });

  const pathwaysQuery = useQuery({
    queryKey: ["pathways", "tierPicker"],
    queryFn: async () => {
      const response = await getAdminPathways({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  // A pathway can belong to more than one tier — this list is normalized from
  // TierPathway rows (the through-model), not Pathway rows directly, so the
  // same pathway attached to two tiers appears once per tier here, each with
  // its own order.
  const attachedPathways = useMemo(
    () =>
      (tierDetailQuery.data?.pathways || []).map((tierPathway) => ({
        id: tierPathway.id,
        pathwayId: tierPathway.pathway.id,
        name: tierPathway.pathway.name,
        course_count: tierPathway.pathway.course_count,
        order: tierPathway.order,
      })),
    [tierDetailQuery.data]
  );
  const allPathways = pathwaysQuery.data || [];

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPathwayId("");
    setLocalPathwayOrderIds(null);
    setDetachingPathway(null);
  }, [isOpen, tierId]);

  const attachMutation = useMutation({
    mutationFn: (pathwayId) => attachPathwayToTier(tierId, pathwayId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["tier", tierId] });
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
      toastSuccess(response?.message || "Pathway attached successfully.");
      setSelectedPathwayId("");
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to attach pathway."));
    },
  });

  const detachMutation = useMutation({
    mutationFn: (pathwayId) => detachPathwayFromTier(tierId, pathwayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tier", tierId] });
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
      toastSuccess("Pathway removed from tier successfully.");
      setDetachingPathway(null);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to remove pathway from tier."));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (entries) => reorderTierPathways(tierId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tier", tierId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to reorder pathways."));
    },
  });

  const displayPathways = useMemo(() => {
    if (!localPathwayOrderIds) return attachedPathways;
    const currentIds = attachedPathways.map((p) => p.id);
    const sameSet =
      localPathwayOrderIds.length === currentIds.length &&
      localPathwayOrderIds.every((id) => currentIds.includes(id));
    if (!sameSet) return attachedPathways;
    const pathwayById = new Map(attachedPathways.map((p) => [p.id, p]));
    return localPathwayOrderIds.map((id) => pathwayById.get(id));
  }, [attachedPathways, localPathwayOrderIds]);

  const availablePathwayOptions = useMemo(() => {
    // "Available" means not yet attached to THIS tier — a pathway already
    // attached to other tiers can still be attached here too.
    const attachedPathwayIds = new Set(attachedPathways.map((p) => p.pathwayId));
    return allPathways
      .filter((pathway) => !attachedPathwayIds.has(pathway.id))
      .map((pathway) => {
        const otherTierNames = (pathway.tiers || []).map((t) => t.name);
        return {
          value: pathway.id,
          label: otherTierNames.length
            ? `${pathway.name} (also in ${otherTierNames.join(", ")})`
            : pathway.name,
        };
      });
  }, [allPathways, attachedPathways]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayPathways.map((p) => p.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalPathwayOrderIds(newOrderIds);

    const payload = newOrderIds.map((id, index) => ({ tierpathway_id: id, order: index + 1 }));
    reorderMutation.mutate(payload);
  };

  const handleAttach = () => {
    if (!selectedPathwayId) return;
    attachMutation.mutate(selectedPathwayId);
  };

  const handleDetachConfirm = async () => {
    if (!detachingPathway) return;
    detachMutation.mutate(detachingPathway.pathwayId);
  };

  const handleClose = () => {
    onClose();
  };

  const isLoading = tierDetailQuery.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Layers3}
      title="Manage Tier Pathways"
      subtitle={tier?.name ? `Attach and reorder pathways — ${tier.name}` : "Attach and reorder pathways"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <SearchableSelect
              label="Add a Pathway"
              placeholder="Select a pathway to attach"
              searchPlaceholder="Search pathways..."
              options={availablePathwayOptions}
              value={selectedPathwayId}
              onChange={setSelectedPathwayId}
              loading={pathwaysQuery.isLoading}
              disabled={attachMutation.isPending}
              emptyLabel="No more pathways available to attach."
            />
          </div>
          <button
            type="button"
            onClick={handleAttach}
            disabled={!selectedPathwayId || attachMutation.isPending}
            className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 disabled:opacity-60 disabled:cursor-not-allowed text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {attachMutation.isPending ? "Attaching..." : "Attach"}
          </button>
        </div>

        <div>
          <p className="text-[10px] font-mono text-stone-450 uppercase tracking-wider mb-2 font-semibold">
            Attached Pathways
          </p>

          {isLoading ? (
            <Loader fullScreen={false} label="Loading pathways..." />
          ) : displayPathways.length === 0 ? (
            <EmptyState
              icon={Route}
              label="No pathways attached yet."
              description="Use the picker above to attach a pathway to this tier."
            />
          ) : (
            <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={displayPathways.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {displayPathways.map((pathway) => (
                    <SortableTierPathwayItem
                      key={pathway.id}
                      pathway={pathway}
                      onDetach={setDetachingPathway}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(detachingPathway)}
        onClose={() => setDetachingPathway(null)}
        onConfirm={handleDetachConfirm}
        isConfirming={detachMutation.isPending}
        title="Remove Pathway"
        message={`Are you sure you want to remove "${detachingPathway?.name}" from this tier?`}
        confirmLabel="Remove"
      />
    </Modal>
  );
}
