"use client";

import { useState } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ZoomIn } from "lucide-react";
import { getCroppedImage } from "@/lib/imageCrop";
import { toastError } from "@/lib/toast";

export default function AvatarCropModal({ isOpen, imageSrc, onCancel, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCropComplete = (_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
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
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white border border-stone-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

            <div className="p-5 sm:p-6">
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Crop Profile Photo
              </h3>
              <p className="text-xs text-stone-500 font-light mt-0.5 mb-4">
                Drag to reposition and zoom to fit your photo perfectly.
              </p>

              <div className="relative w-full h-64 sm:h-72 bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
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
                  />
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <ZoomIn className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                  aria-label="Zoom"
                />
              </div>

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
                  <Check className="w-3.5 h-3.5" />
                  Crop & Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
