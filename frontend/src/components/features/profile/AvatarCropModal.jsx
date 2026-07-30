"use client";

import { useState } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "motion/react";
import { Check, ImagePlus, Loader2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { getCroppedImage } from "@/lib/imageCrop";
import { toastError } from "@/lib/toast";
import IconBadge from "@/components/ui/IconBadge";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export default function AvatarCropModal({ isOpen, imageSrc, onCancel, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition disabled:opacity-60"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-5 pr-8">
                <IconBadge
                  icon={ImagePlus}
                  size="w-10 h-10"
                  iconSize="w-5 h-5"
                  className="bg-amber-600/10 text-amber-700 rounded-xl border border-amber-200/40 shrink-0"
                />
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 leading-tight">
                    Crop Profile Photo
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    Drag to reposition, zoom to fit perfectly.
                  </p>
                </div>
              </div>

              <div className="relative w-full h-72 sm:h-80 bg-stone-900 rounded-xl overflow-hidden border border-stone-200 shadow-inner cursor-move">
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
                    style={{ containerStyle: { background: "#1c1917" } }}
                  />
                )}
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => adjustZoom(-ZOOM_STEP)}
                  className="w-8 h-8 shrink-0 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center transition"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                  aria-label="Zoom"
                />

                <button
                  type="button"
                  onClick={() => adjustZoom(ZOOM_STEP)}
                  className="w-8 h-8 shrink-0 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center transition"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <span className="text-[11px] font-mono font-semibold text-stone-400 w-11 text-right shrink-0">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-stone-400 hover:text-amber-800 uppercase tracking-wider transition mt-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cropping...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Crop & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
