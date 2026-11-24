"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { inisialNama } from "@/lib/nama";

/** Gambar yang gagal dimuat atau hanya placeholder kecil (misalnya 1×1 piksel) dianggap tidak ada. */
function fotoTidakLayak(img: HTMLImageElement) {
  return img.complete && (img.naturalWidth <= 8 || img.naturalHeight <= 8);
}

/**
 * Avatar pengajar: foto profil jika ada dan layak, selain itu inisial nama di lingkaran berkontras AA.
 * Pemeriksaan juga dijalankan setelah hidrasi, karena event `load`/`error` bisa terjadi sebelum React aktif.
 */
export function Avatar({ nama, foto, besar }: { nama: string; foto: string | null; besar?: boolean }) {
  const ukuran = besar ? "size-24 text-3xl" : "size-14 text-xl";
  const [gagal, setGagal] = useState(false);
  const gambar = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = gambar.current;
    if (img && fotoTidakLayak(img)) setGagal(true);
  }, [foto]);

  if (foto && !gagal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto dari bucket publik Supabase
      <img
        ref={gambar}
        src={foto}
        alt=""
        onLoad={(e) => fotoTidakLayak(e.currentTarget) && setGagal(true)}
        onError={() => setGagal(true)}
        className={cx(ukuran, "shrink-0 rounded-full object-cover")}
      />
    );
  }
  return (
    <span aria-hidden className={cx(ukuran, "grid shrink-0 place-items-center rounded-full bg-primary font-display font-semibold text-primary-foreground")}>
      {inisialNama(nama)}
    </span>
  );
}
