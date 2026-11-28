import { ChartNoAxesColumn, Code, Cpu, Wifi, type LucideIcon } from "lucide-react";
import type { Bidang, Jenjang } from "@/types/database";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { cx } from "@/lib/cx";

/** Warna program punya arti tetap (docs/KEPUTUSAN.md). Teks di atas warna kuat selalu tinta. */
export const WARNA_PROGRAM: Record<string, { tag: string; blok: string; deep: string }> = {
  "kenal-komputer": {
    tag: "bg-kenal-komputer-strong text-ink",
    blok: "from-kenal-komputer-block to-kenal-komputer-block-to",
    deep: "text-kenal-komputer-deep",
  },
  "coding-dasar": {
    tag: "bg-coding-dasar-strong text-on-strong",
    blok: "from-coding-dasar-block to-coding-dasar-block-to",
    deep: "text-coding-dasar-deep",
  },
  "kelas-reguler-teknologi": {
    tag: "bg-kelas-reguler-strong text-on-strong",
    blok: "from-kelas-reguler-block to-kelas-reguler-block-to",
    deep: "text-kelas-reguler-deep",
  },
  "simulasi-jurusan-it": {
    tag: "bg-simulasi-jurusan-strong text-on-strong",
    blok: "from-simulasi-jurusan-block to-simulasi-jurusan-block-to",
    deep: "text-simulasi-jurusan-deep",
  },
};

const WARNA_PROGRAM_CADANGAN = WARNA_PROGRAM["kelas-reguler-teknologi"];

export function warnaProgram(slug: string) {
  return WARNA_PROGRAM[slug] ?? WARNA_PROGRAM_CADANGAN;
}

export function TagProgram({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <span className={cx("inline-flex rounded-full px-3 py-0.5 text-sm font-bold leading-6", warnaProgram(slug).tag)}>
      {children}
    </span>
  );
}

const WARNA_BIDANG: Record<Bidang, string> = {
  software: "bg-software-strong",
  jaringan: "bg-jaringan-strong",
  iot: "bg-iot-strong",
  ai_data: "bg-ai-data-strong",
};

export const WARNA_BATANG_BIDANG = WARNA_BIDANG;

export function TagBidang({ bidang }: { bidang: Bidang }) {
  return (
    <span className={cx("inline-flex rounded-full px-3 py-0.5 text-sm font-bold leading-6 text-on-strong", WARNA_BIDANG[bidang])}>
      {NAMA_BIDANG[bidang]}
    </span>
  );
}

export function labelJenjang(jenjang: Jenjang[], kelasMin?: number, kelasMaks?: number): string {
  if (jenjang.includes("TK")) {
    return jenjang.includes("SD") && kelasMaks ? `Usia 5–7 · TK B–SD kelas ${romawi(kelasMaks)}` : "Usia 5–6 · TK B";
  }
  if (jenjang.length === 1 && jenjang[0] === "SD") {
    return kelasMin && kelasMaks ? `SD kelas ${romawi(kelasMin)}–${romawi(kelasMaks)}` : "SD";
  }
  if (kelasMin === 9) return "SMP kelas 9 dan SMA";
  return jenjang.join(" dan ");
}

function romawi(n: number): string {
  return ["", "I", "II", "III", "IV", "V", "VI"][n] ?? String(n);
}

/** Ubin 3D vektor (komponen Figma ObjekBidang). Dekoratif. */
const UBIN: Record<Bidang, { ikon: LucideIcon; muka: string; sisi: string; ikonWarna: string }> = {
  software: { ikon: Code, muka: "from-sky-soft to-sky", sisi: "#1e3a8a", ikonWarna: "text-ink" },
  jaringan: { ikon: Wifi, muka: "from-sky to-royal-bright", sisi: "#172554", ikonWarna: "text-ink" },
  iot: { ikon: Cpu, muka: "from-lime-pale to-lime", sisi: "#0f172a", ikonWarna: "text-ink" },
  ai_data: { ikon: ChartNoAxesColumn, muka: "from-snow to-mist", sisi: "#334155", ikonWarna: "text-ink" },
};

export function ObjekBidang({
  bidang,
  ukuran = 120,
  miring = 0,
  className,
}: {
  bidang: Bidang;
  ukuran?: number;
  miring?: number;
  className?: string;
}) {
  const u = UBIN[bidang];
  const Ikon = u.ikon;
  return (
    <div
      aria-hidden
      className={cx(className?.includes("absolute") ? "" : "relative", "shrink-0", className)}
      style={{ width: ukuran, height: ukuran, transform: `rotate(${miring}deg)` }}
    >
      <div
        className={cx("absolute inset-0 grid place-items-center rounded-[26%] bg-gradient-to-br", u.muka)}
        style={{
          boxShadow: `0 ${ukuran * 0.07}px 0 ${u.sisi}, 0 ${ukuran * 0.14}px ${ukuran * 0.18}px rgb(15 23 42 / 0.28)`,
        }}
      >
        <span
          className="absolute left-[14%] top-[8%] h-[20%] w-[46%] -rotate-12 rounded-[50%] bg-white/45"
          style={{ filter: "blur(0.5px)" }}
        />
        <Ikon className={u.ikonWarna} style={{ width: ukuran * 0.42, height: ukuran * 0.42 }} strokeWidth={2.4} />
      </div>
    </div>
  );
}
