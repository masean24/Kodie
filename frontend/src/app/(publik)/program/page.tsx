import type { Metadata } from "next";
import { Suspense } from "react";
import { ambilDaftarProgram } from "@/lib/api/program";
import { Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { JudulHalaman } from "@/components/situs/judul-halaman";
import { TombolTanyaKiko } from "@/components/chatbot/tombol-tanya-kiko";
import { KartuProgram, kalimatPertama } from "@/components/program/kartu-program";
import { labelJenjang } from "@/components/kategori";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = {
  title: "Program",
  description: "Tiga program Kodie: Coding Dasar untuk SD, Kelas Reguler Teknologi untuk SMP dan SMA, dan Simulasi Jurusan IT. Setiap paket 4 sesi daring dalam kelompok kecil.",
  alternates: { canonical: "/program" },
};

export default function HalamanProgram() {
  return (
    <>
      <JudulHalaman
        judul="Tiga program,"
        sorotan="naik bertahap"
        keterangan="Setiap paket berisi 4 sesi daring, seminggu sekali, dalam kelompok kecil."
      />
      <Kontainer className="pb-24 pt-10 md:pt-14">
        <div className="mb-8 flex justify-center">
          <TombolTanyaKiko />
        </div>
        <Suspense
          fallback={
            <div className="grid gap-6 md:grid-cols-3">
              <StatusMemuat />
              {[0, 1, 2].map((i) => (
                <Kerangka key={i} className="h-[420px]" />
              ))}
            </div>
          }
        >
          <Daftar />
        </Suspense>
      </Kontainer>
    </>
  );
}

async function Daftar() {
  const daftar = await ambilDaftarProgram();
  if (daftar.length === 0) {
    return <StateKosong judul="Program belum tersedia" keterangan="Program sedang disiapkan. Coba lagi nanti." />;
  }
  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {daftar.map((p) => (
          <KartuProgram key={p.id} p={p} judulTag="h2" />
        ))}
      </div>
      <section aria-labelledby="judul-banding" className="mt-12">
        <h2 id="judul-banding" className="text-2xl font-bold">
          Bandingkan program
        </h2>
        <div className="mt-4 overflow-x-auto rounded-card-sm border border-border bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
            <caption className="sr-only">Perbandingan jenjang, materi, durasi, kuota, dan harga tiap program</caption>
            <thead className="bg-surface-sunken">
              <tr>
                {["Program", "Jenjang", "Materi", "Durasi", "Kuota kelas", "Harga"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daftar.map((p) => (
                <tr key={p.id} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3 font-bold">
                    {p.nama}
                  </th>
                  <td className="px-4 py-3">{labelJenjang(p.jenjang, p.kelas_min, p.kelas_maks)}</td>
                  <td className="px-4 py-3 text-text-muted">{kalimatPertama(p.deskripsi)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.jumlah_sesi} sesi × {p.durasi_menit} menit
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">Maks. {p.jenjang.includes("SD") ? 10 : 15} siswa</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold">{formatRupiah(p.harga_paket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
