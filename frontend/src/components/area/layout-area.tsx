import { Suspense, type ReactNode } from "react";
import type { Peran } from "@/types/database";
import { Kerangka, Kontainer, StatusMemuat } from "@/components/ui/dasar";
import { KerangkaSitus } from "@/components/situs/kerangka-situs";
import { PenjagaArea } from "./penjaga-area";

/** Layout bersama area login: kerangka situs + penjaga peran. */
export function LayoutArea({ peran, children }: { peran: Peran; children: ReactNode }) {
  return (
    <KerangkaSitus>
      <Suspense
        fallback={
          <Kontainer className="flex flex-col gap-6 py-10">
            <StatusMemuat label="Memeriksa akun…" />
            <Kerangka className="h-40" />
            <Kerangka className="h-64" />
          </Kontainer>
        }
      >
        <PenjagaArea peran={peran}>{children}</PenjagaArea>
      </Suspense>
    </KerangkaSitus>
  );
}
