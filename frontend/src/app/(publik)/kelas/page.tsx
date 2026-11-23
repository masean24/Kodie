import type { Metadata } from "next";
import { Suspense } from "react";
import type { Jenjang } from "@/types/database";
import { ambilKatalogKelas } from "@/lib/api/kelas";
import { ambilDaftarProgram } from "@/lib/api/program";
import { RENTANG_JAM, type FilterKelas as Filter, type RentangJam } from "@/lib/kelas";
import { namaHari } from "@/lib/format";
import { Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { JudulHalaman } from "@/components/situs/judul-halaman";
import { FilterKelas } from "@/components/kelas/filter-kelas";
import { KartuKelas } from "@/components/kelas/kartu-kelas";

export const metadata: Metadata = { title: "Katalog kelas" };

type CariParam = Record<string, string | string[] | undefined>;

function satu(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function bacaFilter(q: CariParam): Filter {
  const jenjang = satu(q.jenjang);
  const hari = Number(satu(q.hari));
  const jam = satu(q.jam);
  return {
    program: satu(q.program) || undefined,
    jenjang: jenjang === "SD" || jenjang === "SMP" || jenjang === "SMA" ? (jenjang as Jenjang) : undefined,
    hari: Number.isInteger(hari) && hari >= 1 && hari <= 7 ? hari : undefined,
    jam: jam && jam in RENTANG_JAM ? (jam as RentangJam) : undefined,
  };
}

export default function HalamanKatalog({ searchParams }: PageProps<"/kelas">) {
  return (
    <>
      <JudulHalaman judul="Katalog kelas" keterangan="Pilih jadwal yang cocok. Setiap paket berisi 4 sesi, seminggu sekali." />
      <Kontainer className="py-10 md:py-12">
        <Suspense
          fallback={
            <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
              <StatusMemuat label="Memuat katalog kelas…" />
              <Kerangka className="h-[480px]" />
              <div className="grid gap-6 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Kerangka key={i} className="h-80" />
                ))}
              </div>
            </div>
          }
        >
          <Katalog searchParams={searchParams} />
        </Suspense>
      </Kontainer>
    </>
  );
}

async function Katalog({ searchParams }: { searchParams: Promise<CariParam> }) {
  const filter = bacaFilter(await searchParams);
  const [daftar, program] = await Promise.all([ambilKatalogKelas(filter), ambilDaftarProgram()]);
  const namaProgram = program.find((p) => p.slug === filter.program)?.nama;
  const ringkasan = [
    namaProgram,
    filter.jenjang && `untuk ${filter.jenjang}`,
    filter.hari && `pada hari ${namaHari(filter.hari)}`,
    filter.jam && RENTANG_JAM[filter.jam].label.split(" (")[0].toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
      <FilterKelas key={JSON.stringify(filter)} program={program.map(({ slug, nama }) => ({ slug, nama }))} nilai={filter} />
      <section aria-labelledby="judul-hasil">
        <h2 id="judul-hasil" aria-live="polite" className="font-display text-lg font-semibold">
          {daftar.length} kelas ditemukan{ringkasan ? ` · ${ringkasan}` : ""}
        </h2>
        {daftar.length === 0 ? (
          <div className="mt-4">
            <StateKosong
              judul="Belum ada kelas yang cocok"
              keterangan="Coba ganti hari atau jam, atau hapus filter untuk melihat semua kelas."
              aksi={
                <TombolTautan href="/kelas" varian="kedua">
                  Lihat semua kelas
                </TombolTautan>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {daftar.map((k) => (
              <KartuKelas key={k.id} k={k} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
