import type { Metadata } from "next";
import { kalimatPertama } from "@/components/program/kartu-program";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarDays, Clock, GraduationCap, Users } from "lucide-react";
import { ambilProgram } from "@/lib/api/program";
import { ambilKatalogKelas } from "@/lib/api/kelas";
import { formatRupiah } from "@/lib/format";
import { cx } from "@/lib/cx";
import { Kartu, Kerangka, Kontainer, StateKosong, StatusMemuat } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { labelJenjang, warnaProgram } from "@/components/kategori";
import { KartuKelas } from "@/components/kelas/kartu-kelas";
import { GambarProgram } from "@/components/program/gambar-program";

export async function generateMetadata({ params }: PageProps<"/program/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await ambilProgram(slug);
  return p
    ? { title: p.nama, description: kalimatPertama(p.deskripsi), alternates: { canonical: `/program/${slug}` } }
    : { title: "Program tidak ditemukan" };
}

export default function HalamanDetailProgram({ params }: PageProps<"/program/[slug]">) {
  return (
    <Kontainer className="py-8 md:py-12">
      <Link href="/program" className="inline-flex min-h-touch items-center gap-2 font-display font-semibold text-primary hover:underline">
        <ArrowLeft data-kembali aria-hidden className="size-5" /> Semua program
      </Link>
      <Suspense
        fallback={
          <div className="mt-4 grid gap-6">
            <StatusMemuat />
            <Kerangka className="h-72" />
            <Kerangka className="h-48" />
          </div>
        }
      >
        <Isi params={params} />
      </Suspense>
    </Kontainer>
  );
}

async function Isi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await ambilProgram(slug);
  if (!p) notFound();
  const w = warnaProgram(p.slug);
  const kapasitas = p.jenjang.includes("SD") ? 10 : 15;

  return (
    <>
      <section className={cx("mt-4 grid gap-8 rounded-card bg-gradient-to-br p-6 text-on-block md:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center", w.blok)}>
        <div>
          <span className="inline-flex rounded-full bg-surface px-3 py-0.5 text-sm font-bold text-text">
            {labelJenjang(p.jenjang, p.kelas_min, p.kelas_maks)}
          </span>
          <h1 className="mt-4 text-28 leading-[36px] font-extrabold tracking-tight sm:text-40 sm:leading-[46px] md:text-48 md:leading-[52px]">
            {p.nama}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 md:text-lg">{p.deskripsi}</p>
        </div>
        <GambarProgram slug={p.slug} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Kartu>
          <h2 className="text-2xl font-bold">Rincian paket</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { ikon: CalendarDays, label: "Jumlah sesi", isi: `${p.jumlah_sesi} sesi, seminggu sekali` },
              { ikon: Clock, label: "Durasi per sesi", isi: `${p.durasi_menit} menit` },
              { ikon: GraduationCap, label: "Untuk", isi: labelJenjang(p.jenjang, p.kelas_min, p.kelas_maks) },
              { ikon: Users, label: "Ukuran kelas", isi: `Maksimal ${kapasitas} siswa` },
            ].map((r) => (
              <div key={r.label} className="flex gap-3">
                <r.ikon aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <dt className="text-sm text-text-muted">{r.label}</dt>
                  <dd className="font-bold">{r.isi}</dd>
                </div>
              </div>
            ))}
          </dl>
        </Kartu>
        <Kartu className="flex flex-col gap-3">
          <p className="font-display text-28 font-semibold leading-8">{formatRupiah(p.harga_paket)}</p>
          <p className="text-sm text-text-muted">per paket {p.jumlah_sesi} sesi</p>
          <TombolTautan href={`/kelas?program=${p.slug}`} ukuran="lg" className="mt-2">
            Lihat jadwal kelas
          </TombolTautan>
        </Kartu>
      </div>

      {p.silabus && p.silabus.length > 0 ? (
        <section aria-labelledby="judul-silabus" className="mt-12">
          <h2 id="judul-silabus" className="text-2xl font-bold md:text-32 md:leading-10">
            Silabus {p.silabus.length} sesi
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {p.silabus.map((s) => (
              <li key={s.sesi} className="flex flex-col gap-2 rounded-card-sm bg-surface p-6 shadow-kartu">
                <p className="text-sm font-bold text-primary">Sesi {s.sesi}</p>
                <h3 className="text-xl font-semibold leading-snug">{s.judul}</h3>
                <p className="leading-7 text-text-muted">{s.topik}</p>
                <p className="mt-auto rounded-md bg-primary-subtle px-3 py-2 text-sm">
                  <span className="font-bold">Hasil proyek:</span> {s.hasil_proyek}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="judul-kelas-program" className="mt-12">
        <h2 id="judul-kelas-program" className="text-2xl font-bold md:text-32 md:leading-10">
          Kelas yang dibuka
        </h2>
        <Suspense
          fallback={
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Kerangka className="h-80" />
              <Kerangka className="h-80" />
            </div>
          }
        >
          <KelasProgram slug={p.slug} />
        </Suspense>
      </section>
    </>
  );
}

async function KelasProgram({ slug }: { slug: string }) {
  const daftar = await ambilKatalogKelas({ program: slug });
  if (daftar.length === 0) {
    return (
      <div className="mt-6">
        <StateKosong judul="Belum ada kelas yang dibuka" keterangan="Pengajar akan membuka jadwal baru. Coba cek lagi nanti." />
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      {daftar.map((k) => (
        <KartuKelas key={k.id} k={k} />
      ))}
    </div>
  );
}
