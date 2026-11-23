import { ViewTransition, type ReactNode } from "react";

/**
 * Animasi masuk/keluar konten saat pindah halaman (React `<ViewTransition>` + View Transitions API).
 * Dipakai di `template.tsx` tiap grup rute: template di-mount ulang setiap navigasi, sehingga
 * `enter` dan `exit` terpicu. Kelas animasi `.halaman` ada di `globals.css`.
 * Browser tanpa dukungan View Transitions tetap berpindah halaman seperti biasa.
 */
export function TransisiHalaman({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="halaman" exit="halaman" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
