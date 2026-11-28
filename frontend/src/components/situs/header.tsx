"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Kontainer } from "@/components/ui/dasar";
import { cx } from "@/lib/cx";
import { ThemeSwitch } from "./kontrol-header";
import { Logo } from "./logo";

const MENU = [
  { href: "/program", label: "Program" },
  { href: "/kelas", label: "Kelas" },
  { href: "/tes-minat", label: "Tes minat" },
  { href: "/lab", label: "Kodie Lab" },
  { href: "/showcase", label: "Showcase" },
];

function aktif(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DaftarMenu({ mobile, pathname, onPilih }: { mobile: boolean; pathname: string; onPilih: () => void }) {
  return MENU.map((m) => {
    const ini = aktif(pathname, m.href);
    return (
      <li key={m.href}>
        <Link
          href={m.href}
          aria-current={ini ? "page" : undefined}
          onClick={onPilih}
          className={cx(
            "flex min-h-[44px] items-center whitespace-nowrap rounded-full py-2 text-17 leading-[27px] transition-colors",
            mobile ? "w-full px-4" : "px-3",
            ini ? "bg-accent-subtle font-bold text-primary" : "font-normal text-text hover:bg-surface-sunken",
          )}
        >
          {m.label}
        </Link>
      </li>
    );
  });
}

/** usePathname hanya tersedia saat request, jadi dibungkus Suspense (Cache Components). */
function MenuAktif(props: { mobile: boolean; onPilih: () => void }) {
  return <DaftarMenu {...props} pathname={usePathname()} />;
}

/**
 * `true` setelah halaman di-scroll sedikit. Ambang naik dan turun dibedakan (histeresis) agar header
 * tidak berkedip bolak-balik saat posisi scroll berhenti di sekitar ambang.
 */
function useMengambang() {
  const [mengambang, setMengambang] = useState(false);
  useEffect(() => {
    let bingkai = 0;
    const periksa = () => {
      bingkai = 0;
      const y = window.scrollY;
      setMengambang((m) => (m ? y > 4 : y > 24));
    };
    const saatScroll = () => {
      if (!bingkai) bingkai = requestAnimationFrame(periksa);
    };
    periksa();
    window.addEventListener("scroll", saatScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", saatScroll);
      if (bingkai) cancelAnimationFrame(bingkai);
    };
  }, []);
  return mengambang;
}

/**
 * Di puncak halaman header berupa bar penuh. Setelah di-scroll, panel latarnya menyusut menjadi kaca melayang
 * (`.hdr-panel` di `globals.css`), sementara isi header tetap di tempat.
 *
 * `akun`, `akunPonsel`, dan `loncengPonsel` diisi Server Component (`components/situs/kerangka-situs.tsx`):
 * tombol Masuk/Daftar untuk tamu, atau lonceng notifikasi + menu akun untuk pengguna login.
 */
export function Header({
  akun,
  akunPonsel,
  loncengPonsel,
}: {
  akun: ReactNode;
  akunPonsel: ReactNode;
  loncengPonsel?: ReactNode;
}) {
  const [buka, setBuka] = useState(false);
  const mengambang = useMengambang();

  useEffect(() => {
    if (!buka) return;
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    window.addEventListener("keydown", tutup);
    // Kunci scroll halaman di belakang laci; nilai lama dipulihkan saat laci ditutup.
    const html = document.documentElement;
    const overflowLama = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tutup);
      html.style.overflow = overflowLama;
    };
  }, [buka]);

  const tautan = (mobile: boolean) => {
    const onPilih = () => setBuka(false);
    return (
      <Suspense fallback={<DaftarMenu mobile={mobile} pathname="" onPilih={onPilih} />}>
        <MenuAktif mobile={mobile} onPilih={onPilih} />
      </Suspense>
    );
  };

  return (
    <header
      data-situs
      data-mengambang={mengambang ? "" : undefined}
      className="hdr group/hdr sticky top-0 z-30"
    >
      {/* Latar penangkap ketukan saat laci ponsel terbuka: ketukan di luar laci menutupnya dan tidak tembus
          ke halaman di belakang. Diletakkan sebelum bar dan laci, jadi keduanya tetap di atasnya. */}
      {buka ? (
        <div
          aria-hidden
          onClick={() => setBuka(false)}
          className="pointer-events-auto fixed inset-0 bg-slate-950/30 xl:hidden"
        />
      ) : null}
      <div className="relative">
        {/* Blur memakai utilitas Tailwind: deklarasi `backdrop-filter` manual dibuang Lightning CSS di build. */}
        <div aria-hidden className="hdr-panel vt-header-panel backdrop-blur-lg backdrop-saturate-150" />
        <Kontainer className="hdr-isi vt-header relative flex h-[72px] items-center justify-between gap-2 xl:gap-4">
          <Logo ringkasSaatMasukPonsel />
          <nav aria-label="Menu utama" className="hidden shrink-0 xl:block">
            <ul className="flex items-center gap-1">{tautan(false)}</ul>
          </nav>
          {/* Sisa lebar diisi area kanan (rata kanan). Menu utama selalu tepat setelah logo, jadi posisinya sama
              antara tamu (Masuk/Daftar) dan pengguna login (termasuk Admin). Lebar tetap 516 px sebelumnya membuat
              isi header lebih lebar dari Kontainer, sehingga tombol Daftar keluar dari panel kaca saat di-scroll. */}
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 xl:flex">
            <ThemeSwitch />
            {akun}
          </div>
          <div className="flex items-center gap-2 xl:hidden">
            {loncengPonsel}
            <button
              type="button"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-[1.5px] border-border-strong px-3 py-2"
              aria-expanded={buka}
              aria-controls="menu-ponsel"
              aria-label={buka ? "Tutup menu" : "Buka menu"}
              onClick={() => setBuka((b) => !b)}
            >
              {buka ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            </button>
          </div>
        </Kontainer>
      </div>
      <div
        id="menu-ponsel"
        hidden={!buka}
        className={cx(
          // Absolute di bawah bar: laci menimpa konten halaman, tinggi header (dan posisi halaman) tidak berubah.
          "hdr-laci hdr-isi absolute inset-x-0 top-full max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-border bg-surface shadow-kartu-hover xl:hidden",
          mengambang && "backdrop-blur-lg backdrop-saturate-150",
        )}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setBuka(false);
        }}
      >
        <Kontainer className="flex flex-col gap-4 py-4">
          <nav aria-label="Menu utama ponsel">
            <ul className="flex flex-col gap-1">{tautan(true)}</ul>
          </nav>
          <div className="border-t border-border pt-4">
            <ThemeSwitch penuh />
          </div>
          {akunPonsel}
        </Kontainer>
      </div>
    </header>
  );
}
