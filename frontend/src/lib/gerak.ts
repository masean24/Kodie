/** `true` bila pengguna meminta gerak dikurangi; animasi lalu dilewati atau dibuat instan. */
export function kurangiGerak() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Padanan kurva GSAP untuk Web Animations API, supaya gerak tetap sama setelah GSAP dilepas. */
export const KURVA = {
  /** `power2.out` (cubic keluar). */
  keluar: "cubic-bezier(0.215, 0.61, 0.355, 1)",
  /** `power2.in` (cubic masuk). */
  masuk: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
  /** `back.out(1.6)`: sedikit melewati target lalu kembali. */
  pantul: "cubic-bezier(0.34, 1.5, 0.64, 1)",
} as const;
