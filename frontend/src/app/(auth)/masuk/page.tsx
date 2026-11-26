import type { Metadata } from "next";
import { Suspense } from "react";
import { pakaiMock } from "@/lib/api/sumber";
import { akunMock } from "@/lib/mock/akun";
import { lanjutAman } from "@/lib/peran";
import { Kerangka, Kontainer } from "@/components/ui/dasar";
import { FormMasuk } from "@/components/auth/form-masuk";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke akun Kodie sebagai orang tua, siswa, pengajar, atau admin untuk mengakses jadwal kelas daring, rapor jurusan, dan materi pembelajaran.",
  alternates: { canonical: "/masuk" },
};

export default function HalamanMasuk({ searchParams }: PageProps<"/masuk">) {
  return (
    <Kontainer className="py-10 md:py-16">
      <Suspense fallback={<Kerangka className="mx-auto h-[520px] max-w-[560px] rounded-card" />}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </Kontainer>
  );
}

const AKUN_DEMO_SUPABASE = [
  "admin@seventx.id (Admin)",
  "ortu1@seventx.id (Orang Tua — Bima SD, Sinta SMP, Fajar SMA)",
  "ortu2@seventx.id (Orang Tua — Raka SMA)",
  "siswa.aktif@seventx.id (Siswa Aktif — Fajar)",
  "siswa.baru@seventx.id (Siswa Menunggu Persetujuan — Laras)",
  "pengajar1@seventx.id (Pengajar — Nadia)",
  "pengajar2@seventx.id (Pengajar — Bagus)",
  "pengajar3@seventx.id (Pengajar — Citra)",
  "pengajar.baru@seventx.id (Pengajar Menunggu Verifikasi — Dimas)",
];

async function Isi({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const lanjut = lanjutAman(typeof q.lanjut === "string" ? q.lanjut : null);
  return (
    <FormMasuk
      lanjut={lanjut}
      passwordDiubah={q.password === "diubah"}
      infoDemo={
        pakaiMock
          ? { judul: "Mode mock: akun contoh", password: "kodie-mock-123", akun: akunMock.map((a) => a.email) }
          : { judul: "Akun demo (Supabase)", password: "DemoSeventX123!", akun: AKUN_DEMO_SUPABASE }
      }
    />
  );
}
