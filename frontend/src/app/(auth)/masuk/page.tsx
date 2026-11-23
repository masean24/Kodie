import type { Metadata } from "next";
import { Suspense } from "react";
import { pakaiMock } from "@/lib/api/sumber";
import { akunMock } from "@/lib/mock/akun";
import { lanjutAman } from "@/lib/peran";
import { Kerangka, Kontainer } from "@/components/ui/dasar";
import { FormMasuk } from "@/components/auth/form-masuk";

export const metadata: Metadata = { title: "Masuk" };

export default function HalamanMasuk({ searchParams }: PageProps<"/masuk">) {
  return (
    <Kontainer className="py-10 md:py-16">
      <Suspense fallback={<Kerangka className="mx-auto h-[520px] max-w-[560px] rounded-card" />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </Kontainer>
  );
}

async function Isi({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const lanjut = lanjutAman(typeof q.lanjut === "string" ? q.lanjut : null);
  return <FormMasuk lanjut={lanjut} akunMock={pakaiMock ? akunMock.map((a) => a.email) : undefined} />;
}
