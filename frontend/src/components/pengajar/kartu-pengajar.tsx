import Link from "next/link";
import { ShieldCheck, Star } from "lucide-react";
import type { PengajarPublik, StatusKerja } from "@/types/database";
import { TagBidang } from "@/components/kategori";
import { cx } from "@/lib/cx";

const STATUS_KERJA: Record<StatusKerja, string> = {
  mahasiswa: "Mahasiswa",
  lulusan: "Lulusan",
  pencari_kerja: "Lulusan",
};

export function keteranganPengajar(p: PengajarPublik): string {
  return [STATUS_KERJA[p.status_kerja], p.jurusan].filter(Boolean).join(" ");
}

export function inisial(nama: string): string {
  return nama
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ nama, foto, besar }: { nama: string; foto: string | null; besar?: boolean }) {
  const ukuran = besar ? "size-24 text-3xl" : "size-14 text-xl";
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element -- foto dari bucket publik Supabase, domain diatur di Prompt 8
    return <img src={foto} alt="" className={cx(ukuran, "rounded-full object-cover")} />;
  }
  return (
    <span aria-hidden className={cx(ukuran, "grid shrink-0 place-items-center rounded-full bg-primary-subtle font-display font-semibold text-primary")}>
      {inisial(nama)}
    </span>
  );
}

export function Rating({ p }: { p: PengajarPublik }) {
  if (p.rata_rata_rating === null) {
    return <p className="text-sm text-text-muted">Rating tampil setelah ada minimal 3 penilaian.</p>;
  }
  return (
    <p className="flex items-center gap-2 text-sm">
      <Star aria-hidden className="size-5 fill-warning text-warning" />
      <span>
        {p.rata_rata_rating.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dari 5 ·{" "}
        {p.jumlah_rating} rating
      </span>
    </p>
  );
}

export function KartuPengajar({ p, judulLevel = 3 }: { p: PengajarPublik; judulLevel?: 2 | 3 }) {
  const Judul = judulLevel === 2 ? "h2" : "h3";
  return (
    <article className="flex h-full flex-col gap-3 rounded-card-sm bg-surface p-6">
      <div className="flex items-center gap-4">
        <Avatar nama={p.nama} foto={p.foto_url} />
        <div className="min-w-0">
          <Judul className="text-lg font-semibold leading-snug">{p.nama}</Judul>
          <p className="mt-0.5 text-sm leading-snug text-text-muted">{keteranganPengajar(p)}</p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm font-bold text-success">
        <ShieldCheck aria-hidden className="size-5" /> Terverifikasi admin
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="Keahlian">
        {p.keahlian.map((b) => (
          <li key={b}>
            <TagBidang bidang={b} />
          </li>
        ))}
      </ul>
      <Rating p={p} />
      <Link
        href={`/pengajar/${p.id}`}
        className="mt-auto flex min-h-touch items-center font-display font-semibold text-primary underline-offset-4 hover:underline"
      >
        Lihat profil<span className="sr-only"> {p.nama}</span>
      </Link>
    </article>
  );
}
