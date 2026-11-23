import type { Metadata } from "next";
import { Suspense } from "react";
import { ambilDaftarProgram } from "@/lib/api/program";
import { Kerangka, Kontainer } from "@/components/ui/dasar";
import { HasilTes } from "@/components/tes-minat/hasil";

export const metadata: Metadata = { title: "Hasil tes minat" };

export default function HalamanHasil() {
  return (
    <Kontainer className="max-w-[784px] py-10 md:py-16">
      <Suspense fallback={<Kerangka className="h-72 rounded-card" />}>
        <Isi />
      </Suspense>
    </Kontainer>
  );
}

async function Isi() {
  const program = await ambilDaftarProgram();
  return <HasilTes namaProgram={Object.fromEntries(program.map((p) => [p.slug, p.nama]))} />;
}
