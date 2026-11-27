import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Konten muncul halus (fade + naik) saat pertama masuk layar. Animasinya dijalankan `AnimasiElemen`
 * (GSAP + IntersectionObserver, `components/situs/animasi-elemen.tsx`), bukan Motion, sehingga:
 * - HTML server sudah terlihat (tanpa `opacity: 0` bawaan), jadi tidak menunda LCP;
 * - konten yang sudah di layar saat halaman dimuat tidak disembunyikan ulang;
 * - library Motion tidak perlu dimuat di setiap halaman.
 * `tunda` (detik) dipakai sebagai jeda tambahan untuk efek berurutan pada daftar kartu.
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
  const Komponen = as;
  return (
    <Komponen data-animasi="" data-tunda={tunda > 0 ? tunda : undefined} className={className}>
      {children}
    </Komponen>
  );
}

/** Kartu yang sedikit terangkat (6 px, pantulan lembut) saat di-hover. CSS murni, tanpa Motion. */
export function AngkatHover({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
