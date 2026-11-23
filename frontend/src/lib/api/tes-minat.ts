import type { HasilTesMinat, JawabanMinat, SoalMinatPublik } from "@/types/database";
import { soalMinatMock } from "@/lib/mock/data";
import { clientPublik } from "@/lib/supabase/publik";
import {
  JURUSAN_PER_BIDANG,
  bidangTeratas,
  hitungPersentase,
  hitungSkorMentah,
  semuaTerjawab,
} from "@/lib/tes-minat";
import { lemparJikaError, pakaiMock } from "./sumber";

/** View `soal_minat_publik`: 12 soal terurut, opsi tanpa bobot. */
export async function ambilSoalMinat(): Promise<SoalMinatPublik[]> {
  if (pakaiMock) {
    return soalMinatMock.map(({ id, urutan, teks, opsi }) => ({
      id,
      urutan,
      teks,
      opsi: opsi.map(({ kode, teks: t }) => ({ kode, teks: t })),
    }));
  }
  const { data, error } = await clientPublik().from("soal_minat_publik").select("*").order("urutan");
  lemparJikaError(error);
  return (data ?? []) as SoalMinatPublik[];
}

/**
 * Padanan RPC `hitung_tes_minat(p_jawaban, p_siswa_id?)`. Di sesi ini hanya untuk tamu,
 * jadi hasil tidak disimpan (tersimpan = false). Penyimpanan untuk pengguna login menyusul di Prompt 2–3.
 */
export async function hitungTesMinat(jawaban: JawabanMinat): Promise<HasilTesMinat> {
  if (pakaiMock) {
    if (!semuaTerjawab(soalMinatMock.length, jawaban)) throw new Error("VALIDASI_GAGAL");
    const skor_mentah = hitungSkorMentah(soalMinatMock, jawaban);
    const teratas = bidangTeratas(skor_mentah);
    return {
      id: null,
      tersimpan: false,
      skor: hitungPersentase(skor_mentah),
      skor_mentah,
      bidang_teratas: teratas,
      rekomendasi_jurusan: JURUSAN_PER_BIDANG[teratas],
      rekomendasi_program: [],
    };
  }
  const { data, error } = await clientPublik().rpc("hitung_tes_minat", { p_jawaban: jawaban });
  lemparJikaError(error);
  return data as HasilTesMinat;
}
