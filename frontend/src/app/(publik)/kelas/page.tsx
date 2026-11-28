import type { Metadata } from "next";
import { Suspense } from "react";
import type { Jenjang } from "@/types/database";
import { ambilKatalogKelas } from "@/lib/api/kelas";
import { ambilDaftarProgram } from "@/lib/api/program";
import { RENTANG_JAM, type FilterKelas as Filter, type RentangJam, saringCari } from "@/lib/kelas";
import { namaHari } from "@/lib/format";
import { Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { JudulHalaman } from "@/components/situs/judul-halaman";
import { FilterKelas } from "@/components/kelas/filter-kelas";
import { KartuKelas } from "@/components/kelas/kartu-kelas";
import Link from "next/link";
import { Gift } from "lucide-react";
import { fiturLanjutan } from "@/lib/api/sumber";

export const metadata: Metadata = {
  title: "Katalog kelas",
  description: "Pilih kelas daring Kodie berdasarkan program, jenjang, hari, dan jam. Lihat pengajar terverifikasi dan sisa kursi setiap kelas.",
  alternates: { canonical: "/kelas" },
};

type CariParam = Record<string, string | string[] | undefined>;

function satu(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function bacaFilter(q: CariParam): Filter {
  const jenjang = satu(q.jenjang);
  const hari = Number(satu(q.hari));
  const jam = satu(q.jam);
  return {
    cari: satu(q.cari)?.trim().slice(0, 60) || undefined,
    program: satu(q.program) || undefined,
    jenjang: jenjang === "TK" || jenjang === "SD" || jenjang === "SMP" || jenjang === "SMA" ? (jenjang as Jenjang) : undefined,
    hari: Number.isInteger(hari) && hari >= 1 && hari <= 7 ? hari : undefined,
    jam: jam && jam in RENTANG_JAM ? (jam as RentangJam) : undefined,
    // Trial butuh RPC backend lanjutan; tanpa itu parameter diabaikan.
    trial: fiturLanjutan && satu(q.trial) === "1" ? true : undefined,
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
  const [semua, program] = await Promise.all([ambilKatalogKelas(filter), ambilDaftarProgram()]);
  const hasilCari = saringCari(semua, filter.cari);
  // Mode trial: hanya kelas yang masih bisa dipesan (terbuka, ada kursi, Sesi 1 belum mulai).
  const daftar = filter.trial ? hasilCari.filter((k) => k.bisa_dibooking) : hasilCari;
  const namaProgram = program.find((p) => p.slug === filter.program)?.nama;
  const ringkasan = [
    filter.cari && `cocok dengan "${filter.cari}"`,
    namaProgram,
    filter.jenjang && `untuk ${filter.jenjang}`,
    filter.hari && `pada hari ${namaHari(filter.hari)}`,
    filter.jam && RENTANG_JAM[filter.jam].label.split(" (")[0].toLowerCase(),
    filter.trial && "bisa trial",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="group/katalog grid items-start gap-8 lg:grid-cols-[300px_1fr]">
      <FilterKelas key={JSON.stringify(filter)} program={program.map(({ slug, nama }) => ({ slug, nama }))} nilai={filter} />
      {/* Selama filter memuat (form aria-busy), hasil lama diredupkan agar jelas sedang diperbarui. */}
      <section
        aria-labelledby="judul-hasil"
        className="transition-opacity duration-200 group-has-[form[aria-busy=true]]/katalog:opacity-50 motion-reduce:transition-none"
      >
        {filter.trial ? (
          <div className="mb-5 flex gap-3 rounded-card-sm bg-cta/25 p-5 ring-1 ring-cta">
            <Gift aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
            <div>
              <p className="font-display text-lg font-semibold">Trial gratis: ikut Sesi 1 tanpa bayar</p>
              <p className="mt-1 text-base">
                Pilih kelas di bawah, lalu pilih <strong>Trial gratis</strong> saat memesan. Berlaku sekali per anak, sebelum
                Sesi 1 dimulai. Setelah Sesi 1, Anda bisa lanjut ke paket penuh.
              </p>
              <Link href="/kelas" className="mt-2 inline-flex min-h-touch items-center font-bold text-primary underline-offset-4 hover:underline">
                Lihat semua kelas tanpa mode trial
              </Link>
            </div>
          </div>
        ) : null}
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
              <KartuKelas key={k.id} k={k} trial={filter.trial} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
