"use client";

import { CreditCard, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatCoursePrice } from "@/lib/store";
import CloseButton from "@/components/ui/CloseButton";
import Loader from "@/components/ui/Loader";

export default function StoreCartDrawer({
  isOpen,
  onClose,
  items,
  isLoading = false,
  pendingCourseIds = [],
  onRemove,
  onPurchase,
}) {
  const subtotal = items.reduce((sum, course) => sum + (Number(course.amount) || 0), 0);
  const pendingIds = new Set(pendingCourseIds);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="store-cart-drawer-overlay">
          <div
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={onClose}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
            >
              <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-stone-950 flex items-center justify-center text-white">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold tracking-tight text-sm text-stone-900">
                      Course Cart
                    </h3>
                    <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wide">
                      Selected Courses
                    </p>
                  </div>
                </div>
                <CloseButton
                  onClick={onClose}
                  className="text-stone-400 hover:text-stone-750 p-1.5 rounded-full border border-stone-200 bg-white"
                  iconClassName="w-4 h-4"
                />
              </div>

              <div className="grow overflow-y-auto p-6 space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader fullScreen={false} label="Loading cart..." />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border border-dashed border-stone-300">
                      <ShoppingBag className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">Your cart is empty</p>
                      <p className="text-xs text-stone-500 mt-1 max-w-60 leading-relaxed mx-auto">
                        Browse the store and acquire a course to add it here.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="bg-stone-950 hover:bg-stone-800 text-white text-[11px] font-mono uppercase tracking-wider px-5 py-2.5 rounded-full font-bold transition"
                    >
                      Browse Courses
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm uppercase font-mono text-stone-400 tracking-wider">
                      Courses In Your Cart
                    </p>

                    {items.map((course) => {
                      const isRemoving = pendingIds.has(course.id);
                      return (
                        <div
                          key={course.id}
                          className={`flex gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50 transition-opacity ${
                            isRemoving ? "opacity-50" : "opacity-100"
                          }`}
                        >
                          <div className="w-16 h-16 rounded-lg border border-stone-200 shrink-0 bg-stone-100 overflow-hidden flex items-center justify-center">
                            {course.image ? (
                              <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <p className="text-sm font-bold text-stone-900 truncate">
                                {course.title}
                              </p>
                              <p className="text-[11px] font-mono text-amber-800 mt-0.5">
                                {formatCoursePrice(course.amount)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemove(course.id)}
                              disabled={isRemoving}
                              className="self-start text-stone-400 hover:text-red-700 font-mono text-[11px] uppercase font-bold flex items-center gap-1 mt-2 disabled:cursor-not-allowed disabled:hover:text-stone-400"
                            >
                              <Trash2 className="w-3 h-3" />
                              {isRemoving ? "Removing..." : "Remove"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {items.length > 0 && (
                <div className="p-6 border-t border-stone-200 bg-stone-50 space-y-4">
                  <div className="flex justify-between items-center text-sm font-extrabold font-serif text-stone-900">
                    <span>Subtotal</span>
                    <span className="font-mono text-amber-800">{formatCoursePrice(subtotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onPurchase}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-mono text-sm font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200 transform hover:scale-[1.01]"
                  >
                    <CreditCard className="w-4 h-4" />
                    Purchase
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
