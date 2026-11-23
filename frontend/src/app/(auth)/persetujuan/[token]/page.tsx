import type { Metadata } from "next";
import { Suspense } from "react";
import { XCircle } from "lucide-react";
import type { InfoPersetujuan } from "@/types/database";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { infoPersetujuan } from "@/lib/api/persetujuan";
import { pakaiMock } from "@/lib/api/sumber";
import { akunMock } from "@/lib/mock/akun";
import { pesanError } from "@/lib/errors";
import { Kerangka, Kontainer, StatusMemuat } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { KartuAuth } from "@/components/auth/bagian";
import { AlurPersetujuan } from "@/components/persetujuan/alur-persetujuan";

export const metadata: Metadata = { title: "Persetujuan orang tua", robots: { index: false } };

export default function HalamanPersetujuanPublik({ params, searchParams }: PageProps<"/persetujuan/[token]">) {
  return (
    <Kontainer className="py-10 md:py-16">
      <Suspense
        fallback={
          <div className="mx-auto max-w-[640px]">
            <StatusMemuat label="Memeriksa link…" />
            <Kerangka className="h-[640px] rounded-card" />
          </div>
        }
      >
        <Isi params={params} searchParams={searchParams} />
      </Suspense>
    </Kontainer>
  );
}

async function Isi({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, q] = await Promise.all([params, searchParams]);
  let info: InfoPersetujuan;
  try {
    info = await infoPersetujuan(token);
  } catch (e) {
    return (
      <KartuAuth>
        <XCircle aria-hidden className="size-12 text-danger" />
        <h1 className="mt-4 text-[32px] leading-[38px] font-extrabold">{pesanError(e)}</h1>
        <p className="mt-3 text-lg">
          Link ini sudah kedaluwarsa, sudah dipakai, atau tidak dikenal. Minta anak Anda membuat link baru dari akunnya.
        </p>
        <TombolTautan href="/" varian="kedua" className="mt-6">
          Ke beranda
        </TombolTautan>
      </KartuAuth>
    );
  }
  const p = await ambilPenggunaSaya();
  return (
    <AlurPersetujuan
      token={token}
      info={info}
      pengguna={p ? { peran: p.peran, nama: p.nama } : null}
      sudahSetuju={q.setuju === "1"}
      akunMock={pakaiMock ? akunMock.filter((a) => a.email.startsWith("ortu")).map((a) => a.email) : undefined}
    />
  );
}
