"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import type { Peran } from "@/types/database";
import { cx } from "@/lib/cx";
import { MENU_PERAN } from "./menu-peran";

function apakahAktif(href: string, pertamaHref: string, pathname: string) {
  return href === pertamaHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function DaftarDesktop({ peran, pathname }: { peran: Peran; pathname: string }) {
  const items = MENU_PERAN[peran] ?? [];
  const pertamaHref = items[0]?.href ?? "";
  return (
    <ul className="flex min-h-[420px] w-[260px] flex-col gap-1 rounded-card-sm bg-surface px-3 py-4">
      {items.map((m) => {
        const aktif = apakahAktif(m.href, pertamaHref, pathname);
        return (
          <li key={m.href}>
            <Link
              href={m.href}
              aria-current={aktif ? "page" : undefined}
              className={cx(
                "flex min-h-[48px] items-center gap-3 rounded-[10px] px-4 py-3 text-[17px] leading-[27px] transition-colors",
                aktif ? "bg-accent-subtle font-bold text-primary" : "font-normal text-text hover:bg-surface-sunken",
              )}
            >
              <m.ikon aria-hidden className="size-5 shrink-0" />
              <span>{m.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function DaftarPonsel({ peran, pathname }: { peran: Peran; pathname: string }) {
  const items = MENU_PERAN[peran] ?? [];
  const pertamaHref = items[0]?.href ?? "";
  const pakaiLainnya = items.some((m) => m.utamaPonsel);
  const utama = pakaiLainnya ? items.filter((m) => m.utamaPonsel) : items;
  const lainnya = pakaiLainnya ? items.filter((m) => !m.utamaPonsel) : [];
  const lainnyaAktif = lainnya.some((m) => apakahAktif(m.href, pertamaHref, pathname));

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
    <div ref={akar} className="relative">
      {lainnya.length > 0 && buka ? (
        <div
          id="menu-lainnya-ponsel"
          className="absolute bottom-full right-2 mb-2 w-60 rounded-[10px] border border-border bg-surface-raised p-2 shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {lainnya.map((m) => {
              const aktif = apakahAktif(m.href, pertamaHref, pathname);
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    aria-current={aktif ? "page" : undefined}
                    onClick={() => setBuka(false)}
                    className={cx(
                      "flex min-h-[44px] items-center gap-3 rounded-[6px] px-3 py-2 text-[17px] leading-[27px] transition-colors",
                      aktif ? "bg-accent-subtle font-bold text-primary" : "text-text hover:bg-surface-sunken",
                    )}
                  >
                    <m.ikon aria-hidden className="size-5 shrink-0" />
                    <span>{m.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <ul className="grid auto-cols-fr grid-flow-col bg-surface px-1 py-2">
        {utama.map((m) => {
          const aktif = apakahAktif(m.href, pertamaHref, pathname);
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                onClick={() => setBuka(false)}
                className={cx(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-[14px] leading-5 tracking-[0.1px]",
                  aktif ? "text-primary" : "text-text-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cx("grid place-items-center rounded-full px-4 py-1", aktif && "bg-accent-subtle")}
                >
                  <m.ikon className="size-[22px]" />
                </span>
                <span className="truncate">{m.labelPonsel ?? m.label}</span>
              </Link>
            </li>
          );
        })}

        {lainnya.length > 0 ? (
          <li>
            <button
              type="button"
              aria-expanded={buka}
              aria-controls="menu-lainnya-ponsel"
              onClick={() => setBuka((v) => !v)}
              className={cx(
                "flex min-h-[56px] w-full flex-col items-center justify-center gap-1 py-1.5 text-[14px] leading-5 tracking-[0.1px]",
                lainnyaAktif || buka ? "text-primary" : "text-text-muted",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "grid place-items-center rounded-full px-4 py-1",
                  (lainnyaAktif || buka) && "bg-accent-subtle",
                )}
              >
                <Menu className="size-[22px]" />
              </span>
              <span>Lainnya</span>
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function Daftar(props: { peran: Peran; pathname: string; ponsel?: boolean }) {
  return props.ponsel ? (
    <DaftarPonsel peran={props.peran} pathname={props.pathname} />
  ) : (
    <DaftarDesktop peran={props.peran} pathname={props.pathname} />
  );
}

function Aktif(props: { peran: Peran; ponsel?: boolean }) {
  return <Daftar {...props} pathname={usePathname()} />;
}

/** usePathname hanya ada saat request, jadi dibungkus Suspense (Cache Components). */
export function NavPeran({ peran, ponsel }: { peran: Peran; ponsel?: boolean }) {
  return (
    <Suspense fallback={<Daftar peran={peran} pathname="" ponsel={ponsel} />}>
      <Aktif peran={peran} ponsel={ponsel} />
    </Suspense>
  );
}
