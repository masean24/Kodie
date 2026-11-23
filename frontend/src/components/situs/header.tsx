"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Kontainer } from "@/components/ui/dasar";
import { cx } from "@/lib/cx";
import { Logo } from "./logo";

const MENU = [
  { href: "/program", label: "Program" },
  { href: "/kelas", label: "Kelas" },
  { href: "/tes-minat", label: "Tes minat" },
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
            "flex min-h-touch items-center rounded-full px-4 font-display",
            mobile && "w-full",
            ini ? "bg-accent-subtle font-semibold text-primary" : "text-text hover:bg-surface-sunken",
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
 * `akun` dan `akunPonsel` diisi Server Component (components/situs/akun-header.tsx):
 * tombol Masuk/Daftar untuk tamu, atau menu akun untuk pengguna yang login.
 */
export function Header({ akun, akunPonsel }: { akun: ReactNode; akunPonsel: ReactNode }) {
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (!buka) return;
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
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
    <header data-situs className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <Kontainer className="flex h-[72px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Menu utama" className="hidden md:block">
          <ul className="flex items-center gap-1">{tautan(false)}</ul>
        </nav>
        <div className="hidden items-center gap-3 md:flex">{akun}</div>
        <button
          type="button"
          className="grid size-touch place-items-center rounded-full border-[1.5px] border-border-strong md:hidden"
          aria-expanded={buka}
          aria-controls="menu-ponsel"
          aria-label={buka ? "Tutup menu" : "Buka menu"}
          onClick={() => setBuka((b) => !b)}
        >
          {buka ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </Kontainer>
      <div
        id="menu-ponsel"
        hidden={!buka}
        className="border-t border-border bg-surface md:hidden"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setBuka(false);
        }}
      >
        <Kontainer className="flex flex-col gap-4 py-4">
          <nav aria-label="Menu utama ponsel">
            <ul className="flex flex-col gap-1">{tautan(true)}</ul>
          </nav>
          {akunPonsel}
        </Kontainer>
      </div>
    </header>
  );
}
