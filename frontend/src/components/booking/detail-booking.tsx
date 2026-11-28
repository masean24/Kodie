import Link from "next/link";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import type { InfoPembayaran } from "@/types/database";
import type { BookingRinci } from "@/lib/api/booking";
import { formatJamTeks, formatRupiah, formatTanggal, formatTanggalJam, namaHari } from "@/lib/format";
import { jadwalSesi } from "@/lib/kelas";
import { Catatan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { LangkahPesan } from "./langkah-pesan";
import { LencanaStatus } from "./status-booking";
import { FormBukti, TombolBatal, TombolSalin } from "./interaksi";

function judulKelas(r: BookingRinci) {
  return r.kelas ? `${r.kelas.program_nama} · Level ${r.kelas.level}` : "Kelas";
}

function Ringkasan({ r }: { r: BookingRinci }) {
  return (
    <section aria-label="Rincian booking" className="rounded-card bg-surface p-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-text-muted">Siswa</dt>
          <dd className="font-bold">{r.siswa?.nama ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-sm text-text-muted">Kelas</dt>
          <dd className="font-bold">{judulKelas(r)}</dd>
          {r.kelas ? <dd className="text-sm text-text-muted">Pengajar: {r.kelas.pengajar_nama}</dd> : null}
        </div>
        {r.kelas ? (
          <div>
            <dt className="text-sm text-text-muted">Jadwal</dt>
            <dd className="font-bold">
              Setiap {namaHari(r.kelas.hari_mingguan)}, {formatJamTeks(r.kelas.jam_mulai)} WIB
            </dd>
            <dd className="text-sm text-text-muted">Mulai {formatTanggal(r.kelas.mulai_pada)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-sm text-text-muted">{r.booking.jenis === "trial" ? "Jenis pesanan" : "Total"}</dt>
          <dd className="font-display text-xl font-semibold">
            {r.booking.jenis === "trial" ? "Trial gratis · Sesi 1 saja" : formatRupiah(r.booking.total)}
          </dd>
          {r.booking.potongan && r.booking.kode_referral ? (
            <dd className="text-sm text-success">
              Termasuk potongan referral {formatRupiah(r.booking.potongan)} (kode {r.booking.kode_referral})
            </dd>
          ) : null}
        </div>
      </dl>
    </section>
  );
}

function PanelBayar({ r, info }: { r: BookingRinci; info: InfoPembayaran }) {
  const b = r.booking;
  const ditolak = r.pembayaranTerakhir?.status === "ditolak" ? r.pembayaranTerakhir : null;
  return (
    <>
      {ditolak ? (
        <div role="alert" className="flex gap-3 rounded-card-sm bg-danger-subtle p-5">
          <XCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <p className="font-display font-semibold text-danger">Bukti bayar sebelumnya ditolak admin</p>
            <p className="mt-1">Alasan: {ditolak.alasan_penolakan ?? "tidak disebutkan"}</p>
            <p className="mt-1 text-sm">Batas waktu diperpanjang. Unggah bukti baru sebelum batas di bawah.</p>
          </div>
        </div>
      ) : null}
      <div className="flex gap-3 rounded-card-sm bg-warning-subtle p-5">
        <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="font-display font-semibold text-warning">Bayar sebelum {formatTanggalJam(b.batas_bayar_pada)}</p>
          <p className="mt-1">Kursi ditahan 24 jam. Setelah itu booking otomatis kedaluwarsa.</p>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="judul-total" className="blok-merek on-block rounded-card p-6 md:p-8">
            <h2 id="judul-total" className="text-sm font-bold">
              Total yang harus dibayar
            </h2>
            <p className="mt-1 font-display text-48 leading-[48px] font-extrabold break-words md:text-56 md:leading-[64px]">
              {formatRupiah(b.total)}
            </p>
            <p className="mt-2 text-sm">Transfer tepat sesuai nominal supaya cepat diperiksa.</p>
          </section>
          <section aria-labelledby="judul-transfer" className="rounded-card bg-surface p-6">
            <h2 id="judul-transfer" className="text-xl font-semibold">
              Transfer bank
            </h2>
            <dl className="mt-4 flex flex-col gap-3">
              <div>
                <dt className="text-sm text-text-muted">Bank</dt>
                <dd className="font-bold">{info.nama_bank || "-"}</dd>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <dt className="text-sm text-text-muted">Nomor rekening</dt>
                  <dd className="font-display text-lg font-semibold">{info.nomor_rekening || "-"}</dd>
                </div>
                {info.nomor_rekening ? <TombolSalin teks={info.nomor_rekening} label="nomor rekening" /> : null}
              </div>
              <div>
                <dt className="text-sm text-text-muted">Atas nama</dt>
                <dd className="font-bold">{info.nama_pemilik_rekening || "-"}</dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="judul-qris" className="flex flex-col gap-4 rounded-card bg-surface p-6 sm:flex-row sm:items-center">
            {info.qris_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed URL Supabase berumur 5 menit
              <img src={info.qris_url} alt="Kode QRIS pembayaran Kodie" width={160} height={160} className="size-40 shrink-0 rounded-md bg-white object-contain p-1" />
            ) : null}
            <div>
              <h2 id="judul-qris" className="text-xl font-semibold">
                Atau bayar dengan QRIS
              </h2>
              <p className="mt-2 text-text-muted">
                Pindai kode dengan aplikasi bank atau dompet digital, lalu masukkan nominal {formatRupiah(b.total)}.
              </p>
            </div>
          </section>
        </div>
        <section aria-labelledby="judul-unggah" className="flex flex-col gap-4 rounded-card bg-surface p-6 lg:sticky lg:top-24">
          <h2 id="judul-unggah" className="text-xl font-semibold">
            Sudah bayar? Unggah buktinya
          </h2>
          <p className="text-sm text-text-muted">
            Admin memeriksa bukti bayar, biasanya kurang dari 1 hari kerja. Anda akan mendapat notifikasi.
          </p>
          <FormBukti bookingId={b.id} />
          <TombolBatal bookingId={b.id} />
        </section>
      </div>
    </>
  );
}

export function DetailBooking({ r, info, basePath }: { r: BookingRinci; info: InfoPembayaran | null; basePath: string }) {
  const b = r.booking;
  const status = b.status;
  const trial = b.jenis === "trial";
  return (
    <div className="flex flex-col gap-6">
      <Link href={basePath} className="inline-flex min-h-touch items-center gap-2 self-start font-display font-semibold text-primary hover:underline">
        <ArrowLeft data-kembali aria-hidden className="size-5" /> Semua booking
      </Link>
      {status === "menunggu_pembayaran" ? <LangkahPesan ke={3} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">
            {status === "menunggu_pembayaran" ? "Bayar booking" : "Detail booking"}
          </h1>
          <p className="mt-1 text-text-muted">Kode booking {b.kode}</p>
        </div>
        <LencanaStatus status={status} />
      </div>

      {status === "menunggu_pembayaran" && info ? <PanelBayar r={r} info={info} /> : null}

      {status === "menunggu_verifikasi" ? (
        <div className="flex gap-3 rounded-card-sm bg-info-subtle p-5">
          <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-info" />
          <div>
            <p className="font-display font-semibold text-info">Bukti bayar sedang diperiksa admin</p>
            <p className="mt-1">
              Dikirim {r.pembayaranTerakhir ? formatTanggalJam(r.pembayaranTerakhir.diunggah_pada) : ""}. Biasanya selesai kurang
              dari 1 hari kerja. Anda akan mendapat notifikasi.
            </p>
          </div>
        </div>
      ) : null}

      {status === "terkonfirmasi" || status === "selesai" ? (
        <div className="flex gap-3 rounded-card-sm bg-success-subtle p-5">
          <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-display font-semibold text-success">
              {trial
                ? status === "selesai"
                  ? "Trial Sesi 1 sudah selesai"
                  : "Trial gratis terkonfirmasi"
                : status === "selesai"
                  ? "Kelas sudah selesai"
                  : "Pembayaran terkonfirmasi"}
            </p>
            <p className="mt-1">
              {trial
                ? status === "selesai"
                  ? "Laporan Sesi 1 ada di dashboard. Pilih jadwal paket 4 sesi untuk melanjutkan program ini."
                  : "Tidak perlu membayar. Tombol Masuk kelas muncul di dashboard 15 menit sebelum Sesi 1 dimulai."
                : status === "selesai"
                  ? "Laporan setiap sesi dan rapor (untuk Simulasi Jurusan IT) bisa dilihat di dashboard."
                  : "Tombol Masuk kelas muncul di dashboard 15 menit sebelum setiap sesi dimulai."}
            </p>
            {trial && status === "selesai" && r.kelas ? (
              <TombolTautan href={`/kelas?program=${r.kelas.program_slug}`} className="mt-3">
                Lanjut paket penuh
              </TombolTautan>
            ) : null}
          </div>
        </div>
      ) : null}

      {status === "kedaluwarsa" || status === "dibatalkan" ? (
        <Catatan nada="peringatan" judul={status === "kedaluwarsa" ? "Booking kedaluwarsa" : "Booking dibatalkan"}>
          <p>
            {status === "kedaluwarsa"
              ? "Bukti bayar tidak diunggah sebelum batas waktu, jadi kursi sudah dilepas."
              : "Kursi sudah dilepas untuk siswa lain."}{" "}
            Pesan lagi dari katalog kalau masih ada kursi.
          </p>
          <TombolTautan href={r.kelas ? `/kelas/${r.kelas.id}` : "/kelas"} varian="kedua" className="mt-3">
            Lihat kelas
          </TombolTautan>
        </Catatan>
      ) : null}

      <Ringkasan r={r} />

      {(status === "terkonfirmasi" || status === "menunggu_verifikasi") && r.kelas ? (
        <section aria-labelledby="judul-jadwal" className="rounded-card bg-surface p-6">
          <h2 id="judul-jadwal" className="text-xl font-semibold">
            {trial ? "Jadwal trial (Sesi 1)" : `Jadwal ${r.kelas.jumlah_sesi} sesi`}
          </h2>
          <ol className="mt-4 flex flex-col gap-3">
            {jadwalSesi(r.kelas.mulai_pada, trial ? 1 : r.kelas.jumlah_sesi).map((s, i) => (
              <li key={s} className="flex items-center gap-4">
                <CalendarDays aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="w-16 font-bold">Sesi {i + 1}</span>
                <span>{formatTanggalJam(s)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex gap-2 text-sm text-text-muted">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />{" "}
            {trial
              ? "Trial hanya berlaku untuk Sesi 1. Sesi 2–4 ikut setelah memesan paket penuh."
              : "Tanggal sesi 2–4 bisa digeser pengajar. Perubahan akan diberitahukan."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
