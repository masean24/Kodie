import type { ComponentProps, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, SearchX } from "lucide-react";
import { cx } from "@/lib/cx";

/** Kontainer 1200 px: margin 16 di 360, padding 120 di 1440 (Tata letak v3). */
export function Kontainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-[1232px] px-4 md:px-8", className)} {...props} />;
}

export function Kartu({
  className,
  kecil,
  ...props
}: ComponentProps<"div"> & { kecil?: boolean }) {
  return (
    <div
      className={cx("bg-surface p-5 md:p-6", kecil ? "rounded-card-sm" : "rounded-card", className)}
      {...props}
    />
  );
}

type NadaLencana = "netral" | "info" | "sukses" | "peringatan" | "bahaya" | "aksen";

const NADA: Record<NadaLencana, string> = {
  netral: "bg-neutral-subtle text-text",
  info: "bg-info-subtle text-info",
  sukses: "bg-success-subtle text-success",
  peringatan: "bg-warning-subtle text-warning",
  bahaya: "bg-danger-subtle text-danger",
  aksen: "bg-accent text-on-accent",
};

export function Lencana({
  nada = "netral",
  className,
  ...props
}: ComponentProps<"span"> & { nada?: NadaLencana }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-bold leading-6",
        NADA[nada],
        className,
      )}
      {...props}
    />
  );
}

/** Sorotan kata di judul: pill biru di latar terang, pill lime di blok merek. */
export function Sorotan({ diBlok, children }: { diBlok?: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-block rounded-full px-[0.38em] py-[0.04em] leading-[1.18] align-baseline [box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
        diBlok ? "bg-highlight-on-block-bg text-highlight-on-block-fg" : "bg-highlight-bg text-highlight-fg",
      )}
    >
      {children}
    </span>
  );
}

export function Kerangka({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-card-sm bg-neutral-subtle", className)} />;
}

export function StatusMemuat({ label = "Memuat data…" }: { label?: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}

export function StateKosong({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-12 text-center">
      <SearchX aria-hidden className="size-10 text-text-muted" />
      <h2 className="text-xl font-bold">{judul}</h2>
      {keterangan ? <p className="max-w-prose text-text-muted">{keterangan}</p> : null}
      {aksi}
    </div>
  );
}

export function StateError({
  judul = "Data belum bisa dimuat",
  keterangan = "Periksa koneksi internet Anda, lalu coba lagi.",
  aksi,
}: {
  judul?: string;
  keterangan?: string;
  aksi?: ReactNode;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-danger-subtle px-6 py-12 text-center">
      <AlertTriangle aria-hidden className="size-10 text-danger" />
      <h2 className="text-xl font-bold">{judul}</h2>
      <p className="max-w-prose">{keterangan}</p>
      {aksi}
    </div>
  );
}

export function Catatan({
  nada = "info",
  judul,
  children,
}: {
  nada?: "info" | "sukses" | "peringatan";
  judul: string;
  children?: ReactNode;
}) {
  const Ikon = nada === "sukses" ? CheckCircle2 : nada === "peringatan" ? AlertTriangle : Info;
  const warna =
    nada === "sukses"
      ? "bg-success-subtle [&_.judul]:text-success"
      : nada === "peringatan"
        ? "bg-warning-subtle [&_.judul]:text-warning"
        : "bg-info-subtle [&_.judul]:text-info";
  return (
    <div className={cx("flex gap-3 rounded-card-sm p-5", warna)}>
      <Ikon aria-hidden className="judul mt-0.5 size-5 shrink-0" />
      <div>
        <p className="judul font-display font-semibold">{judul}</p>
        {children ? <div className="mt-1">{children}</div> : null}
      </div>
    </div>
  );
}
