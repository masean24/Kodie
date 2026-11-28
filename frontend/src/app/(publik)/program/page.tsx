import type { Metadata } from "next";
import { Suspense } from "react";
import { ambilDaftarProgram } from "@/lib/api/program";
import { Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { JudulHalaman } from "@/components/situs/judul-halaman";
import { TombolTanyaKiko } from "@/components/chatbot/tombol-tanya-kiko";
import { KartuProgram } from "@/components/program/kartu-program";
import { MatriksProgram } from "@/components/program/matriks-program";
import { JalurBelajar } from "@/components/program/jalur-belajar";

export const metadata: Metadata = {
  title: "Program",
  description:
    "Program Kodie dari usia 5 tahun sampai SMA: Kenal Komputer, Coding Dasar, Kelas Reguler Teknologi, dan Simulasi Jurusan IT, dengan jalur level berkelanjutan. Setiap paket 4 sesi daring dalam kelompok kecil.",
  alternates: { canonical: "/program" },
};

export default function HalamanProgram() {
  return (
    <>
      <JudulHalaman
        judul="Satu jalur,"
        sorotan="naik bertahap"
        keterangan="Dari usia 5 tahun sampai SMA. Setiap paket berisi 4 sesi daring, seminggu sekali, dalam kelompok kecil."
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
      <div className={daftar.length > 3 ? "grid gap-6 md:grid-cols-2 xl:grid-cols-4" : "grid gap-6 md:grid-cols-3"}>
        {daftar.map((p) => (
          <KartuProgram key={p.id} p={p} judulTag="h2" />
        ))}
      </div>
      <MatriksProgram daftar={daftar} />
      <JalurBelajar slugTersedia={daftar.map((p) => p.slug)} />
    </>
  );
}
