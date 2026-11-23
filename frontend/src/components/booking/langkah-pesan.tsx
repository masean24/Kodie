import { Check } from "lucide-react";
import { cx } from "@/lib/cx";

const LANGKAH = ["Pilih siswa", "Periksa pesanan", "Bayar"];

/** Indikator 3 langkah pemesanan (Figma 6). Langkah selesai ditandai lime tipis dan ikon centang. */
export function LangkahPesan({ ke }: { ke: 1 | 2 | 3 }) {
  return (
    <div>
      <p className="text-sm">
        <span className="font-bold text-primary">Langkah {ke} dari 3</span> · {LANGKAH[ke - 1]}
      </p>
      <ol aria-label="Langkah pemesanan" className="mt-2 grid grid-cols-3 gap-1 text-xs sm:text-sm">
        {LANGKAH.map((l, i) => {
          const selesai = i + 1 < ke;
          const aktif = i + 1 === ke;
          return (
            <li
              key={l}
              aria-current={aktif ? "step" : undefined}
              className={cx(
                "flex min-h-9 items-center gap-1.5 rounded-md px-2",
                selesai && "bg-accent-subtle",
                aktif && "bg-primary-subtle font-bold text-primary ring-[1.5px] ring-primary",
                !selesai && !aktif && "bg-neutral-subtle text-text-muted",
              )}
            >
              {selesai ? <Check aria-hidden className="size-4 shrink-0" /> : null}
              <span className="truncate">{l}</span>
              {selesai ? <span className="sr-only">(selesai)</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
