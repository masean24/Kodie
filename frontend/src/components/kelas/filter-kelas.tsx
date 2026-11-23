"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pilihan } from "@/components/ui/formulir";
import { RENTANG_JAM, type FilterKelas as Filter } from "@/lib/kelas";
import { namaHari } from "@/lib/format";

/** Filter katalog. Nilai disimpan di URL, jadi bisa dibagikan dan dipakai tombol kembali. */
export function FilterKelas({ program, nilai }: { program: { slug: string; nama: string }[]; nilai: Filter }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menunggu, mulai] = useTransition();

  function ubah(form: HTMLFormElement) {
    const data = new FormData(form);
    const q = new URLSearchParams();
    for (const [k, v] of data) if (typeof v === "string" && v) q.set(k, v);
    const s = q.toString();
    mulai(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  }

  return (
    <form
      action={pathname}
      method="get"
      aria-labelledby="judul-filter"
      aria-busy={menunggu}
      onChange={(e) => ubah(e.currentTarget)}
      onSubmit={(e) => {
        e.preventDefault();
        ubah(e.currentTarget);
      }}
      className="flex flex-col gap-4 rounded-card-sm bg-surface p-6"
    >
      <h2 id="judul-filter" className="text-xl font-semibold">
        Saring kelas
      </h2>
      <Pilihan id="f-program" name="program" label="Program" defaultValue={nilai.program ?? ""}>
        <option value="">Semua program</option>
        {program.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.nama}
          </option>
        ))}
      </Pilihan>
      <Pilihan id="f-jenjang" name="jenjang" label="Jenjang" defaultValue={nilai.jenjang ?? ""}>
        <option value="">Semua jenjang</option>
        <option value="SD">SD</option>
        <option value="SMP">SMP</option>
        <option value="SMA">SMA</option>
      </Pilihan>
      <Pilihan id="f-hari" name="hari" label="Hari" defaultValue={nilai.hari ? String(nilai.hari) : ""}>
        <option value="">Semua hari</option>
        {[1, 2, 3, 4, 5, 6, 7].map((h) => (
          <option key={h} value={h}>
            {namaHari(h)}
          </option>
        ))}
      </Pilihan>
      <Pilihan id="f-jam" name="jam" label="Jam" defaultValue={nilai.jam ?? ""}>
        <option value="">Semua jam</option>
        {Object.entries(RENTANG_JAM).map(([k, r]) => (
          <option key={k} value={k}>
            {r.label}
          </option>
        ))}
      </Pilihan>
      <noscript>
        <button type="submit" className="min-h-touch w-full rounded-full bg-primary px-5 font-display font-semibold text-primary-foreground">
          Terapkan
        </button>
      </noscript>
      <Link href={pathname} scroll={false} className="flex min-h-touch items-center justify-center font-display font-semibold text-primary hover:underline">
        Hapus semua filter
      </Link>
    </form>
  );
}
