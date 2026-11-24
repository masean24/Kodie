"use client";

import { useState, type ChangeEvent, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cx } from "@/lib/cx";
import { nilaiPassword, type TingkatPassword } from "@/lib/validasi/password";

const KONTROL =
  "min-h-control w-full rounded-md border-[1.5px] border-border-strong bg-surface pl-4 pr-14 text-base text-text placeholder:text-text-muted aria-[invalid=true]:border-danger";

const GAYA_TINGKAT: Record<Exclude<TingkatPassword, "kosong">, { isi: number; warna: string; label: string; teks: string }> = {
  pendek: { isi: 1, warna: "bg-danger", label: "Terlalu pendek", teks: "text-danger" },
  lemah: { isi: 1, warna: "bg-danger", label: "Mudah ditebak", teks: "text-danger" },
  sedang: { isi: 2, warna: "bg-warning", label: "Cukup", teks: "text-text" },
  kuat: { isi: 3, warna: "bg-success", label: "Kuat", teks: "text-text" },
};

/**
 * Input password dengan tombol tampilkan/sembunyikan. Dengan `kekuatan`, di bawahnya muncul indikator
 * yang langsung memberi tahu bila password terlalu pendek atau mudah ditebak (aturan `lib/validasi/password`).
 */
export function InputPassword({
  id,
  label,
  galat,
  petunjuk,
  kekuatan = false,
  className,
  onChange,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  id: string;
  label: string;
  galat?: string;
  petunjuk?: string;
  kekuatan?: boolean;
}) {
  const [tampil, setTampil] = useState(false);
  const [nilai, setNilai] = useState("");
  const hasil = kekuatan ? nilaiPassword(nilai) : null;
  const gaya = hasil && hasil.tingkat !== "kosong" ? GAYA_TINGKAT[hasil.tingkat] : null;
  const keterangan =
    [petunjuk && `${id}-petunjuk`, kekuatan && `${id}-kekuatan`, galat && `${id}-galat`].filter(Boolean).join(" ") ||
    undefined;

  const ubah = (e: ChangeEvent<HTMLInputElement>) => {
    if (kekuatan) setNilai(e.target.value);
    onChange?.(e);
  };

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={tampil ? "text" : "password"}
          aria-invalid={galat ? true : undefined}
          aria-describedby={keterangan}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={KONTROL}
          onChange={ubah}
          {...props}
        />
        <button
          type="button"
          onClick={() => setTampil((v) => !v)}
          aria-label={tampil ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`}
          aria-pressed={tampil}
          aria-controls={id}
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-sunken hover:text-text"
        >
          {tampil ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
        </button>
      </div>
      {petunjuk ? (
        <p id={`${id}-petunjuk`} className="text-sm text-text-muted">
          {petunjuk}
        </p>
      ) : null}
      {kekuatan && hasil ? (
        <div id={`${id}-kekuatan`} aria-live="polite" className="flex flex-col gap-1.5">
          <div aria-hidden className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((i) => (
              <span key={i} className={cx("h-1.5 rounded-full", gaya && i <= gaya.isi ? gaya.warna : "bg-neutral-subtle")} />
            ))}
          </div>
          <p className={cx("text-sm", gaya ? gaya.teks : "text-text-muted")}>
            {gaya ? <span className="font-bold">{gaya.label}. </span> : null}
            {hasil.pesan}
          </p>
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
