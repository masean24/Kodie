"use client";

import { useEffect } from "react";

/** Jeda sebelum halaman digulir dari band judul ke ruang kerja Lab. */
const JEDA_MS = 1000;

/**
 * Saat /lab dibuka, pengunjung melihat band judul dulu. Setelah 1 detik halaman digulir otomatis ke
 * ruang kerja (elemen `#idTarget`). Guliran dibatalkan bila pengunjung sudah menggulir sendiri dalam
 * jeda itu, atau membuka halaman dengan posisi scroll yang dipulihkan (misalnya tombol kembali).
 * Dengan `prefers-reduced-motion`, guliran terjadi tanpa animasi.
 */
export function GulirKeLab({ idTarget }: { idTarget: string }) {
  useEffect(() => {
    let dibatalkan = false;
    const batal = () => {
      dibatalkan = true;
    };
    // Gerakan pengguna sendiri membatalkan guliran otomatis.
    window.addEventListener("wheel", batal, { passive: true, once: true });
    window.addEventListener("touchmove", batal, { passive: true, once: true });
    window.addEventListener("keydown", batal, { once: true });

    const waktu = window.setTimeout(() => {
      if (dibatalkan || window.scrollY > 8) return;
      const target = document.getElementById(idTarget);
      if (!target) return;
      const halus = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: halus ? "smooth" : "auto", block: "start" });
    }, JEDA_MS);

    return () => {
      window.clearTimeout(waktu);
      window.removeEventListener("wheel", batal);
      window.removeEventListener("touchmove", batal);
      window.removeEventListener("keydown", batal);
    };
  }, [idTarget]);

  return null;
}
