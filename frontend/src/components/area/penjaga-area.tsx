import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Peran } from "@/types/database";
import { ambilPenggunaSaya } from "@/lib/api/auth";

/**
 * Pemeriksaan peran yang menentukan untuk setiap area login (PRD bagian 6):
 * belum login ke /masuk, peran lain ke /403. Harus dirender di dalam <Suspense>.
 */
export async function PenjagaArea({ peran, children }: { peran: Peran; children: ReactNode }) {
  const p = await ambilPenggunaSaya();
  if (!p) redirect("/masuk");
  if (p.peran !== peran) redirect("/403");
  return <>{children}</>;
}
