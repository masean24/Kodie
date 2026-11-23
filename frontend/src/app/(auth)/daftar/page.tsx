import type { Metadata } from "next";
import { Suspense } from "react";
import { Kerangka, Kontainer } from "@/components/ui/dasar";
import { AlurDaftar } from "@/components/auth/alur-daftar";

export const metadata: Metadata = { title: "Daftar" };

export default function HalamanDaftar({ searchParams }: PageProps<"/daftar">) {
  return (
    <Kontainer className="py-10 md:py-16">
      <Suspense fallback={<Kerangka className="mx-auto h-[620px] max-w-[560px] rounded-card" />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </Kontainer>
  );
}

async function Isi({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { peran } = await searchParams;
  const awal = peran === "orang_tua" || peran === "siswa" || peran === "pengajar" ? peran : null;
  return <AlurDaftar peranAwal={awal} />;
}
