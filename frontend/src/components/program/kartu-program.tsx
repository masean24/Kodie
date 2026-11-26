import type { Program } from "@/types/database";
import { labelJenjang, warnaProgram } from "@/components/kategori";
import { TombolTautan } from "@/components/ui/tombol";
import { cx } from "@/lib/cx";
import { formatRupiah } from "@/lib/format";
import { GambarProgram } from "./gambar-program";

export function kalimatPertama(teks: string) {
  const i = teks.indexOf(". ");
  return i === -1 ? teks : teks.slice(0, i + 1);
}

/**
 * Warna tombol "Lihat program" per program: navy untuk Coding Dasar, lime (CTA) untuk Kelas Reguler,
 * dan biru untuk Simulasi Jurusan IT. Lingkaran panah memakai warna kontras masing-masing.
 */
const TOMBOL_PROGRAM: Record<string, { tombol: string; panah: string }> = {
  "coding-dasar": { tombol: "bg-ink text-white hover:bg-ink-soft", panah: "bg-royal-bright text-white" },
  "simulasi-jurusan-it": { tombol: "bg-royal text-white hover:bg-royal-hover", panah: "bg-lime text-ink" },
};

export function KartuProgram({ p, judulTag = "h3" }: { p: Program; judulTag?: "h2" | "h3" }) {
  const w = warnaProgram(p.slug);
  const Tag = judulTag;
  return (
    <article className={cx("flex h-full flex-col gap-4 rounded-card-sm bg-gradient-to-b p-6 text-on-block shadow-kartu", w.blok)}>
      <GambarProgram slug={p.slug} />
      <div>
        <span className="inline-flex rounded-full bg-white px-3 py-0.5 text-sm font-bold text-ink">
          {labelJenjang(p.jenjang, p.kelas_min, p.kelas_maks)}
        </span>
      </div>
      <Tag className="text-2xl font-bold leading-snug">{p.nama}</Tag>
      <p className="leading-relaxed">{kalimatPertama(p.deskripsi)}</p>
      <div className="mt-auto flex flex-col gap-4 pt-2">
        <p className="leading-tight">
          <span className="text-sm font-bold">Mulai</span>{" "}
          <span className="font-display text-xl font-semibold">{formatRupiah(p.harga_paket)}</span>
          <span className="text-sm"> / paket {p.jumlah_sesi} sesi</span>
        </p>
        <ul className="flex flex-wrap gap-2 text-sm font-bold">
          <li className="rounded-full bg-white px-3 py-0.5 text-ink">{p.durasi_menit} menit</li>
          <li className="rounded-full bg-white px-3 py-0.5 text-ink">{p.jumlah_sesi} sesi</li>
        </ul>
        <TombolTautan
          href={`/program/${p.slug}`}
          varian={TOMBOL_PROGRAM[p.slug] ? "khusus" : "ajakan"}
          panah
          kelasPanah={TOMBOL_PROGRAM[p.slug]?.panah}
          className={cx("justify-between", TOMBOL_PROGRAM[p.slug]?.tombol)}
        >
          Lihat program<span className="sr-only"> {p.nama}</span>
        </TombolTautan>
      </div>
    </article>
  );
}
