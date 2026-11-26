import type { Metadata } from "next";
import { Suspense } from "react";
import { Kerangka, Kontainer } from "@/components/ui/dasar";
import { FormLupaPassword } from "@/components/auth/form-lupa-password";

export const metadata: Metadata = {
  title: "Lupa password",
  description:
    "Ajukan tautan atur ulang password akun Kodie melalui email terdaftar untuk memulihkan akses dashboard orang tua, siswa, atau pengajar.",
  alternates: { canonical: "/lupa-password" },
};

export default function HalamanLupaPassword({ searchParams }: PageProps<"/lupa-password">) {
  return (
    <Kontainer className="py-10 md:py-16">
      <Suspense fallback={<Kerangka className="mx-auto h-[420px] max-w-[560px] rounded-card" />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </Kontainer>
  );
}

async function Isi({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return <FormLupaPassword kedaluwarsa={q.tautan === "kedaluwarsa"} />;
}
