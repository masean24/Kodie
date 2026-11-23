import { connection } from "next/server";
import type { Bidang, PengajarPublik, StatusKerja } from "@/types/database";
import { pengajarMock } from "@/lib/mock/data";
import { clientPublik } from "@/lib/supabase/publik";
import { lemparJikaError, pakaiMock } from "./sumber";

interface BarisPengajarPublik {
  id: string;
  nama: string;
  status_kerja: StatusKerja | null;
  kampus: string | null;
  jurusan: string | null;
  keahlian: Bidang[] | null;
  jumlah_rating: number | null;
  rata_rata_rating: number | string | null;
  foto_path?: string | null;
  foto_url?: string | null;
  cv_url?: string | null;
  diverifikasi_pada?: string | null;
  program_ids?: string[] | null;
}

function normalisasiPengajar(row: BarisPengajarPublik): PengajarPublik {
  const fotoUrl =
    row.foto_url ??
    (row.foto_path ? clientPublik().storage.from("foto-pengajar").getPublicUrl(row.foto_path).data.publicUrl : null);
  return {
    id: row.id,
    nama: row.nama,
    status_kerja: row.status_kerja ?? "mahasiswa",
    kampus: row.kampus ?? null,
    jurusan: row.jurusan ?? null,
    keahlian: row.keahlian ?? [],
    jumlah_rating: Number(row.jumlah_rating ?? 0),
    rata_rata_rating:
      row.rata_rata_rating !== null && row.rata_rata_rating !== undefined ? Number(row.rata_rata_rating) : null,
    foto_url: fotoUrl,
    foto_path: row.foto_path ?? null,
    cv_url: row.cv_url ?? null,
    diverifikasi_pada: row.diverifikasi_pada ?? null,
    program_ids: row.program_ids ?? [],
  };
}

/** View `pengajar_publik` (hanya terverifikasi), untuk bagian pengajar di beranda. */
export async function ambilDaftarPengajarPublik(batas = 3): Promise<PengajarPublik[]> {
  if (pakaiMock) return pengajarMock.slice(0, batas);
  await connection();
  const { data, error } = await clientPublik()
    .from("pengajar_publik")
    .select("*")
    .order("jumlah_rating", { ascending: false })
    .limit(batas);
  lemparJikaError(error);
  return ((data ?? []) as BarisPengajarPublik[]).map(normalisasiPengajar);
}

export async function ambilPengajarPublik(id: string): Promise<PengajarPublik | null> {
  if (pakaiMock) return pengajarMock.find((p) => p.id === id) ?? null;
  await connection();
  const { data, error } = await clientPublik().from("pengajar_publik").select("*").eq("id", id).maybeSingle();
  lemparJikaError(error);
  return data ? normalisasiPengajar(data as BarisPengajarPublik) : null;
}
