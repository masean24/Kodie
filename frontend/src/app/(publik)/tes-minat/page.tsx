import type { Metadata } from "next";
import { Suspense } from "react";
import type { SoalMinatPublik } from "@/types/database";
import { ambilSoalMinat } from "@/lib/api/tes-minat";
import { Kontainer, StateKosong } from "@/components/ui/dasar";
import { Kuis, type Peserta } from "@/components/tes-minat/kuis";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilDaftarAnak, ambilSiswaSaya } from "@/lib/api/siswa";
import { JudulHalaman } from "@/components/situs/judul-halaman";

export const metadata: Metadata = {
  title: "Tes minat jurusan IT",
  description: "12 soal, gratis, tanpa akun. Lihat bidang IT yang paling cocok untukmu.",
};

export default async function HalamanTesMinat() {
  const soal = await ambilSoalMinat();

  return (
    <>
    <JudulHalaman judul="Tes minat jurusan IT" keterangan="12 soal, gratis, tanpa akun. Lihat bidang IT yang paling cocok untukmu." />
    <Kontainer className="py-10 md:py-16">
      {soal.length === 0 ? (
        <StateKosong judul="Soal belum tersedia" keterangan="Tes minat sedang disiapkan. Coba lagi nanti." />
      ) : (
        <Suspense fallback={<Kuis soal={soal} peserta={{ mode: "tamu" }} />}>
          <KuisDenganPeserta soal={soal} />
        </Suspense>
      )}
    </Kontainer>
    </>
  );
}

async function KuisDenganPeserta({ soal }: { soal: SoalMinatPublik[] }) {
  return <Kuis soal={soal} peserta={await pesertaTes()} />;
}

/** Siswa: profil sendiri. Orang tua: memilih anak. Peran lain dan tamu: hasil tidak disimpan. */
async function pesertaTes(): Promise<Peserta> {
  const p = await ambilPenggunaSaya();
  if (p?.peran === "siswa") {
    const s = await ambilSiswaSaya();
    return { mode: "siswa", siswaId: s?.id ?? null, nama: s?.nama ?? p.nama };
  }
  if (p?.peran === "orang_tua") {
    const anak = await ambilDaftarAnak();
    return { mode: "orang_tua", anak: anak.map(({ id, nama, jenjang, kelas }) => ({ id, nama, jenjang, kelas })) };
  }
  return { mode: "tamu" };
}
