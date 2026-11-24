import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cx } from "@/lib/cx";

/** `khusus`: tanpa warna bawaan; warna diberikan lewat `className` (cx tidak menggabungkan kelas yang bentrok). */
type Varian = "utama" | "kedua" | "ajakan" | "terang" | "bahaya" | "tautan" | "khusus";
type Ukuran = "md" | "lg";

const DASAR =
  "inline-flex min-h-touch items-center justify-center gap-2 rounded-full font-display font-semibold transition-colors disabled:cursor-not-allowed aria-disabled:cursor-not-allowed";

const VARIAN: Record<Varian, string> = {
  utama:
    "bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-disabled disabled:text-text-muted aria-disabled:bg-disabled aria-disabled:text-text-muted",
  kedua: "border-[1.5px] border-border-strong bg-surface text-text hover:bg-surface-sunken",
  ajakan: "bg-cta text-cta-foreground hover:bg-cta-hover",
  terang: "bg-white text-[#0f172a] hover:bg-primary-subtle",
  bahaya: "bg-danger text-danger-foreground hover:bg-danger-hover",
  tautan: "min-h-touch px-0 text-primary underline-offset-4 hover:underline",
  khusus: "",
};

const UKURAN: Record<Ukuran, string> = {
  md: "px-5 text-base",
  lg: "min-h-control px-6 text-base",
};

export function kelasTombol(varian: Varian = "utama", ukuran: Ukuran = "md", tambahan?: string) {
  return cx(DASAR, VARIAN[varian], varian === "tautan" ? "" : UKURAN[ukuran], tambahan);
}

type Umum = {
  varian?: Varian;
  ukuran?: Ukuran;
  panah?: boolean;
  /** Ganti warna lingkaran panah (misalnya tombol berwarna khusus per program). */
  kelasPanah?: string;
  children: ReactNode;
};

function Isi({ panah, varian, kelasPanah, children }: { panah?: boolean; varian: Varian; kelasPanah?: string; children: ReactNode }) {
  return (
    <>
      {children}
      {panah ? (
        <span
          aria-hidden
          className={cx(
            "-mr-2 grid size-8 place-items-center rounded-full",
            kelasPanah ?? (varian === "ajakan" ? "bg-[#0f172a] text-cta" : "bg-black/10"),
          )}
        >
          <ArrowRight className="size-4" />
        </span>
      ) : null}
    </>
  );
}

export function Tombol({
  varian = "utama",
  ukuran = "md",
  panah,
  kelasPanah,
  className,
  children,
  type = "button",
  ...props
}: Umum & ComponentProps<"button">) {
  return (
    <button type={type} className={kelasTombol(varian, ukuran, className)} {...props}>
      <Isi panah={panah} varian={varian} kelasPanah={kelasPanah}>
        {children}
      </Isi>
    </button>
  );
}

export function TombolTautan({
  varian = "utama",
  ukuran = "md",
  panah,
  kelasPanah,
  className,
  children,
  ...props
}: Umum & ComponentProps<typeof Link>) {
  return (
    <Link className={kelasTombol(varian, ukuran, className)} {...props}>
      <Isi panah={panah} varian={varian} kelasPanah={kelasPanah}>
        {children}
      </Isi>
    </Link>
  );
}
