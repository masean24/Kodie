import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileImage } from "lucide-react";
import { LABEL_STATUS_PEMBAYARAN } from "@/lib/admin";
import { ambilDetailPembayaranAdmin } from "@/lib/api/admin";
import { LABEL_STATUS_BOOKING } from "@/lib/booking";
import { formatJamTeks, formatRupiah, formatTanggalJam, namaHari } from "@/lib/format";
import { AksiVerifikasiPembayaran } from "@/components/admin/aksi-pembayaran";
import { TagProgram } from "@/components/kategori";
import { Catatan, Kartu, Lencana } from "@/components/ui/dasar";
import { kelasTombol } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Detail pembayaran" };

const NADA_PEMBAYARAN = {
  menunggu: "peringatan",
  disetujui: "sukses",
  ditolak: "bahaya",
} as const;

export default async function HalamanDetailPembayaranAdmin({
  params,
}: PageProps<"/admin/pembayaran/[id]">) {
  const { id } = await params;
  const item = await ambilDetailPembayaranAdmin(id);
  if (!item) notFound();

  const { pembayaran, booking, siswa, kelas, buktiSignedUrl } = item;
  const buktiPdf = buktiSignedUrl
    ? buktiSignedUrl.split("?")[0].toLowerCase().endsWith(".pdf")
    : pembayaran.bukti_path.toLowerCase().endsWith(".pdf");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/pembayaran"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" /> Kembali ke antrean pembayaran
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-[28px] leading-[34px] font-extrabold md:text-[36px] md:leading-[42px]">
            {booking.kode}
          </h1>
          <Lencana nada={NADA_PEMBAYARAN[pembayaran.status]}>
            {LABEL_STATUS_PEMBAYARAN[pembayaran.status]}
          </Lencana>
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Diunggah pada {formatTanggalJam(pembayaran.diunggah_pada)}
        </p>
      </div>

      {pembayaran.status === "ditolak" && pembayaran.alasan_penolakan ? (
        <Catatan nada="peringatan" judul="Alasan penolakan sebelumnya">
          <p>{pembayaran.alasan_penolakan}</p>
        </Catatan>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Ringkasan booking</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Total tagihan</dt>
              <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">
                {formatRupiah(booking.total)}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Status booking</dt>
              <dd className="mt-0.5 font-semibold">{LABEL_STATUS_BOOKING[booking.status]}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Siswa</dt>
              <dd className="mt-0.5 font-semibold">
                {siswa ? `${siswa.nama} (${siswa.jenjang} kelas ${siswa.kelas})` : "Data siswa"}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Dibuat pada</dt>
              <dd className="mt-0.5">{formatTanggalJam(booking.dibuat_pada)}</dd>
            </div>
            {kelas ? (
              <div className="sm:col-span-2">
                <dt className="text-text-muted">Kelas yang dipilih</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <TagProgram slug={kelas.program_slug}>{kelas.program_nama}</TagProgram>
                  <span className="font-semibold">Level {kelas.level}</span>
                  <span className="text-text-muted">
                    · Pengajar {kelas.pengajar_nama} · {namaHari(kelas.hari_mingguan)} {formatJamTeks(kelas.jam_mulai)} WIB
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>
        </Kartu>

        <Kartu className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Bukti pembayaran</h2>
          {buktiSignedUrl ? (
            buktiPdf ? (
              <div className="flex flex-col items-start gap-3 rounded-md bg-surface-sunken p-4">
                <p className="text-sm">Bukti pembayaran berformat PDF (signed URL berlaku 5 menit).</p>
                <a
                  href={buktiSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={kelasTombol("kedua")}
                >
                  <ExternalLink aria-hidden className="size-4" /> Buka berkas PDF
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Signed URL privat dari Supabase Storage bersifat dinamis; pakai <img> langsung. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buktiSignedUrl}
                  alt={`Bukti pembayaran untuk booking ${booking.kode}`}
                  className="max-h-[420px] w-full rounded-md bg-surface-sunken object-contain"
                />
                <a
                  href={buktiSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  <ExternalLink aria-hidden className="size-4" /> Buka gambar ukuran penuh
                </a>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-2 rounded-md bg-surface-sunken p-4 text-sm text-text-muted">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <FileImage aria-hidden className="size-5 text-primary" />
                <span>Berkas tersimpan di bucket privat bukti-bayar</span>
              </div>
              <p className="font-mono text-xs break-all">{pembayaran.bukti_path}</p>
              <p>
                Dalam mode contoh (mock), pratinjau signed URL Supabase belum aktif. Anda tetap dapat menguji
                tombol Setujui atau Tolak di bawah.
              </p>
            </div>
          )}
        </Kartu>
      </div>

      {/* Komponen aksi sudah memuat kartu dan judul "Keputusan admin" sendiri. */}
      <AksiVerifikasiPembayaran
        pembayaranId={pembayaran.id}
        kodeBooking={booking.kode}
        statusSaatIni={pembayaran.status}
      />
    </div>
  );
}
