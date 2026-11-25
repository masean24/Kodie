"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { aksiKeluar } from "@/app/(auth)/aksi";
import { cx } from "@/lib/cx";

type Props = { nama: string; peranLabel: string; dashboard: string };

function Inisial({ nama }: { nama: string }) {
  const i = nama
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-subtle text-base font-bold text-primary">
      {i}
    </span>
  );
}

function TombolKeluar({ penuh }: { penuh?: boolean }) {
  return (
    <form action={aksiKeluar}>
      <button
        type="submit"
        className={cx(
          "flex min-h-touch w-full items-center gap-3 rounded-md px-3 text-left font-display font-semibold text-danger hover:bg-danger-subtle",
          penuh && "justify-center border-[1.5px] border-border-strong rounded-full",
        )}
      >
        <LogOut aria-hidden className="size-5" /> Keluar
      </button>
    </form>
  );
}

/** Menu akun di header desktop. */
export function MenuAkun({ nama, peranLabel, dashboard }: Props) {
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const klik = (e: MouseEvent) => {
      if (!akar.current?.contains(e.target as Node)) setBuka(false);
    };
    const tombol = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", tombol);
    return () => {
      document.removeEventListener("mousedown", klik);
      document.removeEventListener("keydown", tombol);
    };
  }, [buka]);

  return (
    <div ref={akar} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={buka}
        aria-controls="menu-akun"
        onClick={() => setBuka((b) => !b)}
        className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-surface-sunken"
      >
        <Inisial nama={nama} />
        <span className="min-w-0 max-w-[140px] truncate text-base font-bold text-text">{nama}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0" />
        <span className="sr-only">, menu akun</span>
      </button>
      <div
        id="menu-akun"
        hidden={!buka}
        className="absolute right-0 top-full mt-2 w-64 rounded-card-sm border border-border bg-surface-raised p-2 shadow-lg"
      >
        <p className="px-3 py-2 text-sm text-text-muted">Masuk sebagai {peranLabel}</p>
        <Link
          href={dashboard}
          onClick={() => setBuka(false)}
          className="flex min-h-touch items-center gap-3 rounded-md px-3 font-display font-semibold hover:bg-surface-sunken"
        >
          <LayoutDashboard aria-hidden className="size-5" /> Dashboard
        </Link>
        <TombolKeluar />
      </div>
    </div>
  );
}

/** Versi menu akun di panel menu ponsel. */
export function MenuAkunPonsel({ nama, peranLabel, dashboard }: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center gap-3">
        <Inisial nama={nama} />
        <div className="min-w-0">
          <p className="truncate font-display font-semibold">{nama}</p>
          <p className="text-sm text-text-muted">{peranLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={dashboard}
          className="flex min-h-touch items-center justify-center rounded-full bg-primary px-5 font-display font-semibold text-primary-foreground"
        >
          Dashboard
        </Link>
        <TombolKeluar penuh />
      </div>
    </div>
  );
}
