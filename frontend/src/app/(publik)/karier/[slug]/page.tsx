import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CheckCircle2, Clock, GraduationCap, MapPin, Plus } from "lucide-react";
import { POSISI, cariPosisi } from "@/lib/karier";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { Kerangka, Kontainer, StatusMemuat } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { TagBidang } from "@/components/kategori";
import { Muncul } from "@/components/ui/gerak";
import { KartuAuth } from "@/components/auth/bagian";
import { FormPengajar } from "@/components/auth/alur-daftar";

export function generateStaticParams() {
  return POSISI.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/karier/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = cariPosisi(slug);
  return p
    ? { title: `${p.judul} · Karier`, description: p.ringkas, alternates: { canonical: `/karier/${slug}` } }
    : { title: "Posisi tidak ditemukan" };
}

export default function HalamanPosisi({ params }: PageProps<"/karier/[slug]">) {
  return (
    <Kontainer className="py-8 md:py-12">
      <Link href="/karier#posisi" className="inline-flex min-h-touch items-center gap-2 font-display font-semibold text-primary hover:underline">
        <ArrowLeft data-kembali aria-hidden className="size-5" /> Semua posisi
      </Link>
      <Suspense
        fallback={
          <div className="mt-4 grid gap-6">
            <StatusMemuat />
            <Kerangka className="h-64" />
            <Kerangka className="h-96" />
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
  const p = cariPosisi(slug);
  if (!p) notFound();

  return (
    <>
      <section className="blok-merek on-block mt-4 rounded-card p-6 md:p-10">
        <TagBidang bidang={p.bidang} />
        <h1 className="mt-4 text-32 leading-[38px] font-extrabold tracking-tight sm:text-40 sm:leading-[48px] md:text-48 md:leading-[56px]">
          {p.judul}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 md:text-lg">{p.ringkas}</p>
        <ul className="mt-6 flex flex-wrap gap-2.5 text-sm font-bold">
          <Info ikon={<GraduationCap aria-hidden className="size-4" />}>{p.jenjang}</Info>
          <Info ikon={<MapPin aria-hidden className="size-4" />}>Daring</Info>
          <Info ikon={<Clock aria-hidden className="size-4" />}>Paruh waktu</Info>
        </ul>
        <TombolTautan href="#lamar" varian="ajakan" ukuran="lg" panah className="mt-8">
          Lamar posisi ini
        </TombolTautan>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="flex flex-col gap-8">
          <Bagian judul="Yang akan kamu kerjakan" daftar={p.tugas} />
          <Bagian judul="Syarat" daftar={p.syarat} />
          <Bagian judul="Nilai tambah" daftar={p.nilaiTambah} ikon="plus" />
        </div>
        <Muncul className="rounded-card bg-surface-sunken p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold">Materi yang diajarkan</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.materi.map((m) => (
              <li key={m} className="rounded-full bg-surface px-3 py-1 text-sm font-bold ring-1 ring-border">
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-text-muted">
            Akun pengajar aktif setelah admin memeriksa berkas dan wawancara. Berkas (foto, KTP atau KTM, SKCK) diunggah setelah akun jadi.
          </p>
        </Muncul>
      </div>

      <section id="lamar" aria-labelledby="judul-lamar" className="mt-14 scroll-mt-24">
        <KartuAuth lebar="max-w-[720px]">
          <h2 id="judul-lamar" className="text-28 leading-[36px] font-extrabold md:text-40 md:leading-[44px]">
            Lamar sebagai {p.judul}
          </h2>
          <p className="mt-2 text-text-muted">
            Buat akun pengajar. Bidang <span className="font-bold text-text">{NAMA_BIDANG[p.bidang]}</span> sudah dipilihkan, kamu
            boleh menambah bidang lain.
          </p>
          <FormPengajar keahlianAwal={[p.bidang]} />
          <p className="mt-6 text-center">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-display font-semibold text-primary underline-offset-4 hover:underline">
              Masuk
            </Link>
          </p>
        </KartuAuth>
      </section>
    </>
  );
}

function Info({ ikon, children }: { ikon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 ring-1 ring-white/40">
      {ikon}
      {children}
    </li>
  );
}

function Bagian({ judul, daftar, ikon = "cek" }: { judul: string; daftar: string[]; ikon?: "cek" | "plus" }) {
  const Ikon = ikon === "plus" ? Plus : CheckCircle2;
  return (
    <Muncul>
      <h2 className="text-2xl font-bold">{judul}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {daftar.map((d) => (
          <li key={d} className="flex gap-3">
            <Ikon aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
            <span className="leading-relaxed">{d}</span>
          </li>
        ))}
      </ul>
    </Muncul>
  );
}
