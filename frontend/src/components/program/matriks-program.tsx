"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, Check, Star } from "lucide-react";
import type { Program } from "@/types/database";
import { labelJenjang } from "@/components/kategori";
import { cx } from "@/lib/cx";
import { formatRupiah } from "@/lib/format";
import { kalimatPertama } from "./kartu-program";
import { batasKapasitas } from "@/lib/mengajar";

type ColorVar = "p0" | "p1" | "p2" | "p3";
type GradeTag = "tk1" | "sd56" | "smp78" | "smp9sma";
type GradeFilter = "all" | GradeTag;

interface ProgramMatriks {
  slug: string;
  name: string;
  shortName: string;
  jenjangLabel: string;
  gradeTags: GradeTag[];
  colorVar: ColorVar;
  tagline: string;
  tools: string[];
  duration: string;
  sessionCount: number;
  quota: string;
  output: string;
  parentReport: boolean;
  jurusanRapor: boolean;
  price: string;
  perSesi: string;
}

const META_PROGRAM: Record<
  string,
  {
    shortName: string;
    gradeTags: GradeTag[];
    colorVar: ColorVar;
    tagline: string;
    tools: string[];
    output: string;
    jurusanRapor: boolean;
  }
> = {
  "kenal-komputer": {
    shortName: "Kenal Komputer",
    gradeTags: ["tk1"],
    colorVar: "p0",
    tagline: "Pertama kali memakai komputer dengan aman",
    tools: ["Mouse & keyboard", "Windows", "Folder"],
    output: "Folder karya pertama anak",
    jurusanRapor: false,
  },
  "coding-dasar": {
    shortName: "Coding Dasar",
    gradeTags: ["sd56"],
    colorVar: "p1",
    tagline: "Kenal logika tanpa mengetik kode",
    tools: ["Scratch", "Logika", "Animasi"],
    output: "Game & animasi Scratch",
    jurusanRapor: false,
  },
  "kelas-reguler-teknologi": {
    shortName: "Kelas Reguler",
    gradeTags: ["smp78", "smp9sma"],
    colorVar: "p2",
    tagline: "Belajar bertahap bikin proyek nyata",
    tools: ["HTML/CSS/JS", "IoT Virtual", "AI Dasar"],
    output: "Portofolio proyek tiap level",
    jurusanRapor: false,
  },
  "simulasi-jurusan-it": {
    shortName: "Simulasi Jurusan IT",
    gradeTags: ["smp9sma"],
    colorVar: "p3",
    tagline: "Coba 4 bidang kuliah IT dalam 1 paket",
    tools: ["Software", "Jaringan", "IoT", "AI"],
    output: "Rapor Rekomendasi Jurusan IT",
    jurusanRapor: true,
  },
};

const GRADE_PILLS: { id: GradeFilter; label: string }[] = [
  { id: "all", label: "Semua jenjang" },
  { id: "tk1", label: "Usia 5–7 (TK B–SD 1)" },
  { id: "sd56", label: "SD kelas 5–6" },
  { id: "smp78", label: "SMP kelas 7–8" },
  { id: "smp9sma", label: "SMP kelas 9 / SMA" },
];

function turunkanTags(p: Program): GradeTag[] {
  const tags: GradeTag[] = [];
  if (p.jenjang.includes("TK")) tags.push("tk1");
  else if (p.jenjang.includes("SD")) tags.push("sd56");
  if (p.jenjang.includes("SMP") && p.kelas_min <= 8) tags.push("smp78");
  if (p.jenjang.includes("SMA") || (p.jenjang.includes("SMP") && p.kelas_maks >= 9)) tags.push("smp9sma");
  return tags.length > 0 ? tags : ["smp9sma"];
}

function petakanProgram(p: Program): ProgramMatriks {
  const meta = META_PROGRAM[p.slug];
  const sessionCount = Math.max(1, p.jumlah_sesi);
  const pricePerSession = formatRupiah(p.harga_paket / sessionCount);
  const toolsFallback = p.jenjang.slice(0, 3);

  return {
    slug: p.slug,
    name: p.nama,
    shortName: meta?.shortName ?? p.nama,
    jenjangLabel: labelJenjang(p.jenjang, p.kelas_min, p.kelas_maks),
    gradeTags: meta?.gradeTags ?? turunkanTags(p),
    colorVar: meta?.colorVar ?? "p2",
    tagline: meta?.tagline ?? kalimatPertama(p.deskripsi),
    tools: meta?.tools ?? toolsFallback,
    duration: `${p.jumlah_sesi} sesi × ${p.durasi_menit} menit`,
    sessionCount: p.jumlah_sesi,
    quota: `Maks. ${batasKapasitas(p.jenjang)} siswa`,
    output: meta?.output ?? "Proyek praktik tiap sesi",
    parentReport: true,
    jurusanRapor: meta?.jurusanRapor ?? p.slug === "simulasi-jurusan-it",
    price: formatRupiah(p.harga_paket),
    perSesi: `${pricePerSession} / sesi`,
  };
}

function cocokJenjang(p: ProgramMatriks, filter: GradeFilter): boolean {
  if (filter === "all") return true;
  return p.gradeTags.includes(filter);
}

function Centang({ label, colorVar }: { label: string; colorVar: ColorVar }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold">
      <span
        aria-hidden="true"
        className="grid size-5 shrink-0 place-items-center rounded-full"
        style={{
          backgroundColor: `var(--mp-${colorVar}-check-bg)`,
          color: `var(--mp-${colorVar}-check-fg)`,
        }}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span>{label}</span>
    </span>
  );
}

function StripTidakTermasuk() {
  return (
    <span className="text-sm font-normal" style={{ color: "var(--mp-text-soft)" }}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Tidak termasuk</span>
    </span>
  );
}

interface BarisPerbandingan {
  label: string;
  align: "align-top" | "align-middle";
  render: (p: ProgramMatriks) => ReactNode;
}

const COMPARISON_ROWS: BarisPerbandingan[] = [
  {
    label: "Fokus & alat belajar",
    align: "align-top",
    render: (p) => (
      <>
        <p className="text-sm leading-snug font-semibold">{p.tagline}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {p.tools.map((tool) => (
            <span
              key={tool}
              className="whitespace-nowrap rounded-lg border px-2.5 py-0.5 text-sm font-semibold"
              style={{
                backgroundColor: `var(--mp-${p.colorVar}-chip-bg)`,
                borderColor: `var(--mp-${p.colorVar}-chip-border)`,
                color: `var(--mp-${p.colorVar}-chip-fg)`,
              }}
            >
              {tool}
            </span>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "Durasi paket",
    align: "align-middle",
    render: (p) => (
      <>
        <p className="text-sm font-bold">{p.duration}</p>
        <p className="mt-0.5 text-sm text-text-muted">Seminggu sekali · daring live</p>
      </>
    ),
  },
  {
    label: "Kuota kelas",
    align: "align-middle",
    render: (p) => <span className="text-sm font-semibold">{p.quota}</span>,
  },
  {
    label: "Hasil akhir (output)",
    align: "align-middle",
    render: (p) => <span className="text-sm font-bold">{p.output}</span>,
  },
  {
    label: "Laporan orang tua",
    align: "align-middle",
    render: (p) => (p.parentReport ? <Centang label="Setiap sesi" colorVar={p.colorVar} /> : <StripTidakTermasuk />),
  },
  {
    label: "Rapor jurusan kuliah IT",
    align: "align-middle",
    render: (p) =>
      p.jurusanRapor ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 font-display text-sm font-extrabold text-obsidian shadow-kartu">
          <Star aria-hidden className="size-4 fill-current" />
          <span>Khusus program ini</span>
        </span>
      ) : (
        <StripTidakTermasuk />
      ),
  },
];

/** Matriks 3-kolom color-block untuk membandingkan program Coding Dasar, Kelas Reguler, & Simulasi Jurusan IT. */
export function MatriksProgram({ daftar }: { daftar: Program[] }) {
  const [selectedGrade, setSelectedGrade] = useState<GradeFilter>("all");
  const [mobileProgramIdx, setMobileProgramIdx] = useState(0);

  const programs = daftar.map(petakanProgram);
  if (programs.length === 0) return null;

  const safeIdx = mobileProgramIdx < programs.length ? mobileProgramIdx : 0;
  const mobileProg = programs[safeIdx];
  const isMobileDarkHead = mobileProg.colorVar === "p3";

  return (
    <section aria-labelledby="judul-banding" className="mt-14" data-tanpa-animasi>
      {/* Header & Filter Sorot Jenjang */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="judul-banding" className="font-display text-2xl font-extrabold md:text-32">
            Bandingkan program
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Lihat pembeda utama tiap program secara sejajar. Pilih jenjang anak untuk menyorot yang cocok.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Sorot program berdasarkan jenjang"
        >
          {GRADE_PILLS.map((g) => {
            const active = selectedGrade === g.id;
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedGrade(g.id)}
                // Tebal huruf sama di semua keadaan: tombol tidak melebar/menyempit saat dipilih.
                className="min-h-[44px] rounded-full border px-3.5 py-2 font-display text-sm font-bold transition-colors"
                style={
                  active
                    ? {
                        backgroundColor: "var(--k-lime)",
                        borderColor: "var(--k-lime)",
                        color: "var(--k-obsidian)",
                      }
                    : {
                        backgroundColor: "var(--mp-surface)",
                        borderColor: "var(--mp-border-strong)",
                        color: "var(--k-text-muted)",
                      }
                }
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAMPILAN DESKTOP: Matriks 3-Kolom Color-Block */}
      <div className="matrix-panel mt-6 hidden overflow-hidden rounded-[26px] md:block">
        <div className="overflow-x-auto">
          <table className="matrix-table w-full min-w-[760px] table-fixed text-left">
            <caption className="sr-only">
              Perbandingan jenjang, fokus belajar, durasi, kuota, output, laporan, dan harga program Kodie
            </caption>
            <thead>
              <tr>
                <th
                  className="px-4 py-5 align-bottom lg:px-6 lg:py-6"
                  style={{ backgroundColor: "var(--mp-surface)", width: programs.length > 3 ? "20%" : "23.5%" }}
                >
                  <p
                    className="font-display text-sm font-bold"
                    style={{ color: "var(--mp-link)" }}
                  >
                    Aspek pembanding
                  </p>
                  <p className="mt-2 text-sm leading-relaxed font-normal text-text-muted">
                    Semua paket 4 sesi live kelompok kecil dengan pengajar terverifikasi.
                  </p>
                </th>

                {programs.map((p) => {
                  const match = cocokJenjang(p, selectedGrade);
                  const stateCls = selectedGrade === "all" ? "" : match ? "is-highlighted" : "is-dimmed";
                  const isDarkBlock = p.colorVar === "p3";
                  return (
                    <th
                      key={p.slug}
                      scope="col"
                      className={cx(
                        "matrix-col",
                        `matrix-head-${p.colorVar}`,
                        stateCls,
                        "px-4 py-5 align-top lg:px-6 lg:py-6",
                      )}
                      style={{ borderLeft: "1px solid rgb(15 23 42 / 0.16)", width: `${(programs.length > 3 ? 80 : 76.5) / programs.length}%` }}
                    >
                      {/* Lencana "Cocok" selalu memakai tempatnya (hanya disembunyikan), supaya tinggi kepala kolom
                          dan posisi tabel tidak berubah saat jenjang dipilih. */}
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className="inline-flex items-center rounded-full px-3 py-0.5 text-sm font-extrabold shadow-kartu"
                          style={
                            isDarkBlock
                              ? { backgroundColor: "var(--k-lime)", color: "var(--k-obsidian)" }
                              : { backgroundColor: "var(--k-white)", color: "var(--k-ink)" }
                          }
                        >
                          {p.jenjangLabel}
                        </span>
                        <span
                          aria-hidden={!(selectedGrade !== "all" && match)}
                          className={cx(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-sm font-extrabold",
                            !(selectedGrade !== "all" && match) && "invisible",
                          )}
                          style={
                            isDarkBlock
                              ? { backgroundColor: "var(--k-white)", color: "var(--k-royal)" }
                              : { backgroundColor: "var(--k-ink)", color: "var(--k-lime)" }
                          }
                        >
                          <Check aria-hidden className="size-4" />Cocok
                        </span>
                      </div>

                      <p className="mt-3.5 font-display text-17 leading-snug font-extrabold lg:text-lg">
                        {p.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="font-display text-xl font-extrabold tabular-nums lg:text-2xl">
                          {p.price}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: `var(--mp-${p.colorVar}-block-muted)` }}>
                          / {p.sessionCount} sesi
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="matrix-row">
                  <th
                    scope="row"
                    className={cx(row.align, "px-4 py-4 text-sm font-semibold text-text-muted lg:px-6")}
                    style={{ backgroundColor: "var(--mp-surface)" }}
                  >
                    {row.label}
                  </th>
                  {programs.map((p) => {
                    const match = cocokJenjang(p, selectedGrade);
                    const stateCls = selectedGrade === "all" || match ? "" : "is-dimmed";
                    return (
                      <td
                        key={`${row.label}-${p.slug}`}
                        className={cx(
                          "matrix-col",
                          `matrix-lane-${p.colorVar}`,
                          stateCls,
                          row.align,
                          "px-4 py-4 text-sm lg:px-6",
                        )}
                      >
                        {row.render(p)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="matrix-cta-row">
                <th
                  scope="row"
                  className="px-4 py-5 align-middle text-sm font-semibold text-text-muted lg:px-6"
                  style={{ backgroundColor: "var(--mp-surface)" }}
                >
                  Pilih jadwal kelas
                </th>
                {programs.map((p) => {
                  const match = cocokJenjang(p, selectedGrade);
                  const stateCls = selectedGrade === "all" || match ? "" : "is-dimmed";
                  return (
                    <td
                      key={`cta-${p.slug}`}
                      className={cx(
                        "matrix-col",
                        `matrix-lane-${p.colorVar}`,
                        stateCls,
                        "px-4 py-5 align-middle lg:px-6",
                      )}
                    >
                      <Link
                        href={`/kelas?program=${p.slug}`}
                        className="matrix-cta-block inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-full py-2 pr-2 pl-4 font-display text-sm font-extrabold shadow-kartu lg:pl-5"
                        style={{
                          backgroundColor: `var(--mp-${p.colorVar}-cta-bg)`,
                          color: `var(--mp-${p.colorVar}-cta-fg)`,
                        }}
                      >
                        <span>
                          Lihat jadwal<span className="sr-only"> {p.name}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="grid size-7 shrink-0 place-items-center rounded-full"
                          style={{
                            backgroundColor: `var(--mp-${p.colorVar}-cta-arrow-bg)`,
                            color: `var(--mp-${p.colorVar}-cta-arrow-fg)`,
                          }}
                        >
                          <ArrowRight className="size-3.5" />
                        </span>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAMPILAN MOBILE: Segmented Switcher + Kartu Color-Block */}
      <div className="mt-5 md:hidden">
        <div
          role="group"
          aria-label="Pilih program yang dibandingkan"
          className={cx("grid gap-1.5 rounded-2xl border p-1", programs.length > 3 ? "grid-cols-2" : "grid-cols-3")}
          style={{
            backgroundColor: "var(--mp-surface-sunken)",
            borderColor: "var(--mp-border)",
          }}
        >
          {programs.map((p, idx) => {
            const active = safeIdx === idx;
            return (
              <button
                key={p.slug}
                type="button"
                aria-pressed={active}
                onClick={() => setMobileProgramIdx(idx)}
                className="min-h-[44px] rounded-xl px-2 py-2 font-display text-sm leading-tight font-bold transition-all"
                style={
                  active
                    ? {
                        backgroundColor: `var(--mp-${p.colorVar}-block-bg)`,
                        color: `var(--mp-${p.colorVar}-block-fg)`,
                      }
                    : { color: "var(--k-text-muted)" }
                }
              >
                {p.shortName}
              </button>
            );
          })}
        </div>

        <div className="matrix-panel mt-3 overflow-hidden rounded-[22px]">
          <div className={`matrix-head-${mobileProg.colorVar} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="inline-flex rounded-full px-3 py-0.5 text-sm font-extrabold"
                  style={
                    isMobileDarkHead
                      ? { backgroundColor: "var(--k-lime)", color: "var(--k-obsidian)" }
                      : { backgroundColor: "var(--k-white)", color: "var(--k-ink)" }
                  }
                >
                  {mobileProg.jenjangLabel}
                </span>
                <h3 className="mt-2.5 font-display text-lg font-extrabold">{mobileProg.name}</h3>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-lg font-extrabold tabular-nums">{mobileProg.price}</p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: `var(--mp-${mobileProg.colorVar}-block-muted)` }}
                >
                  {mobileProg.perSesi}
                </p>
              </div>
            </div>
          </div>

          <div className={`matrix-lane-${mobileProg.colorVar} p-5`} style={{ borderLeft: "none" }}>
            <dl className="divide-y text-sm" style={{ borderColor: "var(--mp-border)" }}>
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 py-3 first:pt-0"
                  style={{ borderColor: "var(--mp-border)" }}
                >
                  <dt className="text-sm font-semibold text-text-muted">{row.label}</dt>
                  <dd>{row.render(mobileProg)}</dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/kelas?program=${mobileProg.slug}`}
              className="matrix-cta-block mt-4 flex min-h-[48px] w-full items-center justify-between rounded-full py-2.5 pr-2.5 pl-5 font-display text-sm font-extrabold shadow-kartu"
              style={{
                backgroundColor: `var(--mp-${mobileProg.colorVar}-cta-bg)`,
                color: `var(--mp-${mobileProg.colorVar}-cta-fg)`,
              }}
            >
              <span>Lihat jadwal {mobileProg.shortName}</span>
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full"
                style={{
                  backgroundColor: `var(--mp-${mobileProg.colorVar}-cta-arrow-bg)`,
                  color: `var(--mp-${mobileProg.colorVar}-cta-arrow-fg)`,
                }}
              >
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Banner Bantuan Tes Minat */}
      <div className="kodie-blue-banner mt-6 flex flex-col items-start justify-between gap-4 rounded-[22px] p-5 text-white shadow-kartu sm:flex-row sm:items-center md:px-7 md:py-6">
        <div>
          <p className="font-display text-base font-extrabold md:text-lg">
            Masih ragu memilih antara Kelas Reguler atau Simulasi Jurusan IT?
          </p>
          <p className="mt-1 text-sm text-blue-100/90 sm:text-sm">
            Coba Tes Minat Jurusan IT (12 soal, gratis, tanpa akun) untuk dapat rekomendasi program otomatis.
          </p>
        </div>
        <Link
          href="/tes-minat"
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-lime px-5 py-2.5 font-display text-sm font-extrabold text-obsidian shadow-kartu transition-transform hover:brightness-105 active:scale-95 sm:text-sm"
        >
          <span>Coba tes minat gratis</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
