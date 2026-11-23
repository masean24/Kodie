import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BookingRinci } from "@/lib/api/booking";
import { kelompokBooking, type KelompokBooking } from "@/lib/booking";
import { formatRupiah, formatTanggalJam } from "@/lib/format";
import { StateKosong } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { LencanaStatus } from "./status-booking";

const URUTAN: { k: KelompokBooking; judul: string }[] = [
  { k: "perlu_dibayar", judul: "Perlu dibayar" },
  { k: "diperiksa", judul: "Sedang diperiksa" },
  { k: "terkonfirmasi", judul: "Terkonfirmasi" },
  { k: "riwayat", judul: "Riwayat" },
];

export function KartuBooking({ r, basePath }: { r: BookingRinci; basePath: string }) {
  const b = r.booking;
  const judul = r.kelas ? `${r.kelas.program_nama} · Level ${r.kelas.level}` : "Kelas";
  return (
    <Link
      href={`${basePath}/${b.id}`}
      className="flex items-center gap-4 rounded-card-sm bg-surface p-5 hover:ring-[1.5px] hover:ring-border-strong"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <LencanaStatus status={b.status} />
          <span className="text-sm text-text-muted">{b.kode}</span>
        </div>
        <p className="mt-2 font-display text-lg font-semibold">{judul}</p>
        <p className="text-sm text-text-muted">
          Untuk {r.siswa?.nama ?? "-"} · {formatRupiah(b.total)}
          {b.status === "menunggu_pembayaran" ? ` · bayar sebelum ${formatTanggalJam(b.batas_bayar_pada)}` : ""}
        </p>
        {b.status === "menunggu_pembayaran" && r.pembayaranTerakhir?.status === "ditolak" ? (
          <p className="mt-1 text-sm font-bold text-danger">Bukti sebelumnya ditolak. Buka untuk melihat alasannya.</p>
        ) : null}
      </div>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-text-muted" />
    </Link>
  );
}

export function DaftarBooking({ daftar, basePath }: { daftar: BookingRinci[]; basePath: string }) {
  if (daftar.length === 0) {
    return (
      <StateKosong
        judul="Belum ada booking"
        keterangan="Pilih kelas dari katalog, lalu tekan Pesan kelas."
        aksi={<TombolTautan href="/kelas">Lihat katalog kelas</TombolTautan>}
      />
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {URUTAN.map(({ k, judul }) => {
        const isi = daftar.filter((r) => kelompokBooking(r.booking.status) === k);
        if (isi.length === 0) return null;
        return (
          <section key={k} aria-labelledby={`kelompok-${k}`}>
            <h2 id={`kelompok-${k}`} className="text-xl font-semibold">
              {judul} <span className="text-text-muted">({isi.length})</span>
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {isi.map((r) => (
                <li key={r.booking.id}>
                  <KartuBooking r={r} basePath={basePath} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
