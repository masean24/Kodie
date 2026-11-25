"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cx } from "@/lib/cx";

/** Segmen pertama yang punya halaman indeks sendiri, dipakai sebagai tujuan cadangan. */
const INDEKS = new Set(["program", "kelas", "karier", "tes-minat", "siswa", "orang-tua", "mengajar", "admin"]);

/**
 * Tujuan bila tidak ada halaman Kodie sebelumnya di riwayat (misalnya halaman dibuka langsung dari tautan luar):
 * `/kelas/abc` → `/kelas`, `/mengajar/sesi/x/playbook` → `/mengajar`, halaman satu segmen → beranda.
 */
export function tujuanCadangan(pathname: string): string {
  const segmen = pathname.split("/").filter(Boolean);
  if (segmen.length > 1 && INDEKS.has(segmen[0]!)) return `/${segmen[0]}`;
  return "/";
}

type NavigasiBrowser = { canGoBack?: boolean };

/**
 * Tombol kembali ke halaman sebelumnya. Memakai riwayat browser bila halaman sebelumnya masih di Kodie
 * (Navigation API `canGoBack` hanya bernilai true untuk entri dari origin yang sama). Browser tanpa
 * Navigation API, atau kunjungan yang datang dari situs lain, diarahkan ke halaman induk.
 */
export function TombolKembali({ diBlok, className }: { diBlok?: boolean; className?: string }) {
  const router = useRouter();

  const kembali = () => {
    const nav = (window as unknown as { navigation?: NavigasiBrowser }).navigation;
    const dariKodie = nav
      ? nav.canGoBack === true
      : document.referrer.startsWith(window.location.origin) && window.history.length > 1;
    if (dariKodie) router.back();
    else router.push(tujuanCadangan(window.location.pathname));
  };

  return (
    <button
      type="button"
      onClick={kembali}
      className={cx(
        "inline-flex min-h-touch items-center gap-2 rounded-full px-4 font-display text-sm font-semibold transition-colors",
        diBlok
          ? "bg-white/15 text-white ring-1 ring-white/40 hover:bg-white/25"
          : "border-[1.5px] border-border-strong bg-surface text-text hover:bg-surface-sunken",
        className,
      )}
    >
      <ArrowLeft aria-hidden className="size-4" />
      Kembali
    </button>
  );
}
