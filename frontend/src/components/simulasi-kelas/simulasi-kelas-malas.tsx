"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function Kerangka() {
  return (
    <div
      role="status"
      aria-label="Memuat simulasi kelas"
      className="h-[640px] animate-pulse rounded-[24px] bg-[#0b1220] lg:h-[690px]"
    />
  );
}

const SimulasiKelas = dynamic(() => import("./simulasi-kelas"), { ssr: false, loading: Kerangka });

/**
 * Memuat simulasi kelas live hanya saat pengunjung sudah mendekati section-nya (±600 px sebelum terlihat),
 * jadi kode dan DOM simulasi tidak ikut muatan awal beranda dan tidak memengaruhi LCP.
 */
export function SimulasiKelasMalas() {
  const penanda = useRef<HTMLDivElement>(null);
  const [muat, setMuat] = useState(false);

  useEffect(() => {
    const el = penanda.current;
    if (!el || muat) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setMuat(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [muat]);

  return (
    <div ref={penanda} data-tanpa-animasi>
      {muat ? <SimulasiKelas /> : <Kerangka />}
    </div>
  );
}
