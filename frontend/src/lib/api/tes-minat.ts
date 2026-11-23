import { cacheLife } from "next/cache";
import type { HasilTesMinat, JawabanMinat, SoalMinatPublik } from "@/types/database";
import { soalMinatMock } from "@/lib/mock/data";
import { storeMock } from "@/lib/mock/store";
import { clientPublik } from "@/lib/supabase/publik";
import { buatClientServer } from "@/lib/supabase/server";
import {
  JURUSAN_PER_BIDANG,
  bidangTeratas,
  hitungPersentase,
  hitungSkorMentah,
  rekomendasiProgram,
  semuaTerjawab,
} from "@/lib/tes-minat";
import { ambilPenggunaSaya } from "./auth";
import { lemparJikaError, pakaiMock } from "./sumber";

const NAMA_KE_SLUG_PROGRAM: Record<string, string> = {
  "Coding Dasar": "coding-dasar",
  "Kelas Reguler Teknologi": "kelas-reguler-teknologi",
  "Simulasi Jurusan IT": "simulasi-jurusan-it",
};

async function ambilSoalMinatCached(): Promise<SoalMinatPublik[]> {
  "use cache";
  cacheLife("hours");
  const { data, error } = await clientPublik().from("soal_minat_publik").select("*").order("urutan");
  lemparJikaError(error);
  return (data ?? []) as SoalMinatPublik[];
}

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
  return ambilSoalMinatCached();
}

/**
 * RPC `hitung_tes_minat(p_jawaban, p_siswa_id?)`. Hanya untuk server (dipanggil lewat Server Function).
 * Hasil disimpan hanya jika login dan `siswaId` milik pengguna (siswa sendiri atau anak orang tua).
 */
export async function hitungTesMinat(jawaban: JawabanMinat, siswaId?: string | null): Promise<HasilTesMinat> {
  if (pakaiMock) {
    if (!semuaTerjawab(soalMinatMock.length, jawaban)) throw new Error("VALIDASI_GAGAL");
    const skor_mentah = hitungSkorMentah(soalMinatMock, jawaban);
    const teratas = bidangTeratas(skor_mentah);
    const skor = hitungPersentase(skor_mentah);
    const p = siswaId ? await ambilPenggunaSaya() : null;
    const store = storeMock();
    const siswa = p ? store.siswa.find((s) => s.id === siswaId && (s.pengguna_id === p.id || s.orang_tua_id === p.id)) : null;
    if (siswaId && !siswa) throw new Error("TIDAK_BERHAK");
    let id: string | null = null;
    if (siswa && p) {
      id = crypto.randomUUID();
      store.hasilMinat.push({ id, siswa_id: siswa.id, dikerjakan_oleh: p.id, jawaban, skor, bidang_teratas: teratas, dibuat_pada: new Date().toISOString() });
    }
    return {
      id,
      tersimpan: id !== null,
      skor,
      skor_mentah,
      bidang_teratas: teratas,
      rekomendasi_jurusan: JURUSAN_PER_BIDANG[teratas],
      rekomendasi_program: siswa ? rekomendasiProgram(siswa.jenjang, siswa.kelas) : [],
    };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("hitung_tes_minat", {
    p_jawaban: jawaban,
    ...(siswaId ? { p_siswa_id: siswaId } : {}),
  });
  lemparJikaError(error);
  const hasil = data as HasilTesMinat;
  return {
    ...hasil,
    rekomendasi_program: siswaId
      ? (hasil.rekomendasi_program ?? []).map((p) => NAMA_KE_SLUG_PROGRAM[p] ?? p)
      : [],
  };
}
