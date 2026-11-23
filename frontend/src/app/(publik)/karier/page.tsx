import type { Metadata } from "next";
import { CalendarClock, BookOpenCheck, Laptop, Sparkles, type LucideIcon } from "lucide-react";
import { KEUNTUNGAN, LANGKAH_LAMARAN, POSISI } from "@/lib/karier";
import { Kontainer, Sorotan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { ObjekBidang } from "@/components/kategori";
import { Muncul } from "@/components/ui/gerak";
import { DaftarPosisi } from "@/components/karier/daftar-posisi";

export const metadata: Metadata = {
  title: "Karier pengajar",
  description: "Lowongan pengajar paruh waktu di Kodie untuk mahasiswa, lulusan, dan pencari kerja. Mengajar coding dan teknologi secara daring.",
};

const IKON_KEUNTUNGAN: LucideIcon[] = [CalendarClock, Laptop, BookOpenCheck, Sparkles];

export default function HalamanKarier() {
  return (
    <>
      <section className="hero-layar blok-merek on-block relative flex overflow-hidden rounded-b-[32px] md:rounded-b-block">
        <ObjekBidang bidang="software" ukuran={120} miring={-8} className="absolute -left-6 top-10 hidden lg:block" />
        <ObjekBidang bidang="jaringan" ukuran={96} miring={8} className="absolute right-[6%] top-12 hidden lg:block" />
        <ObjekBidang bidang="iot" ukuran={104} miring={6} className="absolute bottom-14 left-[8%] hidden xl:block" />
        <ObjekBidang bidang="ai_data" ukuran={128} miring={-5} className="absolute -right-4 bottom-12 hidden lg:block" />
        <Kontainer className="relative flex w-full flex-col items-center justify-center py-16 text-center">
          <p className="rounded-full bg-white/15 px-4 py-1 text-sm font-bold ring-1 ring-white/40">Karier di Kodie</p>
          <h1 className="mt-5 max-w-3xl text-[32px] leading-[42px] font-extrabold tracking-tight sm:text-[42px] sm:leading-[54px] lg:text-[54px] lg:leading-[68px]">
            Bagikan ilmumu, <Sorotan diBlok>jadi pengajar</Sorotan> Kodie
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 md:text-lg md:leading-8">
            Untuk mahasiswa, lulusan, dan pencari kerja yang ingin mengajar coding dan teknologi ke siswa SD sampai SMA. Daring, paruh
            waktu, dengan jadwal yang kamu atur sendiri.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <TombolTautan href="#posisi" varian="ajakan" ukuran="lg" panah>
              Lihat {POSISI.length} posisi
            </TombolTautan>
            <TombolTautan href="#cara-melamar" varian="terang" ukuran="lg">
              Cara melamar
            </TombolTautan>
          </div>
        </Kontainer>
      </section>

      <section aria-labelledby="judul-keuntungan" className="py-16 md:py-24">
        <Kontainer>
          <h2 id="judul-keuntungan" className="text-center text-[28px] leading-[38px] font-extrabold tracking-tight md:text-[40px] md:leading-[52px]">
            Kenapa mengajar di Kodie?
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {KEUNTUNGAN.map((k, i) => {
              const Ikon = IKON_KEUNTUNGAN[i] ?? Sparkles;
              return (
                <Muncul as="li" key={k.judul} tunda={i * 0.07} className="rounded-card border border-border bg-surface p-6 shadow-kartu">
                  <span aria-hidden className="blok-merek grid size-12 place-items-center rounded-full">
                    <Ikon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{k.judul}</h3>
                  <p className="mt-1 text-text-muted">{k.ket}</p>
                </Muncul>
              );
            })}
          </ul>
        </Kontainer>
      </section>

      <section id="posisi" aria-labelledby="judul-posisi" className="scroll-mt-24 bg-surface-sunken py-16 md:py-24">
        <Kontainer>
          <h2 id="judul-posisi" className="text-[28px] leading-[38px] font-extrabold tracking-tight md:text-[40px] md:leading-[52px]">
            Posisi yang <Sorotan>sedang dibuka</Sorotan>
          </h2>
          <p className="mt-3 max-w-2xl text-text-muted md:text-lg">Semua posisi daring dan paruh waktu. Pilih bidang yang paling kamu kuasai.</p>
          <div className="mt-8">
            <DaftarPosisi posisi={POSISI} />
          </div>
        </Kontainer>
      </section>

      <section id="cara-melamar" aria-labelledby="judul-cara-melamar" className="scroll-mt-24 py-16 md:py-24">
        <Kontainer>
          <h2
            id="judul-cara-melamar"
            className="text-center text-[28px] leading-[38px] font-extrabold tracking-tight md:text-[40px] md:leading-[52px]"
          >
            Cara melamar
          </h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {LANGKAH_LAMARAN.map((l, i) => (
              <Muncul as="li" key={l.judul} tunda={i * 0.07} className="flex flex-col items-center text-center">
                <span className="blok-merek grid size-14 place-items-center rounded-full text-xl font-extrabold">{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold leading-snug">{l.judul}</h3>
                <p className="mt-1 text-text-muted">{l.ket}</p>
              </Muncul>
            ))}
          </ol>
        </Kontainer>
      </section>
    </>
  );
}
