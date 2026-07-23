"use client";

import { AnimatePresence, motion } from "motion/react";

export default function TabTransition({ activeKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        exit={{ y: -6 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
