import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { ArrowRight, Compass, FileText, Globe, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import { ambilDaftarProgram } from "@/lib/api/program";
import { ambilDaftarPengajarPublik } from "@/lib/api/pengajar";
import { Kerangka, Kontainer, StateKosong, StatusMemuat, Sorotan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { ObjekBidang } from "@/components/kategori";
import { KartuProgram } from "@/components/program/kartu-program";
import { KartuPengajar } from "@/components/pengajar/kartu-pengajar";
import { AngkatHover, Muncul } from "@/components/ui/gerak";
import { KataHero, RevealHero, jumlahKata } from "@/components/situs/reveal-hero";
import { CaraKerjaPinned } from "@/components/situs/cara-kerja-pinned";
import { SimulasiKelasMalas } from "@/components/simulasi-kelas/simulasi-kelas-malas";

/** Deskripsi beranda memakai deskripsi bawaan di root layout; di sini cukup URL kanonik. */
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Beranda() {
  return (
    <>
      <Pahlawan />
      <Nilai />
      <SimulasiKelasLive />
      <MengapaKodie />
      <section aria-labelledby="judul-program" className="relative isolate py-16 md:py-24">
        <div aria-hidden className="aksen-grid" />
        <Kontainer>
          <h2
            id="judul-program"
            className="text-center text-28 leading-[38px] font-extrabold tracking-tight sm:text-32 sm:leading-[44px] md:text-40 md:leading-[52px]"
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
      <CaraKerjaPinned />
      <Pengajar />
      <AjakanTes />
    </>
  );
}

/**
 * Section 3: simulasi kelas live. Judul dirender server; simulasinya dimuat malas saat mendekati layar.
 */
function SimulasiKelasLive() {
  return (
    <section aria-labelledby="judul-simulasi" className="pb-4 pt-16 md:pt-24">
      <Kontainer>
        <h2
          id="judul-simulasi"
          className="text-center text-28 leading-[38px] font-extrabold tracking-tight sm:text-32 sm:leading-[44px] md:text-40 md:leading-[52px]"
        >
          Intip suasana <Sorotan>kelas live</Sorotan>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-7 text-text-muted md:text-lg">
          Coba langsung: tanya Kiko di chat, angkat tangan, atau kirim reaksi. Begini rasanya belajar bareng di Kodie.
        </p>
        <p className="mx-auto mt-3 w-fit rounded-full bg-surface-sunken px-3 py-1 text-center text-sm font-bold text-text-muted">
          Mode Simulasi Interaktif · bukan rekaman kelas asli
        </p>
        <div className="mt-8">
          <SimulasiKelasMalas />
        </div>
      </Kontainer>
    </section>
  );
}

const MASALAH_KODIE: {
  ikon: LucideIcon;
  kategori: string;
  judul: string;
  masalah: string;
  solusi: string;
}[] = [
  {
    ikon: Globe,
    kategori: "Akses & biaya",
    judul: "Biaya mahal & terpusat",
    masalah: "Kursus coding bermutu sering mahal dan terpusat di kota besar, sehingga kesenjangan literasi digital makin lebar.",
    solusi: "Daring mulai Rp200rb/paket + Lab gratis",
  },
  {
    ikon: Users,
    kategori: "Pendampingan",
    judul: "Belajar sendiri cepat buntu",
    masalah: "Tanpa pengajar terverifikasi, siswa mudah berhenti saat error dan orang tua sulit memantau progres belajarnya.",
    solusi: "Kelas kecil 10–15 siswa + laporan sesi",
  },
  {
    ikon: Compass,
    kategori: "Arah jurusan",
    judul: "Bingung pilih jurusan IT",
    masalah: "Banyak siswa masuk jurusan IT tanpa pernah mencoba langsung praktik software, jaringan, IoT, dan AI.",
    solusi: "Tes Minat gratis & Simulasi 4 Jurusan IT",
  },
];

/**
 * Section 4: latar belakang masalah, jawaban Kodie, serta pilar dampak SDG 4 dan SDG 8 (Versi 2 Color-Block).
 */
function MengapaKodie() {
  return (
    <section aria-labelledby="judul-mengapa" className="py-16 md:py-24">
      <Kontainer>
        <Muncul className="mx-auto max-w-3xl text-center">
          <h2
            id="judul-mengapa"
            className="text-28 leading-[38px] font-extrabold tracking-tight sm:text-32 sm:leading-[44px] md:text-40 md:leading-[52px]"
          >
            Mengapa{" "}
            <span className="whitespace-nowrap">
              <Sorotan>Kodie hadir</Sorotan>
              <span className="-ml-[0.08em]">?</span>
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-text-muted md:text-lg">
            Akses belajar teknologi yang terarah masih timpang, sementara siswa kerap bingung memilih jurusan IT dan talenta muda butuh
            peluang mengajar yang layak.
          </p>
        </Muncul>

        {/* Baris masalah → solusi (bukan deretan kartu ikon), supaya tidak mengulang pola section Keunggulan. */}
        <ul className="mt-12 flex flex-col gap-4">
          {MASALAH_KODIE.map((m, i) => (
            <Muncul as="li" key={m.judul} tunda={i * 0.08}>
              <article className="grid gap-5 rounded-card border border-border bg-surface p-6 shadow-kartu md:grid-cols-[minmax(0,1fr)_auto_minmax(0,22rem)] md:items-center md:gap-8 md:p-8">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-primary">
                    <m.ikon aria-hidden className="size-5" />
                    {m.kategori}
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-snug">{m.judul}</h3>
                  <p className="mt-2 leading-relaxed text-text-muted">{m.masalah}</p>
                </div>
                <ArrowRight aria-hidden className="hidden size-6 text-text-muted md:block" />
                <div className="rounded-card-sm bg-primary-subtle p-5">
                  <p className="text-sm font-bold text-primary">Solusi Kodie</p>
                  <p className="mt-1 text-lg font-bold leading-snug text-text">{m.solusi}</p>
                </div>
              </article>
            </Muncul>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-1 gap-5 md:mt-6 md:grid-cols-2 md:gap-6">
          <Muncul tunda={0.12} className="flex">
            <article className="blok-merek on-block flex w-full flex-col rounded-card border border-blue/25 p-6 shadow-kartu md:p-8">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-lime px-3.5 py-1 font-display text-sm font-extrabold text-ink">
                  SDG 4 · Pendidikan Berkualitas
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-extrabold leading-snug text-white">Akses coding merata SD–SMA</h3>
              <p className="mt-2.5 flex-1 leading-relaxed text-ice">
                Memperluas literasi digital ke seluruh Indonesia lewat kelas daring kelompok kecil, latihan langsung di browser, dan laporan
                tiap sesi untuk orang tua.
              </p>
              <p className="mt-6 border-t border-white/20 pt-4 text-sm font-bold text-lime">
                Mulai Rp200rb/paket · Tes Minat &amp; Kodie Lab gratis
              </p>
            </article>
          </Muncul>

          <Muncul tunda={0.2} className="flex">
            <article className="flex w-full flex-col rounded-card border border-lime-deep bg-gradient-to-br from-coding-dasar-strong to-coding-dasar-block-to p-6 text-ink shadow-kartu md:p-8">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-ink px-3.5 py-1 font-display text-sm font-extrabold text-lime">
                  SDG 8 · Pekerjaan Layak
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-extrabold leading-snug text-ink">Karier &amp; ruang mengajar talenta IT</h3>
              <p className="mt-2.5 flex-1 leading-relaxed text-ink-soft">
                Membantu siswa menata arah karier teknologi sejak dini sekaligus membuka peluang kerja paruh waktu yang fleksibel bagi
                mahasiswa dan talenta muda IT.
              </p>
              <p className="mt-6 border-t border-ink/15 pt-4 text-sm font-bold text-ink">
                Honor Rp50rb–Rp75rb/sesi · Teaching Playbook siap pakai
              </p>
            </article>
          </Muncul>
        </div>
      </Kontainer>
    </section>
  );
}

const TEKS_HERO =
  "Bantu anak mengasah logika, kreativitas, dan siap menghadapi masa depan digital lewat kelas daring interaktif yang seru dan terarah.";

/**
 * Hero beranda, mengikuti redesain `docs/kodie_landing_page_redesign.html` section 1 dengan perbaikan:
 * badge melayang ditempatkan di luar area ubin (tidak menimpa ikon), teks minimal 14 px,
 * pill "SD sampai SMA" tidak terlipat, keterangan "Gratis · 12 soal · Tanpa akun" diberi label
 * agar jelas milik tes minat, dan tinggi hero pas satu layar.
 */
function Pahlawan() {
  return (
    <section className="px-0 sm:px-4 lg:px-6">
      <div className="hero-kodie vt-band relative flex overflow-hidden rounded-b-[32px] shadow-mengambang md:rounded-b-block">
        <div aria-hidden className="pola-titik pointer-events-none absolute inset-0 opacity-80" />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-sky/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute right-10 top-1/2 size-[28rem] -translate-y-1/2 rounded-full bg-cyan/15 blur-3xl" />

        <Kontainer className="relative grid w-full items-center gap-12 py-12 md:py-16 lg:grid-cols-2 lg:gap-8">
          <RevealHero className="contents" kataJudul={4} kataTeks={jumlahKata(TEKS_HERO)}>
            <div>
            <p data-hero="badge" className="hero-muncul inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-bold text-ice">
              <span aria-hidden className="size-2 animate-pulse rounded-full bg-highlight-on-block-bg" />
              Kurikulum interaktif dan praktik langsung
            </p>
            <h1 className="mt-6 text-32 leading-[1.15] font-extrabold tracking-tight sm:text-48 lg:text-56">
              <KataHero teks="Belajar coding" />
              <br />
              <KataHero teks="dan teknologi" mulaiDari={2} />
              <br />
              <span data-hero="pil" className="hero-muncul mt-3 inline-block">
                <span className="inline-block -rotate-1 whitespace-nowrap rounded-2xl bg-highlight-on-block-bg px-4 py-1 text-highlight-on-block-fg shadow-mengambang">
                  SD sampai SMA
                </span>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ice md:text-lg md:leading-8">
              <KataHero teks={TEKS_HERO} />
            </p>
            <div data-hero="aksi" className="hero-muncul mt-8 flex flex-wrap items-center gap-3.5">
              <TombolTautan href="/tes-minat" varian="ajakan" ukuran="lg" panah className="shadow-mengambang">
                Coba tes minat
              </TombolTautan>
              <TombolTautan href="/kelas" varian="terang" ukuran="lg" className="shadow-kartu">
                Lihat jadwal kelas
              </TombolTautan>
            </div>
            <div data-hero="aksi" style={{ "--i": 1 } as CSSProperties} className="hero-muncul mt-6 flex flex-wrap items-center gap-2.5 text-sm">
              <span className="font-bold text-ice">Tes minat:</span>
              <ul aria-label="Tentang tes minat" className="flex flex-wrap items-center gap-2 font-bold">
                {["Gratis", "12 soal", "Tanpa akun"].map((t) => (
                  <li key={t} className="rounded-full border border-white/15 bg-white/15 px-3.5 py-1">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            </div>

            <IlustrasiHero />
          </RevealHero>
        </Kontainer>
      </div>
    </section>
  );
}

/**
 * Empat ubin bidang dengan orbit putus-putus. Kotak ilustrasi 460 px: ubin menempati area tengah
 * (sekitar 78–382 px), badge berada di pojok kiri atas dan kanan bawah (0–60 px dan 400–460 px),
 * jadi keduanya tidak pernah bertumpuk, termasuk saat melayang ±10 px.
 */
function IlustrasiHero() {
  return (
    <div aria-hidden className="relative mx-auto hidden aspect-square w-full max-w-[460px] lg:block">
      <div data-hero="orbit" className="hero-muncul absolute inset-0">
        <div className="orbit-putar absolute inset-[12%] rounded-full border-2 border-dashed border-white/25" />
        <div className="absolute inset-[4%] rounded-full border border-white/10" />
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <div className="grid grid-cols-2 gap-6">
          {/* Pembungkus luar punya animasi masuk (CSS, urutan `--i`); `melayang-*` di dalamnya animasi terpisah. */}
          <span data-hero="ubin" style={{ "--i": 0 } as CSSProperties} className="hero-muncul block">
            <span className="melayang-1 block">
              <ObjekBidang bidang="software" ukuran={140} miring={-3} />
            </span>
          </span>
          <span data-hero="ubin" style={{ "--i": 1 } as CSSProperties} className="hero-muncul block">
            <span className="melayang-2 block">
              <ObjekBidang bidang="jaringan" ukuran={140} miring={3} />
            </span>
          </span>
          <span data-hero="ubin" style={{ "--i": 2 } as CSSProperties} className="hero-muncul block">
            <span className="melayang-3 block">
              <ObjekBidang bidang="iot" ukuran={140} miring={2} />
            </span>
          </span>
          <span data-hero="ubin" style={{ "--i": 3 } as CSSProperties} className="hero-muncul block">
            <span className="melayang-1 block">
              <ObjekBidang bidang="ai_data" ukuran={140} miring={-2} />
            </span>
          </span>
        </div>
      </div>

      <div data-hero="lencana-kiri" className="hero-muncul absolute left-0 top-0">
      <div className="melayang-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 text-ink shadow-mengambang">
        <span className="grid size-9 place-items-center rounded-xl bg-ice text-sm font-extrabold text-royal">&lt;/&gt;</span>
        <span>
          <span className="block text-sm font-bold leading-tight">Logika dan Python</span>
          <span className="block text-sm leading-tight text-slate-muted">Praktik bikin proyek</span>
        </span>
      </div>
      </div>

      <div data-hero="lencana-kanan" className="hero-muncul absolute bottom-0 right-0">
      <div className="melayang-3 flex items-center gap-3 rounded-2xl border border-white/20 bg-navy-night/90 px-4 py-2.5 text-white shadow-mengambang backdrop-blur-md">
        <span className="size-2.5 rounded-full bg-highlight-on-block-bg" />
        <span>
          <span className="block text-sm font-bold leading-tight">Sesi live interaktif</span>
          <span className="block text-sm leading-tight text-sky-pale">Tanya jawab langsung</span>
        </span>
      </div>
      </div>
    </div>
  );
}

const KEUNGGULAN: { ikon: LucideIcon; label: string; judul: string; ket: string; warnaIkon: string; warnaLabel: string }[] = [
  {
    ikon: Users,
    label: "Maks. 10–15 siswa",
    judul: "Fokus dan interaktif",
    ket: "Maksimal 10 siswa untuk SD dan 15 siswa untuk SMP–SMA, jadi setiap anak sempat bertanya dan dibantu saat praktik.",
    warnaIkon: "bg-primary-subtle text-primary",
    warnaLabel: "bg-primary-subtle text-primary",
  },
  {
    ikon: ShieldCheck,
    label: "Dicek 3 tahap",
    judul: "Aman dan terverifikasi",
    ket: "Setiap pengajar dicek lewat KTP atau KTM, SKCK, dan wawancara sebelum boleh membuka kelas.",
    warnaIkon: "bg-accent text-on-accent",
    warnaLabel: "bg-accent text-on-accent",
  },
  {
    ikon: FileText,
    label: "Setiap sesi",
    judul: "Laporan untuk orang tua",
    ket: "Setelah kelas, orang tua menerima ringkasan materi, catatan kehadiran, catatan pengajar, dan tautan karya anak.",
    warnaIkon: "bg-neutral-subtle text-text",
    warnaLabel: "bg-neutral-subtle text-text",
  },
];

/** Pill sorotan di judul section 2. Koma ikut dibungkus agar tidak terlipat sendirian ke baris baru. */
function PillNilai({ warna, children }: { warna: string; children: React.ReactNode }) {
  return (
    <span className={cx("inline-block rounded-full px-[0.38em] py-[0.04em] leading-[1.18] align-baseline", warna)}>{children}</span>
  );
}

/** Koma yang menempel rapat ke badge (padding kanan badge membuat celah terlihat sebelum koma). */
function KomaRapat() {
  return <span className="-ml-[0.16em]">,</span>;
}

/** Section 2, mengikuti redesain: judul dengan tiga sorotan, satu kalimat penjelas, lalu tiga kartu keunggulan. */
function Nilai() {
  return (
    <section aria-labelledby="judul-nilai" className="relative isolate py-16 md:py-24">
      <div aria-hidden className="aksen-grid" />
      <Kontainer>
        <Muncul className="mx-auto max-w-3xl text-center">
          <h2
            id="judul-nilai"
            className="text-28 leading-[40px] font-extrabold tracking-tight sm:text-32 sm:leading-[48px] md:text-40 md:leading-[56px]"
          >
            Di Kodie, kelasnya{" "}
            <span className="whitespace-nowrap">
              <PillNilai warna="bg-highlight-bg text-highlight-fg">kelompok kecil</PillNilai>
              <KomaRapat />
            </span>
            <br className="hidden sm:inline" /> pengajarnya{" "}
            <span className="whitespace-nowrap">
              <PillNilai warna="bg-accent text-on-accent">terverifikasi</PillNilai>
              <KomaRapat />
            </span>
            <br className="hidden sm:inline" /> dan ada <PillNilai warna="bg-primary-subtle text-text">laporan</PillNilai> setiap sesi.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-muted md:text-lg md:leading-8">
            Anak lebih leluasa bertanya, didampingi pengajar yang aman dan kompeten, dan perkembangannya mudah dipantau orang tua.
          </p>
        </Muncul>

        <ul className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
          {KEUNGGULAN.map((k, i) => (
            <Muncul as="li" key={k.judul} tunda={i * 0.08} className="flex">
              <article className="flex w-full flex-col rounded-card border border-border bg-surface p-6 shadow-kartu transition-[border-color,box-shadow] duration-300 hover:border-primary hover:shadow-kartu-hover">
                <div className="flex items-center justify-between gap-3">
                  <span aria-hidden className={cx("grid size-12 shrink-0 place-items-center rounded-2xl", k.warnaIkon)}>
                    <k.ikon className="size-6" />
                  </span>
                  <span className={cx("rounded-full px-3 py-1 text-sm font-bold", k.warnaLabel)}>{k.label}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold leading-snug">{k.judul}</h3>
                <p className="mt-2 leading-relaxed text-text-muted">{k.ket}</p>
              </article>
            </Muncul>
          ))}
        </ul>
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

function Pengajar() {
  return (
    <section aria-labelledby="judul-pengajar" className="py-16 md:py-24">
      <Kontainer>
        <Muncul className="grid gap-8 rounded-[32px] bg-gradient-to-br from-coding-dasar-strong to-coding-dasar-block-to p-6 text-on-accent md:rounded-block md:p-12 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div>
            <h2
              id="judul-pengajar"
              className="text-28 leading-[34px] font-extrabold tracking-tight md:text-40 md:leading-[46px]"
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
              className="text-28 leading-[38px] font-extrabold tracking-tight sm:text-32 sm:leading-[44px] md:text-40 md:leading-[52px]"
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
