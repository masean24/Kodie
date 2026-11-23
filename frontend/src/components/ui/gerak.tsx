"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";

/** Konfigurasi Motion untuk seluruh situs: animasi transform dimatikan bila `prefers-reduced-motion`. */
export function PenyediaGerak({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * Konten muncul halus (fade + naik) saat pertama masuk layar.
 * `tunda` dalam detik, berguna untuk efek berurutan pada daftar kartu.
 */
export function Muncul({
  children,
  tunda = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  tunda?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const Komponen = as === "li" ? motion.li : motion.div;
  return (
    <Komponen
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.6, delay: tunda, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Komponen>
  );
}

/** Kartu yang sedikit terangkat saat di-hover. */
export function AngkatHover({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}
