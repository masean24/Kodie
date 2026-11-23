import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cx } from "@/lib/cx";

/** Kartu bergradasi tipis untuk halaman masuk dan daftar (Figma "4. Daftar"). */
export function KartuAuth({ children, lebar = "max-w-[560px]" }: { children: ReactNode; lebar?: string }) {
  return (
    <div className={cx("mx-auto w-full rounded-card bg-gradient-to-b from-primary-subtle to-surface-sunken p-5 md:p-10", lebar)}>
      {children}
    </div>
  );
}

export function Langkah({ ke, dari, label }: { ke: number; dari: number; label: string }) {
  return (
    <div>
      <p className="text-sm">
        <span className="font-bold text-primary">
          Langkah {ke} dari {dari}
        </span>{" "}
        · {label}
      </p>
      <div aria-hidden className="mt-2 flex gap-1">
        {Array.from({ length: dari }, (_, i) => (
          <span key={i} className={cx("h-2 flex-1 rounded-full", i < ke ? "bg-primary" : "bg-surface ring-1 ring-primary")} />
        ))}
      </div>
    </div>
  );
}

/** Kelompok isian dalam kartu putih: Akun, Sekolah, Orang tua, … */
export function Kelompok({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-card-sm bg-surface p-5">
      <legend className="float-left mb-1 w-full font-display text-lg font-semibold">{judul}</legend>
      {children}
    </fieldset>
  );
}

export function PesanFormulir({ galat, info }: { galat?: string; info?: string }) {
  if (galat) {
    return (
      <p role="alert" className="flex gap-2 rounded-card-sm bg-danger-subtle p-4 font-bold text-danger">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
        {galat}
      </p>
    );
  }
  if (info) {
    return (
      <p role="status" className="flex gap-2 rounded-card-sm bg-success-subtle p-4 font-bold text-success">
        <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0" />
        {info}
      </p>
    );
  }
  return null;
}

/** Setelah validasi gagal, fokus ke isian bergalat pertama menurut urutan tampilan. */
export function fokusGalatPertama() {
  // Tunggu React menulis aria-invalid; lewati salinan rute lama yang disembunyikan Next.js.
  setTimeout(() => {
    const isian = [...document.querySelectorAll<HTMLElement>('main form [aria-invalid="true"]')].find((el) =>
      el.checkVisibility(),
    );
    isian?.focus();
  }, 50);
}
