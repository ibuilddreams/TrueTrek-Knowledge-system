"use client";

import { Layers } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import SavedCustomPathwayCard from "./SavedCustomPathwayCard";

// Everything this student has built so far — drafts they can still change or
// buy, and the ones they've already purchased.
export default function SavedCustomPathwaysPanel({
  pathways = [],
  isLoading = false,
  editingId = null,
  buyingId = null,
  deletingId = null,
  onBuy,
  onEdit,
  onDelete,
}) {
  return (
    <section id="my-custom-pathways-section" className="mt-16">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <span className="text-xs font-semibold tracking-widest text-cn-accent uppercase">
            Saved bundles
          </span>
          <h2 className="text-cn-xl font-bold tracking-[-0.015em] text-cn-ink">
            My custom pathways
          </h2>
        </div>
        {pathways.length > 0 && (
          <span className="shrink-0 text-sm text-cn-muted">
            {pathways.length} saved
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center" aria-busy="true">
          <Loader tone="cobalt" fullScreen={false} label="Loading your pathways..." />
        </div>
      ) : pathways.length === 0 ? (
        <div className="rounded-cn-lg border border-dashed border-cn-rule bg-white">
          <EmptyState tone="cobalt"
            icon={Layers}
            label="You haven't built a pathway yet"
            description="Pick some courses above and save them as your own bundle."
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pathways.map((pathway) => (
            <SavedCustomPathwayCard
              key={pathway.id}
              pathway={pathway}
              isEditing={editingId === pathway.id}
              isBuying={buyingId === pathway.id}
              isDeleting={deletingId === pathway.id}
              onBuy={onBuy}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
