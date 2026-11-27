import { cacheLife, cacheTag } from "next/cache";
import type { Program, SilabusSesi } from "@/types/database";
import { programMock } from "@/lib/mock/data";
import { silabusMock } from "@/lib/mock/silabus";
import { clientPublik } from "@/lib/supabase/publik";
import { lemparJikaError, pakaiMock } from "./sumber";

/** `program.silabus` (jsonb) menjadi daftar sesi terurut; isi yang tidak sesuai bentuk dilewati. */
export function uraiSilabus(nilai: unknown): SilabusSesi[] {
  if (!Array.isArray(nilai)) return [];
  return nilai
    .filter(
      (x): x is SilabusSesi =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as SilabusSesi).sesi === "number" &&
        typeof (x as SilabusSesi).judul === "string" &&
        typeof (x as SilabusSesi).topik === "string" &&
        typeof (x as SilabusSesi).hasil_proyek === "string",
    )
    .sort((a, b) => a.sesi - b.sesi);
}

function normalisasiProgram(row: Record<string, unknown>): Program {
  return { ...(row as unknown as Program), silabus: uraiSilabus(row.silabus) };
}

function denganSilabusMock(p: Program): Program {
  return { ...p, silabus: silabusMock[p.slug] ?? [] };
}

/**
 * Data program publik (tanpa cookie) di-cache dengan tag `TAG_PROGRAM`, jadi kartu program bisa langsung ada
 * di HTML awal tanpa menunggu Supabase di setiap request (elemen LCP di /program dan beranda).
 * Setiap perubahan program oleh admin wajib memanggil `updateTag(TAG_PROGRAM)` (lihat `aksiAdminUbahProgram`),
 * supaya harga dan status yang tampil tidak pernah basi. `cacheLife("hours")` hanya batas atas cadangan.
 */
export const TAG_PROGRAM = "program";

async function ambilDaftarProgramTercache(): Promise<Program[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG_PROGRAM);
  const { data, error } = await clientPublik().from("program").select("*").eq("aktif", true).order("kelas_min");
  lemparJikaError(error);
  return (data ?? []).map((r) => normalisasiProgram(r as Record<string, unknown>));
}

async function ambilProgramTercache(slug: string): Promise<Program | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG_PROGRAM);
  const { data, error } = await clientPublik()
    .from("program")
    .select("*")
    .eq("slug", slug)
    .eq("aktif", true)
    .maybeSingle();
  lemparJikaError(error);
  return data ? normalisasiProgram(data as Record<string, unknown>) : null;
}

/** Tabel `program` dengan aktif = true. */
export async function ambilDaftarProgram(): Promise<Program[]> {
  if (pakaiMock) return programMock.filter((p) => p.aktif).map(denganSilabusMock);
  return ambilDaftarProgramTercache();
}

export async function ambilProgram(slug: string): Promise<Program | null> {
  if (pakaiMock) {
    const p = programMock.find((x) => x.slug === slug && x.aktif);
    return p ? denganSilabusMock(p) : null;
  }
  return ambilProgramTercache(slug);
}
