"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Menu, MessageCircle } from "lucide-react";
import type { Peran } from "@/types/database";
import { AvatarKiko } from "@/components/chatbot/avatar-kiko";
import { cx } from "@/lib/cx";
import { MENU_PERAN, NAMA_WORKSPACE, type ItemMenu } from "./menu-peran";

function bukaKiko() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("kodie:buka-kiko"));
  }
}

function apakahAktif(href: string, pertamaHref: string, pathname: string) {
  return href === pertamaHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Angka antrean per kolom ringkasan admin, untuk lencana di sidebar. */
export type AngkaNav = Partial<Record<NonNullable<ItemMenu["angka"]>, number>>;

function ItemDesktop({ m, aktif, angka }: { m: ItemMenu; aktif: boolean; angka?: number }) {
  return (
    <li>
      <Link
        href={m.href}
        aria-current={aktif ? "page" : undefined}
        className={cx(
          "relative flex min-h-[44px] items-center gap-3 rounded-[10px] px-3.5 py-2 text-[15px] leading-6 transition-colors",
          aktif ? "kodie-nav-item-aktif font-semibold" : "font-medium text-text-muted hover:bg-surface-sunken hover:text-text",
        )}
      >
        {aktif ? <span aria-hidden className="kodie-nav-indikator absolute top-2 bottom-2 left-1 w-[3.5px] rounded-full" /> : null}
        <m.ikon aria-hidden className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{m.label}</span>
        {angka ? (
          <span className="ml-auto inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-warning-subtle px-1.5 text-sm font-bold tabular-nums text-warning ring-1 ring-warning/25 ring-inset">
            {angka}
            <span className="sr-only"> menunggu</span>
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function DaftarDesktop({ peran, pathname, angka }: { peran: Peran; pathname: string; angka?: AngkaNav }) {
  const items = MENU_PERAN[peran] ?? [];
  const pertamaHref = items[0]?.href ?? "";
  // Kelompokkan item berurutan dengan `grup` yang sama (admin); peran lain satu kelompok tanpa judul.
  const kelompok: { grup?: string; items: ItemMenu[] }[] = [];
  for (const m of items) {
    const akhir = kelompok.at(-1);
    if (akhir && akhir.grup === m.grup) akhir.items.push(m);
    else kelompok.push({ grup: m.grup, items: [m] });
  }
  return (
    <div className="w-[248px] rounded-card border border-border bg-surface p-3 shadow-kartu">
      <div className="mb-2 border-b border-border px-3 pb-2.5">
        <p className="text-sm font-bold tracking-[0.08em] text-text-muted uppercase">Workspace</p>
        <p className="font-display text-base font-bold text-text">{NAMA_WORKSPACE[peran]}</p>
      </div>
      <div className="flex flex-col gap-3">
        {kelompok.map((k, i) => (
          <div key={k.grup ?? i}>
            {k.grup ? <p className="px-3 pb-1 text-sm font-bold tracking-[0.04em] text-text-muted uppercase">{k.grup}</p> : null}
            <ul className="flex flex-col gap-0.5">
              {k.items.map((m) => (
                <ItemDesktop
                  key={m.href}
                  m={m}
                  aktif={apakahAktif(m.href, pertamaHref, pathname)}
                  angka={m.angka ? angka?.[m.angka] : undefined}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      {peran !== "admin" ? (
        <div className="mt-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={bukaKiko}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken"
          >
            <AvatarKiko ukuran="kecil" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base leading-tight font-bold text-text">
                Tanya Kiko AI
              </span>
              <span className="block truncate text-sm text-text-muted">Butuh bantuan di sini?</span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
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
          className="absolute bottom-full right-2 mb-2 w-60 rounded-[10px] border border-border bg-surface-raised p-2 shadow-mengambang"
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
                      "flex min-h-[44px] items-center gap-3 rounded-[6px] px-3 py-2 text-17 leading-[27px] transition-colors",
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
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-sm leading-5 tracking-[0.1px]",
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

        {peran !== "admin" ? (
          <li>
            <button
              type="button"
              onClick={() => {
                setBuka(false);
                bukaKiko();
              }}
              className="flex min-h-[56px] w-full flex-col items-center justify-center gap-1 py-1.5 text-sm leading-5 tracking-[0.1px] text-text-muted transition-colors hover:text-primary"
            >
              <span aria-hidden className="grid place-items-center rounded-full px-4 py-1">
                <MessageCircle className="size-[22px]" />
              </span>
              <span className="truncate">Kiko</span>
            </button>
          </li>
        ) : null}

        {lainnya.length > 0 ? (
          <li>
            <button
              type="button"
              aria-expanded={buka}
              aria-controls="menu-lainnya-ponsel"
              onClick={() => setBuka((v) => !v)}
              className={cx(
                "flex min-h-[56px] w-full flex-col items-center justify-center gap-1 py-1.5 text-sm leading-5 tracking-[0.1px]",
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

type PropsNav = { peran: Peran; ponsel?: boolean; angka?: AngkaNav };

function Daftar(props: PropsNav & { pathname: string }) {
  return props.ponsel ? (
    <DaftarPonsel peran={props.peran} pathname={props.pathname} />
  ) : (
    <DaftarDesktop peran={props.peran} pathname={props.pathname} angka={props.angka} />
  );
}

function Aktif(props: PropsNav) {
  return <Daftar {...props} pathname={usePathname()} />;
}

/** usePathname hanya ada saat request, jadi dibungkus Suspense (Cache Components). */
export function NavPeran({ peran, ponsel, angka }: PropsNav) {
  return (
    <Suspense fallback={<Daftar peran={peran} pathname="" ponsel={ponsel} angka={angka} />}>
      <Aktif peran={peran} ponsel={ponsel} angka={angka} />
    </Suspense>
  );
}
