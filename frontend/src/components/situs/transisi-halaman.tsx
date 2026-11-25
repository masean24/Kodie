import { ViewTransition, type ReactNode } from "react";
import { Kontainer } from "@/components/ui/dasar";
import { cx } from "@/lib/cx";
import { TombolKembali } from "./tombol-kembali";

/**
 * Baris tombol kembali di atas isi halaman. Disembunyikan bila halaman punya band biru (`.vt-band`:
 * beranda tidak butuh tombol kembali, BandKodie punya tombolnya sendiri di dalam band) atau sudah punya
 * tautan kembali sendiri (ikon bertanda `data-kembali`, mis. "Kembali ke katalog").
 *
 * Pemeriksaan `:has` sengaja dibatasi ke pembungkus halaman ini, bukan `<main>`: Next.js menyimpan halaman
 * sebelumnya secara tersembunyi di DOM, jadi band halaman lama tidak boleh ikut terhitung.
 */
export function BarisKembali({ children, diArea }: { children: ReactNode; diArea?: boolean }) {
  const kelas = cx(
    "tanpa-cetak group-has-[.vt-band]/halaman:hidden group-has-[[data-kembali]]/halaman:hidden",
    diArea ? "mb-6" : "pt-4 md:pt-6",
  );
  return (
    <div className="group/halaman">
      {diArea ? (
        <div data-tanpa-animasi className={kelas}>
          <TombolKembali />
        </div>
      ) : (
        <Kontainer data-tanpa-animasi className={kelas}>
          <TombolKembali />
        </Kontainer>
      )}
      {children}
    </div>
  );
}

/**
 * Animasi masuk/keluar konten saat pindah halaman (React `<ViewTransition>` + View Transitions API).
 * Dipakai di `template.tsx` tiap grup rute: template di-mount ulang setiap navigasi, sehingga
 * `enter` dan `exit` terpicu. Kelas animasi `.halaman` ada di `globals.css`.
 * Browser tanpa dukungan View Transitions tetap berpindah halaman seperti biasa.
 *
 * `diArea`: halaman area login dirender di kolom isi `LayoutArea`, jadi baris kembali tidak memakai Kontainer.
 */
export function TransisiHalaman({ children, diArea }: { children: ReactNode; diArea?: boolean }) {
  return (
    <ViewTransition enter="halaman" exit="halaman" default="none">
      <div>
        <BarisKembali diArea={diArea}>{children}</BarisKembali>
      </div>
    </ViewTransition>
  );
}
