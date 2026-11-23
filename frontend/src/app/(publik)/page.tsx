import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, ClipboardCheck, CreditCard, FileText, Video, type LucideIcon } from "lucide-react";
import { ambilDaftarProgram } from "@/lib/api/program";
import { ambilDaftarPengajarPublik } from "@/lib/api/pengajar";
import { Kerangka, Kontainer, StateKosong, StatusMemuat, Sorotan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { ObjekBidang } from "@/components/kategori";
import { KartuProgram } from "@/components/program/kartu-program";
import { KartuPengajar } from "@/components/pengajar/kartu-pengajar";
import { AngkatHover, Muncul } from "@/components/ui/gerak";

export default function Beranda() {
  return (
    <>
      <Pahlawan />
      <Nilai />
      <section aria-labelledby="judul-program" className="py-16 md:py-24">
        <Kontainer>
          <h2
            id="judul-program"
            className="text-center text-[28px] leading-[38px] font-extrabold tracking-tight sm:text-[34px] sm:leading-[44px] md:text-[40px] md:leading-[52px]"
          >
            Tiga program, <Sorotan>naik bertahap</Sorotan>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-7 text-text-muted md:text-lg">
            Mulai dari logika di SD, lanjut proyek nyata, lalu coba empat jurusan IT.
          </p>
          <Suspense fallback={<KerangkaKartu jumlah={3} tinggi="h-[420px]" />}>
            <DaftarProgram />
          </Suspense>
        </Kontainer>
      </section>
      <CaraKerja />
      <Pengajar />
      <AjakanTes />
    </>
  );
}

function Pahlawan() {
  return (
    <section className="hero-layar blok-merek on-block flex overflow-hidden rounded-b-[32px] md:rounded-b-block">
      <Kontainer className="grid w-full items-center gap-10 py-12 md:py-20 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h1 className="text-[32px] leading-[42px] font-extrabold tracking-tight sm:text-[40px] sm:leading-[52px] lg:text-[50px] lg:leading-[64px]">
            Belajar coding dan teknologi{" "}
            <span className="mt-1 inline-block md:whitespace-nowrap">
              <Sorotan diBlok>SD sampai SMA</Sorotan>
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 md:mt-5 md:text-lg md:leading-8">
            Kelas daring kelompok kecil, diajar mahasiswa terverifikasi, dengan laporan untuk orang tua setiap sesi.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3.5">
            <TombolTautan href="/tes-minat" varian="ajakan" ukuran="lg" panah>
              Coba tes minat
            </TombolTautan>
            <TombolTautan href="/kelas" varian="terang" ukuran="lg">
              Lihat jadwal kelas
            </TombolTautan>
          </div>
          <ul aria-label="Tentang tes minat" className="mt-6 flex flex-wrap items-center gap-2.5 text-sm font-bold">
            {["Gratis", "12 soal", "Tanpa akun"].map((t) => (
              <li key={t} className="rounded-full bg-white/15 px-3.5 py-1 ring-1 ring-white/40">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden className="relative mx-auto hidden aspect-square w-full max-w-[420px] lg:block">
          <div className="absolute inset-[6%] rounded-full border-2 border-dashed border-white/35 bg-white/5" />
          <ObjekBidang bidang="software" ukuran={150} miring={-6} className="absolute left-[10%] top-[10%]" />
          <ObjekBidang bidang="jaringan" ukuran={132} miring={6} className="absolute right-[6%] top-[8%]" />
          <ObjekBidang bidang="iot" ukuran={136} miring={4} className="absolute left-[16%] bottom-[16%]" />
          <ObjekBidang bidang="ai_data" ukuran={158} miring={-4} className="absolute right-[8%] bottom-[10%]" />
        </div>
      </Kontainer>
    </section>
  );
}

function Nilai() {
  return (
    <section aria-labelledby="judul-nilai" className="py-16 md:py-24">
      <Kontainer className="text-center">
        <Muncul>
        <h2
          id="judul-nilai"
          className="mx-auto max-w-3xl text-[24px] leading-[38px] font-extrabold sm:text-[30px] sm:leading-[46px] md:text-[36px] md:leading-[54px]"
        >
          Di Kodie, kelasnya{" "}
          <span className="whitespace-nowrap">
            <Sorotan>kelompok kecil</Sorotan>,
          </span>{" "}
          pengajarnya{" "}
          <span className="whitespace-nowrap">
            <span className="inline-block rounded-full bg-accent px-[0.38em] py-[0.04em] leading-[1.18] align-baseline text-on-accent">
              terverifikasi
            </span>
            ,
          </span>{" "}
          dan ada{" "}
          <span className="inline-block rounded-full bg-primary-subtle px-[0.38em] py-[0.04em] leading-[1.18] align-baseline text-text">
            laporan
          </span>{" "}
          setiap sesi.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-muted md:text-lg">
          Maksimal 10 siswa untuk SD dan 15 untuk SMP–SMA. Pengajar dicek lewat KTP atau KTM, SKCK, dan wawancara.
        </p>
        </Muncul>
      </Kontainer>
    </section>
  );
}

function KerangkaKartu({ jumlah, tinggi }: { jumlah: number; tinggi: string }) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      <StatusMemuat />
      {Array.from({ length: jumlah }, (_, i) => (
        <Kerangka key={i} className={tinggi} />
      ))}
    </div>
  );
}

async function DaftarProgram() {
  const daftar = await ambilDaftarProgram();
  if (daftar.length === 0) {
    return (
      <div className="mt-10">
        <StateKosong judul="Program belum tersedia" keterangan="Program sedang disiapkan. Coba lagi nanti." />
      </div>
    );
  }
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {daftar.map((p, i) => (
        <Muncul key={p.id} tunda={i * 0.08} className="flex">
          <AngkatHover className="flex w-full">
            <KartuProgram p={p} />
          </AngkatHover>
        </Muncul>
      ))}
    </div>
  );
}

const LANGKAH: { ikon: LucideIcon; judul: string; ket: string }[] = [
  { ikon: ClipboardCheck, judul: "Coba tes minat", ket: "12 soal, tanpa akun" },
  { ikon: CalendarDays, judul: "Pesan kelas", ket: "Kursi ditahan 24 jam" },
  { ikon: CreditCard, judul: "Bayar", ket: "Transfer atau QRIS" },
  { ikon: Video, judul: "Masuk kelas", ket: "Aktif 15 menit sebelum mulai" },
  { ikon: FileText, judul: "Terima laporan", ket: "Ringkasan untuk orang tua" },
];

function CaraKerja() {
  return (
    <section aria-labelledby="judul-cara" className="bg-surface-sunken py-16 md:py-24">
      <Kontainer>
        <h2
          id="judul-cara"
          className="text-center text-[28px] leading-[38px] font-extrabold tracking-tight sm:text-[34px] sm:leading-[44px] md:text-[40px] md:leading-[52px]"
        >
          Dari tes minat sampai laporan
        </h2>
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {LANGKAH.map((l, i) => (
            <Muncul as="li" key={l.judul} tunda={i * 0.07} className="flex flex-col items-center text-center">
              <span aria-hidden className="blok-merek grid size-16 place-items-center rounded-full">
                <l.ikon className="size-7" />
              </span>
              <span className="mt-3 grid size-7 place-items-center rounded-full bg-primary-subtle text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-2.5 text-lg font-semibold leading-snug">{l.judul}</h3>
              <p className="mt-1 text-base leading-6 text-text-muted">{l.ket}</p>
            </Muncul>
          ))}
        </ol>
      </Kontainer>
    </section>
  );
}

function Pengajar() {
  return (
    <section aria-labelledby="judul-pengajar" className="py-16 md:py-24">
      <Kontainer>
        <Muncul className="grid gap-8 rounded-[32px] bg-gradient-to-br from-coding-dasar-strong to-coding-dasar-block-to p-6 text-on-accent md:rounded-block md:p-12 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <h2
              id="judul-pengajar"
              className="text-[26px] leading-[34px] font-extrabold tracking-tight md:text-[36px] md:leading-[46px]"
            >
              Diajar mahasiswa terverifikasi
            </h2>
            <p className="mt-3 text-base leading-7 md:text-lg">
              Semua pengajar memakai Teaching Playbook yang sama di setiap sesi.
            </p>
            <Link
              href="/karier"
              className="group mt-6 inline-flex min-h-touch items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-base font-bold ring-1 ring-white/40 transition-colors hover:bg-white/25"
            >
              Ingin bergabung sebagai pengajar? Lihat posisi yang dibuka
              <ArrowRight aria-hidden className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="grid gap-4 md:grid-cols-2">
                <StatusMemuat />
                <Kerangka className="h-64 bg-white/60" />
                <Kerangka className="h-64 bg-white/60" />
              </div>
            }
          >
            <DaftarPengajar />
          </Suspense>
        </Muncul>
      </Kontainer>
    </section>
  );
}

async function DaftarPengajar() {
  const daftar = await ambilDaftarPengajarPublik(2);
  if (daftar.length === 0) {
    return <p className="rounded-card-sm bg-surface p-6 text-text">Profil pengajar akan tampil setelah diverifikasi admin.</p>;
  }
  return (
    <div className="grid gap-4 text-text md:grid-cols-2">
      {daftar.map((p) => (
        <KartuPengajar key={p.id} p={p} />
      ))}
    </div>
  );
}

function AjakanTes() {
  return (
    <section aria-labelledby="judul-ajakan" className="pb-16 md:pb-24">
      <Kontainer>
        <Muncul className="blok-merek on-block relative overflow-hidden rounded-[32px] px-6 py-14 text-center md:rounded-block md:py-20">
          <ObjekBidang bidang="software" ukuran={96} miring={-10} className="absolute left-6 top-6 hidden lg:block" />
          <ObjekBidang bidang="iot" ukuran={88} miring={8} className="absolute bottom-8 left-[6%] hidden lg:block" />
          <ObjekBidang bidang="jaringan" ukuran={80} miring={10} className="absolute right-6 top-6 hidden lg:block" />
          <ObjekBidang bidang="ai_data" ukuran={104} miring={-6} className="absolute bottom-8 right-[6%] hidden lg:block" />
          <div className="relative mx-auto max-w-2xl">
            <h2
              id="judul-ajakan"
              className="text-[28px] leading-[38px] font-extrabold tracking-tight sm:text-[34px] sm:leading-[44px] md:text-[40px] md:leading-[52px]"
            >
              Belum tahu mulai dari mana?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 md:text-lg">
              12 soal, gratis, hasil langsung keluar. Hasilnya saran, bukan keputusan.
            </p>
            <TombolTautan href="/tes-minat" varian="ajakan" ukuran="lg" panah className="mt-8">
              Coba tes minat
            </TombolTautan>
          </div>
        </Muncul>
      </Kontainer>
    </section>
  );
}
