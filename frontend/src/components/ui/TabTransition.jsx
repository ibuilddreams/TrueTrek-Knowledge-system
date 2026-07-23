"use client";

import { AnimatePresence, motion } from "motion/react";

export default function TabTransition({ activeKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.22 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
