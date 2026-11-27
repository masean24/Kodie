import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Blocks, Code2, PenTool, Terminal, type LucideIcon } from "lucide-react";
import { Kontainer } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { Muncul } from "@/components/ui/gerak";
import { BandKodie, LencanaBand, SorotanBand } from "@/components/situs/judul-halaman";
import { KataHero, jumlahKata } from "@/components/situs/reveal-hero";
import { FilterKarya } from "./filter-karya";

export const metadata: Metadata = {
  title: "Showcase karya",
  alternates: { canonical: "/showcase" },
  description: "Contoh proyek yang bisa dibuat siswa di Kodie Lab: blok, Python Turtle, HTML/CSS/JavaScript, dan Python.",
};

interface Karya {
  judul: string;
  jenjang: string;
  mode: string;
  ikon: LucideIcon;
  ket: string;
  kode: string;
  pratinjau: ReactNode;
}

/** Pratinjau bunga: 12 lingkaran yang diputar 30°, sama seperti contoh Python Turtle di Kodie Lab. */
function PratinjauBunga() {
  const warna = ["#1d4ed8", "#84cc16", "#f97316", "#ec4899", "#0ea5e9", "#8b5cf6"];
  return (
    <svg viewBox="0 0 160 160" width="160" height="160" className="h-full w-auto" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => {
        const sudut = ((90 + i * 30) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={80 + 30 * Math.cos(sudut)}
            cy={80 - 30 * Math.sin(sudut)}
            r={30}
            fill="none"
            stroke={warna[i % warna.length]}
            strokeWidth={1.6}
          />
        );
      })}
    </svg>
  );
}

function PratinjauPersegi() {
  return (
    <svg viewBox="0 0 160 160" width="160" height="160" className="h-full w-auto" aria-hidden>
      <path d="M40 120 L120 120 L120 40 L40 40 Z" fill="none" stroke="#1d4ed8" strokeWidth={4} strokeLinejoin="round" />
      <circle cx={40} cy={120} r={7} fill="#c6f64d" stroke="#0f172a" strokeWidth={2} />
    </svg>
  );
}

function PratinjauKartu() {
  return (
    <div aria-hidden className="grid h-full w-full place-items-center rounded-[14px] bg-gradient-to-br from-royal to-sky">
      <div className="flex w-40 flex-col items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-mengambang">
        <span className="h-2.5 w-24 rounded-full bg-ink" />
        <span className="h-2 w-28 rounded-full bg-slate-300" />
        <span className="mt-1 rounded-full bg-lime px-3 py-1 text-sm font-bold text-ink">Klik aku</span>
      </div>
    </div>
  );
}

function PratinjauTerminal() {
  return (
    <div aria-hidden className="h-full w-full rounded-[14px] bg-ink p-4 font-mono text-sm leading-5 text-slate-200">
      <p>Halo, Kiko! 🤖</p>
      <p>7 x 1 = 7</p>
      <p>7 x 2 = 14</p>
      <p>7 x 3 = 21</p>
      <p className="text-lime">Rata-rata nilai: 83.75</p>
    </div>
  );
}

const KARYA: Karya[] = [
  {
    judul: "Kiko menggambar persegi",
    jenjang: "SD",
    mode: "Blok",
    ikon: Blocks,
    ket: "Menyusun blok maju dan belok di dalam perulangan. Cocok untuk mengenal urutan dan perulangan tanpa mengetik kode.",
    kode: "ulangi 4 kali:\n  maju 120 langkah\n  belok kanan 90 derajat\nKiko bilang \"Persegi selesai!\"",
    pratinjau: <PratinjauPersegi />,
  },
  {
    judul: "Bunga warna-warni",
    jenjang: "SD–SMP",
    mode: "Python Turtle",
    ikon: PenTool,
    ket: "Dua belas lingkaran yang diputar sedikit demi sedikit membentuk bunga. Belajar perulangan, daftar, dan sudut.",
    kode: "for i in range(12):\n    kiko.pencolor(warna[i % len(warna)])\n    kiko.circle(80)\n    kiko.left(30)",
    pratinjau: <PratinjauBunga />,
  },
  {
    judul: "Kartu sapa interaktif",
    jenjang: "SMP–SMA",
    mode: "HTML, CSS, JS",
    ikon: Code2,
    ket: "Halaman web kecil dengan tombol yang menghitung jumlah klik. Belajar struktur HTML, gaya CSS, dan event JavaScript.",
    kode: 'tombol.addEventListener("click", () => {\n  jumlah = jumlah + 1;\n  hitung.textContent = "Klik ke-" + jumlah;\n});',
    pratinjau: <PratinjauKartu />,
  },
  {
    judul: "Hitung rata-rata nilai",
    jenjang: "SMP–SMA",
    mode: "Python",
    ikon: Terminal,
    ket: "Program Python yang mencetak tabel perkalian dan menghitung rata-rata nilai dengan fungsi buatan sendiri.",
    kode: "def rata_rata(angka):\n    return sum(angka) / len(angka)\n\nprint(rata_rata([80, 92, 75, 88]))",
    pratinjau: <PratinjauTerminal />,
  },
];

const TEKS_SHOWCASE =
  "Contoh proyek yang bisa dibuat siswa di Kodie Lab, dari menyusun blok sampai menulis Python. Semuanya berjalan langsung di browser, gratis, tanpa akun.";

export default function HalamanShowcase() {
  return (
    <>
      <BandKodie kataJudul={1} kataTeks={jumlahKata(TEKS_SHOWCASE)}>
        <Kontainer className="relative pb-10 pt-6 md:pb-14 md:pt-8">
          <LencanaBand>Dibuat di Kodie Lab</LencanaBand>
          <h1 className="mt-4 text-32 leading-[40px] font-extrabold tracking-tight sm:text-40 sm:leading-[48px] md:text-48 md:leading-[58px]">
            <KataHero teks="Showcase" /> <SorotanBand>karya</SorotanBand>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ice md:text-lg">
            <KataHero teks={TEKS_SHOWCASE} />
          </p>
        </Kontainer>
      </BandKodie>

      <Kontainer className="py-10 md:py-14">
        <FilterKarya
          karya={KARYA.map((k, i) => ({
            kunci: k.judul,
            jenjang: k.jenjang,
            isi: (
            <Muncul key={k.judul} tunda={i * 0.06} className="flex w-full min-w-0">
              <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-kartu">
                <div className="grid h-44 place-items-center border-b border-border bg-surface-sunken p-3">{k.pratinjau}</div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-text">
                      <k.ikon aria-hidden className="size-4" />
                      {k.mode}
                    </span>
                    <span className="rounded-full bg-surface-sunken px-3 py-1 text-text">{k.jenjang}</span>
                  </div>
                  <h2 className="text-xl font-bold">{k.judul}</h2>
                  <p className="text-base leading-7 text-text-muted">{k.ket}</p>
                  <pre className="overflow-x-auto rounded-card-sm bg-surface-sunken p-4 font-mono text-sm leading-6 text-text">
                    <code>{k.kode}</code>
                  </pre>
                  <TombolTautan href="/lab" varian="kedua" panah className="mt-auto self-start">
                    Coba di Kodie Lab
                  </TombolTautan>
                </div>
              </article>
            </Muncul>
            ),
          }))}
        />
      </Kontainer>
    </>
  );
}
