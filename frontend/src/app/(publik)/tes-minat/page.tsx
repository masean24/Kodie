import type { Metadata } from "next";
import { Suspense } from "react";
import { ambilSoalMinat } from "@/lib/api/tes-minat";
import { Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { Kuis } from "@/components/tes-minat/kuis";

export const metadata: Metadata = {
  title: "Tes minat jurusan IT",
  description: "12 soal, gratis, tanpa akun. Lihat bidang IT yang paling cocok untukmu.",
};

export default function HalamanTesMinat() {
  return (
    <Kontainer className="py-10 md:py-16">
      <h1 className="sr-only">Tes minat jurusan IT</h1>
      <Suspense
        fallback={
          <div className="mx-auto max-w-[700px]">
            <StatusMemuat label="Memuat soal…" />
            <Kerangka className="h-[560px] rounded-card" />
          </div>
        }
      >
        <Soal />
      </Suspense>
    </Kontainer>
  );
}

async function Soal() {
  const soal = await ambilSoalMinat();
  if (soal.length === 0) {
    return <StateKosong judul="Soal belum tersedia" keterangan="Tes minat sedang disiapkan. Coba lagi nanti." />;
  }
  return <Kuis soal={soal} />;
}
