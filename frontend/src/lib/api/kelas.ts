import { connection } from "next/server";
import type { KelasKatalog } from "@/types/database";
import { buatKelasMock } from "@/lib/mock/data";
import { saringKelas, urutkanKelas, type FilterKelas } from "@/lib/kelas";
import { clientPublik } from "@/lib/supabase/publik";
import { lemparJikaError, pakaiMock } from "./sumber";

/**
 * Hanya untuk Server Component. Sisa kursi dan status bisa dipesan bergantung waktu,
 * jadi data dibaca saat request (connection()), bukan saat build.
 */
async function semuaKelas(): Promise<KelasKatalog[]> {
  await connection();
  if (pakaiMock) return buatKelasMock(new Date());
  const { data, error } = await clientPublik().from("kelas_katalog").select("*");
  lemparJikaError(error);
  return (data ?? []) as KelasKatalog[];
}

/** View `kelas_katalog` (tanpa link Meet), disaring dan diurutkan. */
export async function ambilKatalogKelas(filter: FilterKelas = {}): Promise<KelasKatalog[]> {
  return urutkanKelas(saringKelas(await semuaKelas(), filter));
}

export async function ambilKelas(id: string): Promise<KelasKatalog | null> {
  if (pakaiMock) return (await semuaKelas()).find((k) => k.id === id) ?? null;
  await connection();
  const { data, error } = await clientPublik().from("kelas_katalog").select("*").eq("id", id).maybeSingle();
  lemparJikaError(error);
  return (data as KelasKatalog | null) ?? null;
}
