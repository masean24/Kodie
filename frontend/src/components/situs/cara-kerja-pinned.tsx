"use client";

import { useRef, useState } from "react";
import { CalendarDays, Check, ClipboardCheck, CreditCard, FileText, Video, type LucideIcon } from "lucide-react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cx } from "@/lib/cx";
import { gsap, useGSAP } from "@/lib/gsap";
import { Kontainer } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

gsap.registerPlugin(ScrollTrigger);

type Langkah = { ikon: LucideIcon; judul: string; ket: string; penjelasan: string };

/** Penjelasan singkat mengikuti PRD: F4 (tes minat), F6 (booking & bayar), F8 (masuk kelas), F10 (laporan). */
const LANGKAH: Langkah[] = [
  {
    ikon: ClipboardCheck,
    judul: "Coba tes minat",
    ket: "12 soal, tanpa akun",
    penjelasan: "Jawab soal pilihan ganda untuk melihat bidang IT yang paling cocok: Software, Jaringan, IoT, atau AI & Data.",
  },
  {
    ikon: CalendarDays,
    judul: "Pesan kelas",
    ket: "Kursi ditahan 24 jam",
    penjelasan: "Pilih program dan jadwal kelas yang sesuai. Kursi disimpan untukmu selama menunggu pembayaran.",
  },
  {
    ikon: CreditCard,
    judul: "Bayar",
    ket: "Transfer atau QRIS",
    penjelasan: "Bayar lalu unggah bukti pembayaran. Admin memverifikasinya sebelum booking dikonfirmasi.",
  },
  {
    ikon: Video,
    judul: "Masuk kelas",
    ket: "Aktif 15 menit sebelum mulai",
    penjelasan: "Kelas berlangsung di Google Meet. Cukup tekan tombol Masuk kelas, tanpa perlu mencari link sendiri.",
  },
  {
    ikon: FileText,
    judul: "Terima laporan",
    ket: "Ringkasan untuk orang tua",
    penjelasan: "Setelah kelas, pengajar mengirim ringkasan materi, kehadiran, dan catatan yang langsung muncul di dashboard.",
  },
];

/**
 * Garis acuan: tengah area tampak di bawah navbar, yaitu di antara batas atas kolom sticky (`top`, 7rem di desktop)
 * dan tepi bawah layar. Kolom kiri juga dipusatkan di area yang sama, jadi titik, kartu aktif, dan panel kiri sejajar.
 * Ujung garis progres selalu berada di sini, sehingga ujungnya tepat menyentuh titik sebuah langkah saat kartunya
 * berada di tengah area itu; pada saat itu juga langkah tersebut aktif. Di ponsel (kolom tidak sticky) = tengah layar.
 */
function garisAcuan(kolomKiri: HTMLElement | null) {
  const atas = kolomKiri ? parseFloat(getComputedStyle(kolomKiri).top) : NaN;
  return ((Number.isFinite(atas) ? atas : 0) + window.innerHeight) / 2;
}

/**
 * Warna aksen per langkah dari palet Kodie (lime dan biru): perjalanan dibuka dan ditutup dengan lime,
 * tahap di tengah bergradasi biru. `aksen` dipakai untuk titik, garis progres, nomor besar, dan cahaya kartu aktif.
 */
const WARNA: { ubin: string; aksen: string }[] = [
  { ubin: "bg-coding-dasar-strong text-[#0f172a]", aksen: "var(--k-coding-dasar-strong)" },
  { ubin: "bg-kelas-reguler-strong text-[#0f172a]", aksen: "var(--k-kelas-reguler-strong)" },
  { ubin: "blok-merek", aksen: "var(--k-primary)" },
  { ubin: "bg-software-strong text-[#0f172a]", aksen: "var(--k-software-strong)" },
  { ubin: "bg-iot-strong text-[#0f172a]", aksen: "var(--k-iot-strong)" },
];

/** Gradien garis progres; berhenti warna diletakkan rata agar kira-kira sejajar dengan titik tiap langkah. */
const GRADIEN_GARIS = `linear-gradient(to bottom, ${WARNA.map((w, i) => `${w.aksen} ${Math.round(((i + 0.5) / WARNA.length) * 100)}%`).join(", ")})`;

type Status ="selesai" | "aktif" | "berikutnya" | "biasa";

function statusLangkah(i: number, aktif: number | null): Status {
  if (aktif === null) return "biasa";
  if (i < aktif) return "selesai";
  if (i === aktif) return "aktif";
  return "berikutnya";
}

/**
 * Section "Dari tes minat sampai laporan" dengan scroll storytelling.
 *
 * - Desktop (≥ 1024 px): dua kolom. Kolom kiri (judul + panel progres) `sticky`; kolom kanan berisi lima kartu
 *   langkah yang di-scroll biasa di sepanjang garis vertikal. Kartu yang melintasi garis acuan (tengah area di bawah navbar)
 *   menjadi aktif (kartu terangkat), langkah sebelumnya selesai, sisanya redup. Panel kiri dan garis progres
 *   mengikuti. Scroll tidak dibajak dan tidak di-snap.
 * - Ponsel/tablet: kolom kanan saja (timeline vertikal) dengan perilaku aktif yang sama.
 * - `prefers-reduced-motion` atau tanpa JavaScript: tampilan statis, semua langkah tampil normal.
 *
 * Section ini dikecualikan dari animasi elemen global (`data-tanpa-animasi`) karena status kartunya diatur sendiri.
 */
export function CaraKerjaPinned() {
  const section = useRef<HTMLElement>(null);
  const daftar = useRef<HTMLOListElement>(null);
  const garis = useRef<HTMLSpanElement>(null);
  const kolomKiri = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState<number | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const ol = daftar.current;
        const jalur = garis.current;
        if (!ol || !jalur) return;
        setAktif(0);
        gsap.set(jalur, { clipPath: "inset(0 0 100% 0)" });
        const kartu = [...ol.querySelectorAll<HTMLElement>("[data-langkah]")];
        // Dihitung dari posisi, bukan dari event masuk/keluar per kartu, agar tetap benar saat scroll melompat
        // (tombol End, tautan jangkar, kembali ke halaman). Di atas daftar = langkah 1, setelah daftar = langkah 5.
        const hitung = () => {
          const acuan = garisAcuan(kolomKiri.current);
          let idx = 0;
          kartu.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            if (r.top + r.height / 2 <= acuan + 1) idx = i;
          });
          setAktif(idx);
          // Kotak garis itu sendiri (clip-path tidak mengubah getBoundingClientRect), bukan <ol> yang punya ruang bawah.
          const kotak = jalur.getBoundingClientRect();
          const isi = kotak.height > 0 ? (acuan - kotak.top) / kotak.height : 0;
          // clip-path, bukan scaleY, agar gradien warna tetap di tempatnya (sejajar titik langkah) saat garis bertambah.
          const persen = Math.min(1, Math.max(0, isi)) * 100;
          gsap.set(jalur, { clipPath: `inset(0 0 ${(100 - persen).toFixed(2)}% 0)` });
        };
        const pemicu = ScrollTrigger.create({
          trigger: section.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: hitung,
          onRefresh: hitung,
        });
        hitung();
        return () => {
          pemicu.kill();
          setAktif(null);
        };
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  const jumlahSelesai = aktif === null ? LANGKAH.length : aktif + 1;
  const sorotan = aktif ?? 0;
  const SorotanIkon = LANGKAH[sorotan].ikon;

  return (
    <section
      ref={section}
      aria-labelledby="judul-cara"
      data-tanpa-animasi
      className="relative isolate bg-surface-sunken py-16 md:py-24"
    >
      {/*
        Cahaya warna lembut di latar. Dipotong oleh lapisannya sendiri (saudara, bukan leluhur kolom sticky):
        overflow apa pun pada <section> bisa mematikan `position: sticky` di sebagian browser.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 bottom-0 size-[520px] rounded-full bg-coding-dasar-strong/25 blur-3xl [[data-theme=dark]_&]:opacity-35" />
        <div className="absolute -right-40 top-10 size-[560px] rounded-full bg-kelas-reguler-strong/30 blur-3xl" />
      </div>
      <Kontainer className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        {/*
          Kolom kiri: menempel selama daftar langkah di-scroll, setinggi area di bawah navbar dan isinya dipusatkan
          secara vertikal (sejajar garis acuan). Di layar pendek (≤ 820 px) ukurannya dipadatkan agar tidak terpotong.
        */}
        <div
          ref={kolomKiri}
          className="lg:sticky lg:top-28 lg:flex lg:h-[calc(100vh-7rem)] lg:flex-col lg:self-start lg:py-4 lg:[justify-content:safe_center]"
        >
          <h2
            id="judul-cara"
            className="text-center text-[28px] leading-[38px] font-extrabold tracking-tight sm:text-[34px] sm:leading-[44px] md:text-[40px] md:leading-[52px] lg:text-left lg:[@media(max-height:820px)]:text-[32px] lg:[@media(max-height:820px)]:leading-[42px]"
          >
            Dari tes minat sampai laporan
          </h2>

          {/* Panel progres: blok warna merek dengan aksen lime. */}
          <div className="blok-merek on-block relative mt-6 hidden overflow-hidden rounded-3xl p-6 shadow-xl lg:block lg:[@media(max-height:820px)]:mt-4 lg:[@media(max-height:820px)]:p-5">
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#c6f64d]/20 blur-2xl" />
            <span aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 size-44 rounded-full bg-[#60a5fa]/30 blur-2xl" />

            {/* Bagian ringkasan (duplikat isi kartu kanan) disembunyikan dari pembaca layar. */}
            <div aria-hidden>
            {/* Langkah yang sedang dibaca, berganti mengikuti scroll. */}
            <div className="relative flex items-center justify-between text-xs font-semibold tracking-wide text-white/70 uppercase">
              <span>Alur belajar di Kodie</span>
              <span className="rounded-full bg-white/12 px-2.5 py-1 text-white tabular-nums">
                {sorotan + 1}/{LANGKAH.length}
              </span>
            </div>
            <div className="relative mt-4 flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 lg:[@media(max-height:820px)]:mt-3 lg:[@media(max-height:820px)]:p-3">
              <span
                className={cx(
                  "grid size-14 shrink-0 place-items-center rounded-2xl shadow-md lg:[@media(max-height:820px)]:size-11",
                  WARNA[sorotan].ubin,
                )}
              >
                <SorotanIkon className="size-7 lg:[@media(max-height:820px)]:size-6" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl leading-tight font-bold text-white">{LANGKAH[sorotan].judul}</p>
                <p className="mt-1 text-sm text-white/75">{LANGKAH[sorotan].ket}</p>
              </div>
            </div>

            <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white/15 lg:[@media(max-height:820px)]:mt-4">
              <span
                className="block h-full rounded-full bg-[#c6f64d] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${(jumlahSelesai / LANGKAH.length) * 100}%` }}
              />
            </div>
            <ul className="relative mt-4 flex flex-col gap-1 lg:[@media(max-height:820px)]:mt-3 lg:[@media(max-height:820px)]:gap-0.5">
              {LANGKAH.map((l, i) => {
                const st = statusLangkah(i, aktif);
                const selesai = st === "selesai" || st === "biasa";
                return (
                  <li
                    key={l.judul}
                    className={cx(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-300 lg:[@media(max-height:820px)]:py-1.5",
                      st === "aktif" && "bg-white/12 font-semibold text-white",
                      st === "berikutnya" && "text-white/60",
                      selesai && "font-medium text-white/90",
                    )}
                  >
                    <span
                      className={cx(
                        "grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-300",
                        selesai ? "bg-[#c6f64d] text-[#0f172a]" : st === "aktif" ? "ring-2 ring-[#c6f64d]" : "ring-1 ring-white/35",
                      )}
                    >
                      {selesai ? <Check className="size-3" /> : null}
                      {st === "aktif" ? <span className="size-2 rounded-full bg-[#c6f64d]" /> : null}
                    </span>
                    {l.judul}
                  </li>
                );
              })}
            </ul>
            </div>

            {/* Ajakan memulai dari langkah pertama. */}
            <div className="relative mt-5 flex items-center justify-between gap-4 border-t border-white/15 pt-4 lg:[@media(max-height:820px)]:mt-4 lg:[@media(max-height:820px)]:pt-3">
              <p className="text-sm text-white/75">Mulai dari langkah pertama, tanpa akun.</p>
              <TombolTautan href="/tes-minat" varian="ajakan" panah className="shrink-0">
                Coba tes minat
              </TombolTautan>
            </div>
          </div>
        </div>

        {/* Kolom kanan: kartu langkah di sepanjang garis vertikal. */}
        {/*
          Jarak antarkartu dibuat lebar (berbasis tinggi layar) agar saat satu kartu di tengah layar, kartu berikutnya
          belum terlihat jelas. Ruang atas memastikan kolom kiri sudah menempel (dan utuh) saat kartu pertama tiba di
          garis acuan: tengah kartu pertama ≥ (tinggi layar − 7rem) / 2 dari atas kolom. Ruang bawah membuat panel kiri
          tetap menempel sampai langkah terakhir selesai dibaca.
        */}
        <ol
          ref={daftar}
          className="relative flex flex-col gap-[24vh] pl-10 sm:pl-12 lg:gap-[34vh] lg:pb-[30vh] lg:pt-[max(2rem,calc(50vh-180px))]"
        >
          <span aria-hidden className="absolute bottom-0 left-3 top-0 w-1 -translate-x-1/2 rounded-full bg-border sm:left-4 lg:bottom-[30vh]" />
          <span
            ref={garis}
            aria-hidden
            className="absolute bottom-0 left-3 top-0 w-1 -translate-x-1/2 rounded-full sm:left-4 lg:bottom-[30vh]"
            style={{ backgroundImage: GRADIEN_GARIS }}
          />
          {LANGKAH.map((l, i) => (
            <KartuLangkah key={l.judul} l={l} i={i} status={statusLangkah(i, aktif)} />
          ))}
        </ol>
      </Kontainer>
    </section>
  );
}

function KartuLangkah({ l, i, status }: { l: Langkah; i: number; status: Status }) {
  const aktif = status === "aktif";
  const tampil = aktif || status === "biasa";
  const { ubin, aksen } = WARNA[i];
  return (
    <li data-langkah aria-current={aktif ? "step" : undefined} className="relative">
      {/* Titik pada garis, berwarna aksen langkah. */}
      <span
        aria-hidden
        className={cx(
          "absolute -left-7 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background-color,box-shadow,scale] duration-500 motion-reduce:transition-none sm:-left-8",
          aktif && "scale-125",
        )}
        style={{
          backgroundColor: status === "berikutnya" ? "var(--k-surface)" : aksen,
          boxShadow: aktif
            ? `0 0 0 4px var(--k-surface), 0 0 0 7px color-mix(in oklab, ${aksen} 55%, transparent)`
            : status === "berikutnya"
              ? "inset 0 0 0 2px var(--k-border)"
              : "0 0 0 3px var(--k-surface)",
        }}
      />
      <div
        className={cx(
          "relative overflow-hidden rounded-3xl border p-6 transition-[background-color,border-color,box-shadow,opacity,translate] duration-500 ease-out motion-reduce:transition-none sm:p-8 lg:min-h-[320px] lg:p-10",
          tampil ? "border-border bg-surface" : "border-transparent bg-transparent shadow-none",
          aktif && "lg:translate-x-2",
          status === "berikutnya" && "opacity-55",
          status === "selesai" && "opacity-75",
        )}
        style={
          tampil
            ? {
                backgroundImage: `radial-gradient(120% 90% at 100% 0%, color-mix(in oklab, ${aksen} 30%, transparent), transparent 60%)`,
                boxShadow: `0 22px 44px -22px color-mix(in oklab, ${aksen} 75%, transparent)`,
                borderColor: aktif ? `color-mix(in oklab, ${aksen} 60%, var(--k-border))` : undefined,
              }
            : undefined
        }
      >
        {/* Nomor besar bergaris tepi berwarna aksen sebagai penanda langkah. */}
        <span
          aria-hidden
          className={cx(
            "pointer-events-none absolute right-5 top-2 select-none font-display text-[72px] leading-none font-extrabold transition-opacity duration-500 sm:text-[96px] lg:right-8 lg:top-4 lg:text-[120px]",
            tampil ? "opacity-100" : "opacity-50",
          )}
          style={{
            color: tampil ? `color-mix(in oklab, ${aksen} 28%, transparent)` : "transparent",
            WebkitTextStroke: `1.5px color-mix(in oklab, ${aksen} 80%, var(--k-text) 20%)`,
          }}
        >
          {String(i + 1).padStart(2, "0")}
        </span>
        <span
          aria-hidden
          className={cx(
            "relative grid size-12 place-items-center rounded-2xl shadow-sm transition-transform duration-500 lg:size-14",
            ubin,
            aktif && "-rotate-6",
          )}
        >
          <l.ikon className="size-6 lg:size-7" />
        </span>
        <span className="relative mt-5 inline-flex rounded-full border border-border bg-surface-sunken px-3 py-1 text-sm font-semibold text-text-muted">
          {l.ket}
        </span>
        <h3 className="relative mt-3 text-xl leading-snug font-bold sm:text-2xl lg:text-[28px] lg:leading-9">{l.judul}</h3>
        <p className="relative mt-2 max-w-[34rem] text-base leading-7 text-text-muted lg:text-lg lg:leading-8">
          {l.penjelasan}
        </p>
      </div>
    </li>
  );
}
