import type { Program } from "@/types/database";
import { labelJenjang, warnaProgram } from "@/components/kategori";
import { TombolTautan } from "@/components/ui/tombol";
import { cx } from "@/lib/cx";
import { GambarProgram } from "./gambar-program";

export function kalimatPertama(teks: string) {
  const i = teks.indexOf(". ");
  return i === -1 ? teks : teks.slice(0, i + 1);
}

export function KartuProgram({ p }: { p: Program }) {
  const w = warnaProgram(p.slug);
  return (
    <article className={cx("flex flex-col gap-4 rounded-card-sm bg-gradient-to-b p-5 text-on-block", w.blok)}>
      <GambarProgram slug={p.slug} />
      <div>
        <span className="inline-flex rounded-full bg-surface px-3 py-0.5 text-sm font-bold text-text">
          {labelJenjang(p.jenjang, p.kelas_min, p.kelas_maks)}
        </span>
      </div>
      <h3 className="text-2xl font-bold">{p.nama}</h3>
      <p>{kalimatPertama(p.deskripsi)}</p>
      <ul className="flex flex-wrap gap-2 text-sm font-bold">
        <li className="rounded-full bg-surface px-3 py-0.5 text-text">{p.durasi_menit} menit</li>
        <li className="rounded-full bg-surface px-3 py-0.5 text-text">{p.jumlah_sesi} sesi</li>
      </ul>
      <TombolTautan href={`/program/${p.slug}`} varian="ajakan" panah className="mt-auto justify-between">
        Lihat program<span className="sr-only"> {p.nama}</span>
      </TombolTautan>
    </article>
  );
}
