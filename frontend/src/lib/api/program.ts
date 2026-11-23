import type { Program } from "@/types/database";
import { programMock } from "@/lib/mock/data";
import { clientPublik } from "@/lib/supabase/publik";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Tabel `program` dengan aktif = true. */
export async function ambilDaftarProgram(): Promise<Program[]> {
  if (pakaiMock) return programMock.filter((p) => p.aktif);
  const { data, error } = await clientPublik().from("program").select("*").eq("aktif", true).order("kelas_min");
  lemparJikaError(error);
  return (data ?? []) as Program[];
}

export async function ambilProgram(slug: string): Promise<Program | null> {
  if (pakaiMock) return programMock.find((p) => p.slug === slug && p.aktif) ?? null;
  const { data, error } = await clientPublik()
    .from("program")
    .select("*")
    .eq("slug", slug)
    .eq("aktif", true)
    .maybeSingle();
  lemparJikaError(error);
  return (data as Program | null) ?? null;
}
