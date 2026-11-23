"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import type { Peran } from "@/types/database";
import { cx } from "@/lib/cx";
import { MENU_PERAN } from "./menu-peran";

function Daftar({ peran, pathname, ponsel }: { peran: Peran; pathname: string; ponsel?: boolean }) {
  const items = MENU_PERAN[peran] ?? [];
  const banyak = ponsel && items.length > 5;
  return (
    <ul className={banyak ? "flex overflow-x-auto px-1" : ponsel ? "grid auto-cols-fr grid-flow-col" : "flex flex-col gap-1"}>
      {items.map((m) => {
        // Ringkasan hanya aktif di path persisnya; item lain juga di sub-halamannya.
        const aktif =
          m.href === items[0].href ? pathname === m.href : pathname === m.href || pathname.startsWith(`${m.href}/`);
        return (
          <li key={m.href} className={banyak ? "shrink-0" : undefined}>
            <Link
              href={m.href}
              aria-current={aktif ? "page" : undefined}
              className={cx(
                ponsel
                  ? "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs"
                  : "flex min-h-touch items-center gap-3 rounded-md px-3 font-display",
                banyak && "px-3 whitespace-nowrap",
                aktif ? "font-semibold text-primary" : "text-text",
                !ponsel && (aktif ? "bg-accent-subtle" : "hover:bg-surface-sunken"),
              )}
            >
              <span
                aria-hidden
                className={cx(ponsel && "grid h-7 w-12 place-items-center rounded-full", ponsel && aktif && "bg-accent-subtle")}
              >
                <m.ikon className="size-5" />
              </span>
              {m.label}
            </Link>
          </li>
        );
      })}
    </ul>
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
