import Link from "next/link";
import { AlertTriangle, CalendarDays, Clock, User, ShieldCheck } from "lucide-react";
import type { KelasKatalog } from "@/types/database";
import { TagProgram, labelJenjang } from "@/components/kategori";
import { kelasTombol } from "@/components/ui/tombol";
import { alasanTidakBisaDipesan } from "@/lib/kelas";
import { formatJamTeks, formatRupiah, formatTanggal, namaHari } from "@/lib/format";
import { cx } from "@/lib/cx";

export function judulKelas(k: KelasKatalog) {
  return `${k.program_nama} · Level ${k.level}`;
}

/** Batang sisa kursi + teks "9 dari 15 kursi tersisa". Warna bukan satu-satunya penanda. */
export function SisaKursi({ k }: { k: KelasKatalog }) {
  const persen = Math.min(100, Math.round((k.kursi_terpakai / k.kapasitas) * 100));
  const penuh = k.sisa_kursi <= 0;
  const hampir = !penuh && k.sisa_kursi <= 3;
  return (
    <div className="flex flex-col gap-2">
      <div
        role="meter"
        aria-label="Kursi terisi"
        aria-valuemin={0}
        aria-valuemax={k.kapasitas}
        aria-valuenow={k.kursi_terpakai}
        className="h-2 overflow-hidden rounded-full bg-neutral-subtle"
      >
        <div
          className={cx("h-full rounded-full", penuh ? "bg-text-muted" : hampir ? "bg-warning" : "bg-primary")}
          style={{ width: `${persen}%` }}
        />
      </div>
      <p className={cx("flex items-center gap-1.5 font-bold", hampir ? "text-warning" : penuh ? "text-text-muted" : "")}>
        {hampir ? <AlertTriangle aria-hidden className="size-4" /> : null}
        {penuh ? "Kelas penuh" : `${hampir ? "Tinggal " : ""}${k.sisa_kursi} dari ${k.kapasitas} kursi tersisa`}
      </p>
    </div>
  );
}

export function KartuKelas({ k, trial = false }: { k: KelasKatalog; trial?: boolean }) {
  const alasan = alasanTidakBisaDipesan(k);
  const hrefDetail = trial ? `/kelas/${k.id}?trial=1` : `/kelas/${k.id}`;
  return (
    <article className="flex flex-col gap-4 rounded-card-sm bg-surface p-6 shadow-kartu">
      <div>
        <TagProgram slug={k.program_slug}>{labelJenjang(k.jenjang, k.kelas_min, k.kelas_maks)}</TagProgram>
      </div>
      <h3 className="text-xl font-semibold">
        <Link href={hrefDetail} className="relative hover:underline after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-['']">
          {judulKelas(k)}
        </Link>
      </h3>
      <ul className="flex flex-col gap-1.5 text-base">
        <li className="flex items-start gap-2">
          <CalendarDays aria-hidden className="mt-1 size-4 shrink-0" />
          Mulai {formatTanggal(k.mulai_pada)}
        </li>
        <li className="flex items-start gap-2">
          <Clock aria-hidden className="mt-1 size-4 shrink-0" />
          Setiap {namaHari(k.hari_mingguan)}, {formatJamTeks(k.jam_mulai)} WIB · {k.durasi_menit} menit
        </li>
        <li className="flex items-start gap-2">
          <User aria-hidden className="mt-1 size-4 shrink-0" />
          <span>
            Pengajar:{" "}
            <Link
              href={`/pengajar/${k.pengajar_slug || k.pengajar_id}`}
              className="relative inline-flex items-center gap-1 font-bold after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-[''] text-primary underline-offset-4 hover:underline"
            >
              {k.pengajar_nama}
              <ShieldCheck aria-hidden className="size-4 text-success" />
              <span className="sr-only"> (terverifikasi, lihat profil)</span>
            </Link>
          </span>
        </li>
      </ul>
      <SisaKursi k={k} />
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold">{formatRupiah(k.harga_paket)}</p>
          <p className="text-sm text-text-muted">{k.jumlah_sesi} sesi</p>
        </div>
        {alasan ? (
          <span className={kelasTombol("utama", "md", "pointer-events-none")} aria-disabled="true">
            {alasan}
          </span>
        ) : (
          <Link href={hrefDetail} className={kelasTombol(trial ? "ajakan" : "utama")}>
            {trial ? "Pilih untuk trial" : "Pesan kelas"}
            <span className="sr-only">: {judulKelas(k)}</span>
          </Link>
        )}
      </div>
    </article>
  );
}
