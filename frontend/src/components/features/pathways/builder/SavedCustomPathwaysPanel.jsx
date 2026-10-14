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
          <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-gold">
            Saved Bundles
          </span>
          <h2 className="text-2xl font-serif font-light text-ink leading-tight">
            My Custom Pathways
          </h2>
        </div>
        {pathways.length > 0 && (
          <span className="text-xs font-sans text-muted shrink-0">
            {pathways.length} saved
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center" aria-busy="true">
          <Loader fullScreen={false} label="Loading your pathways..." />
        </div>
      ) : pathways.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper/70">
          <EmptyState
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
