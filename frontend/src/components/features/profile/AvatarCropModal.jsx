"use client";

import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Check, ImagePlus, Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { getCroppedImage } from "@/lib/imageCrop";
import { toastError } from "@/lib/toast";
import Modal from "@/components/ui/Modal";
import { PortalButton } from "@/components/features/portal/shell/PortalUI";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

// The portal dialog (`ui/Modal variant="cobalt"`), not a frame of its own: a
// crop box is a small form, and the convention for those on a converted screen
// is the shared dialog rather than another overlay to keep in step.
export default function AvatarCropModal({ isOpen, imageSrc, onCancel, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // `Modal` closes on a backdrop click, and a drag that starts on the crop
  // box (or the zoom slider) and is released off the panel dispatches its
  // click on the backdrop — the panel's own `stopPropagation` never sees it,
  // because the backdrop *is* the target. Without this, nudging the photo a
  // little too far throws the crop away. The flag is set by any pointer press
  // inside the dialog and cleared by the next click anywhere; a genuine
  // backdrop click presses on the backdrop, so it is never set.
  const pressedInsideRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const clear = () => {
      pressedInsideRef.current = false;
    };
    // Bubble phase on the document, so React's own handlers have already run.
    document.addEventListener("click", clear);
    return () => document.removeEventListener("click", clear);
  }, [isOpen]);

  const handleRequestClose = () => {
    if (pressedInsideRef.current) return;
    onCancel();
  };

  const handleCropComplete = (_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  };

  const adjustZoom = (delta) => {
    setZoom((prev) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((prev + delta).toFixed(2))))
    );
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const { blob, url } = await getCroppedImage(imageSrc, croppedAreaPixels);
      onSave({ blob, url });
    } catch (error) {
      toastError(error?.message || "Unable to crop this image.");
    } finally {
      setIsSaving(false);
    }
  };

  const ZOOM_BUTTON_CLASS =
    "grid h-8 w-8 flex-none place-items-center rounded-full border border-cn-p-line-2 bg-cn-p-card text-cn-p-ink-2 transition-colors duration-150 hover:border-cn-p-ink hover:text-cn-p-ink";

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? undefined : handleRequestClose}
      icon={ImagePlus}
      title="Crop profile photo"
      subtitle="Drag to reposition, zoom to fit."
    >
      <div
        className="flex flex-col gap-4"
        onPointerDown={() => {
          pressedInsideRef.current = true;
        }}
      >
        <div className="relative h-72 w-full cursor-move overflow-hidden rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-ink sm:h-80">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              style={{ containerStyle: { background: "#111827" } }}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjustZoom(-ZOOM_STEP)}
            className={ZOOM_BUTTON_CLASS}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full cursor-pointer accent-cn-p-accent"
            aria-label="Zoom"
          />

          <button
            type="button"
            onClick={() => adjustZoom(ZOOM_STEP)}
            className={ZOOM_BUTTON_CLASS}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <span className="w-11 shrink-0 text-right text-xs font-semibold tabular-nums text-cn-p-muted">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-cn-p-ink-2 transition-colors duration-150 hover:text-cn-p-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <div className="flex flex-col-reverse gap-3 border-t border-cn-p-line pt-4 sm:flex-row sm:justify-end">
          <PortalButton variant="sec" onClick={onCancel} disabled={isSaving}>
            Cancel
          </PortalButton>
          <PortalButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Cropping...
              </>
            ) : (
              <>
                <Check aria-hidden="true" className="h-4 w-4" />
                Crop and save
              </>
            )}
          </PortalButton>
        </div>
      </div>
    </Modal>
  );
}
