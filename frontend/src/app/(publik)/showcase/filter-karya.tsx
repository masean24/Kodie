"use client";

import { useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";

const PILIHAN = [
  { nilai: "semua", label: "Semua" },
  { nilai: "SD", label: "SD" },
  { nilai: "SMP–SMA", label: "SMP–SMA" },
] as const;

type Nilai = (typeof PILIHAN)[number]["nilai"];

/** Karya cocok dengan filter bila label jenjangnya menyebut jenjang itu (misalnya "SD–SMP" cocok untuk SD dan SMP–SMA). */
function cocok(jenjang: string, f: Nilai) {
  if (f === "semua") return true;
  if (f === "SD") return jenjang.includes("SD");
  return jenjang.includes("SMP") || jenjang.includes("SMA");
}

/** Pill filter jenjang untuk daftar karya Showcase. Kartu dirender server dan diteruskan sebagai `isi`. */
export function FilterKarya({ karya }: { karya: { kunci: string; jenjang: string; isi: ReactNode }[] }) {
  const [filter, setFilter] = useState<Nilai>("semua");
  const tampil = karya.filter((k) => cocok(k.jenjang, filter));

  return (
    <>
      <div role="group" aria-label="Saring karya per jenjang" className="mb-6 flex flex-wrap gap-2">
        {PILIHAN.map((p) => (
          <button
            key={p.nilai}
            type="button"
            aria-pressed={filter === p.nilai}
            onClick={() => setFilter(p.nilai)}
            className={cx(
              "min-h-touch rounded-full px-5 font-display font-semibold transition-colors",
              filter === p.nilai ? "bg-primary text-primary-foreground" : "border-[1.5px] border-border-strong bg-surface text-text hover:bg-surface-sunken",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {tampil.length} karya ditampilkan
      </p>
      <ul className="grid gap-6 md:grid-cols-2">
        {tampil.map((k) => (
          <li key={k.kunci} className="flex min-w-0">
            {k.isi}
          </li>
        ))}
      </ul>
    </>
  );
}
