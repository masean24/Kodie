import { Star } from "lucide-react";
import { cx } from "@/lib/cx";

const UKURAN = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

/** Satu ikon bintang. `terisi` = kuning; kosong = garis abu-abu. Dekoratif: nilai angkanya wajib ditulis di dekatnya. */
export function Bintang({ terisi = true, ukuran = "md", className }: { terisi?: boolean; ukuran?: keyof typeof UKURAN; className?: string }) {
  return (
    <Star
      aria-hidden
      className={cx(UKURAN[ukuran], terisi ? "fill-bintang text-bintang-garis" : "text-border-strong", className)}
    />
  );
}

/** Deret 5 bintang untuk nilai 1–5, dengan label aksesibel "N dari 5 bintang". */
export function DeretBintang({ nilai, ukuran = "md", className }: { nilai: number; ukuran?: keyof typeof UKURAN; className?: string }) {
  const bulat = Math.round(nilai);
  return (
    <span role="img" aria-label={`${nilai.toLocaleString("id-ID", { maximumFractionDigits: 1 })} dari 5 bintang`} className={cx("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Bintang key={n} terisi={n <= bulat} ukuran={ukuran} />
      ))}
    </span>
  );
}
