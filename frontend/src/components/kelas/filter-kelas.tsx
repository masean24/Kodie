"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ChevronDown, LoaderCircle, Search } from "lucide-react";
import { Pilihan } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { RENTANG_JAM, type FilterKelas as Filter } from "@/lib/kelas";
import { namaHari } from "@/lib/format";
import { cx } from "@/lib/cx";

/*
 * Di ponsel, filter selain pencarian dilipat agar daftar kelas langsung terlihat.
 * Komponen di-remount setiap filter berubah (key di halaman), jadi status buka-tutup disimpan di modul
 * supaya panel tidak menutup sendiri setelah memilih filter.
 */
let panelTerbukaTerakhir = false;

/** Filter katalog. Nilai disimpan di URL, jadi bisa dibagikan dan dipakai tombol kembali. */
export function FilterKelas({ program, nilai }: { program: { slug: string; nama: string }[]; nilai: Filter }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menunggu, mulai] = useTransition();
  const tundaCari = useRef(0);
  const [buka, setBuka] = useState(panelTerbukaTerakhir);
  // Panel sudah terlipat sejak HTML server (di ponsel), jadi hidrasi tidak menggeser daftar hasil (CLS).
  // Tanpa JavaScript, `<noscript>` di bawah membuka panel dan menyembunyikan tombol lipat.
  const jumlahAktif = [nilai.program, nilai.jenjang, nilai.hari, nilai.jam].filter(Boolean).length;

  function ubahBuka() {
    panelTerbukaTerakhir = !buka;
    setBuka(!buka);
  }

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
      onChange={(e) => {
        // Kolom cari diproses dengan jeda agar URL tidak diganti di setiap ketukan.
        if ((e.target as HTMLElement).getAttribute("name") === "cari") return;
        ubah(e.currentTarget);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        ubah(e.currentTarget);
      }}
      className="flex flex-col gap-4 rounded-card-sm bg-surface p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="judul-filter" className="text-xl font-semibold">
          Saring kelas
        </h2>
        {menunggu ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted">
            <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            Memuat…
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="f-cari" className="font-bold">
          Cari kelas
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
          <input
            id="f-cari"
            name="cari"
            type="search"
            defaultValue={nilai.cari ?? ""}
            placeholder="Program atau pengajar"
            autoComplete="off"
            maxLength={60}
            onChange={(e) => {
              const form = e.currentTarget.form;
              window.clearTimeout(tundaCari.current);
              tundaCari.current = window.setTimeout(() => form && ubah(form), 400);
            }}
            className="min-h-control w-full rounded-md border-[1.5px] border-border-strong bg-surface pl-11 pr-4 text-base text-text placeholder:text-text-muted"
          />
        </div>
      </div>
      <noscript>
        <style>{"#f-lainnya{display:flex!important}#tombol-f-lainnya{display:none!important}"}</style>
      </noscript>
      <Tombol
        id="tombol-f-lainnya"
        varian="kedua"
        className="w-full lg:hidden"
        aria-expanded={buka}
        aria-controls="f-lainnya"
        onClick={ubahBuka}
      >
        <span>
          Filter lainnya
          {jumlahAktif > 0 ? <span className="text-primary"> · {jumlahAktif} aktif</span> : null}
        </span>
        <ChevronDown aria-hidden className={cx("size-5 transition-transform motion-reduce:transition-none", buka && "rotate-180")} />
      </Tombol>
      <div id="f-lainnya" className={cx("flex-col gap-4 lg:flex", buka ? "flex" : "hidden")}>
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
      </div>
    </form>
  );
}
