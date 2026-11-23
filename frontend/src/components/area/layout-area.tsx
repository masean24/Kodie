import { Suspense, type ReactNode } from "react";
import type { Peran } from "@/types/database";
import { Kerangka, Kontainer, StatusMemuat } from "@/components/ui/dasar";
import { KerangkaSitus } from "@/components/situs/kerangka-situs";
import { PenjagaArea } from "./penjaga-area";
import { NavPeran } from "./nav-peran";
import { adaNavPeran } from "./menu-peran";

/** Layout bersama area login: kerangka situs, menu peran, dan penjaga peran. */
export function LayoutArea({ peran, children }: { peran: Peran; children: ReactNode }) {
  const nav = adaNavPeran(peran);
  return (
    <KerangkaSitus ruangBawah={nav}>
      <Kontainer className={nav ? "grid gap-8 pb-24 lg:grid-cols-[220px_1fr] lg:pb-12" : ""}>
        {nav ? (
          <>
            <nav aria-label="Menu akun" className="hidden pt-10 lg:block">
              <NavPeran peran={peran} />
            </nav>
            <nav
              aria-label="Menu akun ponsel"
              className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
            >
              <NavPeran peran={peran} ponsel />
            </nav>
          </>
        ) : null}
        <div className="min-w-0 py-10 md:py-12">
          <Suspense
            fallback={
              <div className="flex flex-col gap-6">
                <StatusMemuat label="Memeriksa akun…" />
                <Kerangka className="h-40" />
                <Kerangka className="h-64" />
              </div>
            }
          >
            <PenjagaArea peran={peran}>{children}</PenjagaArea>
          </Suspense>
        </div>
      </Kontainer>
    </KerangkaSitus>
  );
}
