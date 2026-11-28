import { inisialNama } from "@/lib/nama";
import { cx } from "@/lib/cx";

/**
 * Warna tetap per anak (dari id), supaya orang tua dengan lebih dari satu anak langsung tahu jadwal milik siapa
 * (saran pembimbing 2026-11-28). Semua kombinasi teks/latar memenuhi kontras 4,5:1.
 */
const WARNA = [
  "bg-lime text-ink",
  "bg-royal text-white",
  "bg-ink text-lime",
  "bg-sky-soft text-ink",
] as const;

function indeksWarna(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % WARNA.length;
}

/** Penanda nama anak yang menonjol: inisial dalam lingkaran + nama tebal, berwarna khas per anak. */
export function ChipAnak({ id, nama, className }: { id: string; nama: string; className?: string }) {
  const warna = WARNA[indeksWarna(id)];
  return (
    <span className={cx("inline-flex max-w-full items-center gap-2 rounded-full py-1 pl-1 pr-3 font-display text-sm font-bold", warna, className)}>
      <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-white/90 text-xs text-ink">
        {inisialNama(nama)}
      </span>
      <span className="truncate">
        <span className="sr-only">Untuk </span>
        {nama}
      </span>
    </span>
  );
}
