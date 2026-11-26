import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";

const KONTROL =
  "min-h-control w-full rounded-md border-[1.5px] border-border-strong bg-surface px-4 text-base text-text placeholder:text-text-muted aria-[invalid=true]:border-danger";

type Label = { label: string; galat?: string; petunjuk?: string };

export function Input({ id, label, galat, petunjuk, className, ...props }: Label & ComponentProps<"input"> & { id: string }) {
  const keterangan = [petunjuk && `${id}-petunjuk`, galat && `${id}-galat`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <input id={id} aria-invalid={galat ? true : undefined} aria-describedby={keterangan} className={KONTROL} {...props} />
      {petunjuk ? (
        <p id={`${id}-petunjuk`} className="text-sm text-text-muted">
          {petunjuk}
        </p>
      ) : null}
      {galat ? (
        <p id={`${id}-galat`} className="text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

export function Textarea({
  id,
  label,
  galat,
  petunjuk,
  maksKarakter,
  panjangSaatIni,
  className,
  ...props
}: Label &
  ComponentProps<"textarea"> & {
    id: string;
    maksKarakter?: number;
    panjangSaatIni?: number;
  }) {
  const keterangan = [petunjuk && `${id}-petunjuk`, galat && `${id}-galat`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={galat ? true : undefined}
        aria-describedby={keterangan}
        className={cx(KONTROL, "min-h-[120px] py-3 leading-[27px]")}
        {...props}
      />
      {petunjuk || maksKarakter !== undefined ? (
        <div className="flex items-center justify-between gap-2 text-sm text-text-muted">
          <p id={`${id}-petunjuk`} className="min-w-0 flex-1">
            {petunjuk ?? ""}
          </p>
          {maksKarakter !== undefined ? (
            <p className="shrink-0 tabular-nums" aria-hidden>
              {panjangSaatIni ?? 0}/{maksKarakter}
            </p>
          ) : null}
        </div>
      ) : null}
      {galat ? (
        <p id={`${id}-galat`} className="text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

export function Pilihan({
  id,
  label,
  galat,
  petunjuk,
  className,
  children,
  ...props
}: Label & ComponentProps<"select"> & { id: string }) {
  const keterangan = [petunjuk && `${id}-petunjuk`, galat && `${id}-galat`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={galat ? true : undefined}
          aria-describedby={keterangan}
          className={cx(KONTROL, "pilihan-kodie appearance-none pr-11")}
          {...props}
        >
          {children}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2" />
      </div>
      {petunjuk ? (
        <p id={`${id}-petunjuk`} className="text-sm text-text-muted">
          {petunjuk}
        </p>
      ) : null}
      {galat ? (
        <p id={`${id}-galat`} className="text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}
