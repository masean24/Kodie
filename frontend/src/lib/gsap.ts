"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** `true` bila pengguna meminta gerak dikurangi; animasi GSAP lalu dilewati atau dibuat instan. */
export function kurangiGerak() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, useGSAP };
