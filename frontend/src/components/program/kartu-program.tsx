import type { Program } from "@/types/database";
import { labelJenjang, warnaProgram } from "@/components/kategori";
import { TombolTautan } from "@/components/ui/tombol";
import { cx } from "@/lib/cx";
import { GambarProgram } from "./gambar-program";

export function kalimatPertama(teks: string) {
  const i = teks.indexOf(". ");
  return i === -1 ? teks : teks.slice(0, i + 1);
}

export function KartuProgram({ p, judulTag = "h3" }: { p: Program; judulTag?: "h2" | "h3" }) {
  const w = warnaProgram(p.slug);
  const Tag = judulTag;
  return (
    <article className={cx("flex h-full flex-col gap-4 rounded-card-sm bg-gradient-to-b p-6 text-on-block", w.blok)}>
      <GambarProgram slug={p.slug} />
      <div>
        <span className="inline-flex rounded-full bg-surface px-3 py-0.5 text-sm font-bold text-text">
          {labelJenjang(p.jenjang, p.kelas_min, p.kelas_maks)}
        </span>
      </div>
      <Tag className="text-2xl font-bold leading-snug">{p.nama}</Tag>
      <p className="leading-relaxed">{kalimatPertama(p.deskripsi)}</p>
      <div className="mt-auto flex flex-col gap-4 pt-2">
        <ul className="flex flex-wrap gap-2 text-sm font-bold">
          <li className="rounded-full bg-surface px-3 py-0.5 text-text">{p.durasi_menit} menit</li>
          <li className="rounded-full bg-surface px-3 py-0.5 text-text">{p.jumlah_sesi} sesi</li>
        </ul>
        <TombolTautan href={`/program/${p.slug}`} varian="ajakan" panah className="justify-between">
          Lihat program<span className="sr-only"> {p.nama}</span>
        </TombolTautan>
      </div>
    </article>
  );
}
