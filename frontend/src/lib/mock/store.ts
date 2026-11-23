/**
 * Penyimpanan data mock yang bisa berubah (siswa, token persetujuan, hasil tes minat, status pengguna).
 * Disimpan di globalThis supaya bertahan saat hot reload. Hilang saat server dimulai ulang.
 * Hanya dipakai di server.
 */
import type { Booking, HasilMinat, Pembayaran, Siswa, StatusPengguna } from "@/types/database";

type TokenMock = {
  token: string;
  siswa_id: string;
  kedaluwarsa_pada: string;
  status: "menunggu" | "disetujui" | "ditolak" | "kedaluwarsa";
  orang_tua_id: string | null;
  diputuskan_pada: string | null;
};

type Store = {
  siswa: Siswa[];
  token: TokenMock[];
  hasilMinat: HasilMinat[];
  /** Perubahan status pengguna (mis. siswa disetujui) yang menimpa isi cookie sesi mock. */
  status: Record<string, StatusPengguna>;
  booking: Booking[];
  pembayaran: Pembayaran[];
};

const ORTU = "00000000-0000-4000-c000-000000000001";

function awal(): Store {
  const jam = 3_600_000;
  const sekarang = Date.now();
  // Contoh: booking Raka yang bukti bayarnya pernah ditolak admin (alasan tampil di halaman booking).
  const bookingContoh: Booking = {
    id: "00000000-0000-4000-f000-000000000001",
    kode: "BK-20261123-0001",
    kelas_id: "00000000-0000-4000-a000-000000000005",
    siswa_id: "00000000-0000-4000-d000-000000000002",
    dibuat_oleh: ORTU,
    status: "menunggu_pembayaran",
    total: 300_000,
    batas_bayar_pada: new Date(sekarang + 20 * jam).toISOString(),
    dibuat_pada: new Date(sekarang - 30 * jam).toISOString(),
  };
  const pembayaranDitolak: Pembayaran = {
    id: "00000000-0000-4000-f100-000000000001",
    booking_id: bookingContoh.id,
    bukti_path: `${bookingContoh.id}/contoh.jpg`,
    diunggah_pada: new Date(sekarang - 6 * jam).toISOString(),
    status: "ditolak",
    alasan_penolakan: "Nominal transfer Rp250.000, kurang Rp50.000. Mohon transfer kekurangannya lalu unggah bukti baru.",
    diverifikasi_oleh: "00000000-0000-4000-c000-000000000006",
    diverifikasi_pada: new Date(sekarang - 4 * jam).toISOString(),
  };
  return {
    siswa: [
      {
        id: "00000000-0000-4000-d000-000000000001",
        nama: "Dinda Pratama",
        tanggal_lahir: "2016-02-11",
        jenjang: "SD",
        kelas: 5,
        sekolah: "SD Contoh 3",
        orang_tua_id: ORTU,
        pengguna_id: null,
        nama_orang_tua: null,
        email_orang_tua: null,
      },
      {
        id: "00000000-0000-4000-d000-000000000002",
        nama: "Raka Pratama",
        tanggal_lahir: "2010-03-14",
        jenjang: "SMA",
        kelas: 11,
        sekolah: "SMA Contoh 1",
        orang_tua_id: ORTU,
        pengguna_id: "00000000-0000-4000-c000-000000000002",
        nama_orang_tua: "Sari Wulandari",
        email_orang_tua: null,
      },
      {
        id: "00000000-0000-4000-d000-000000000003",
        nama: "Laras Kinanti",
        tanggal_lahir: "2011-08-20",
        jenjang: "SMP",
        kelas: 9,
        sekolah: null,
        orang_tua_id: null,
        pengguna_id: "00000000-0000-4000-c000-000000000003",
        nama_orang_tua: "Wulan Kinanti",
        email_orang_tua: null,
      },
    ],
    token: [],
    hasilMinat: [
      {
        id: "00000000-0000-4000-e000-000000000001",
        siswa_id: "00000000-0000-4000-d000-000000000002",
        dikerjakan_oleh: "00000000-0000-4000-c000-000000000002",
        jawaban: {},
        skor: { software: 38, jaringan: 15, iot: 20, ai_data: 27 },
        bidang_teratas: "software",
        dibuat_pada: "2026-11-17T08:00:00.000Z",
      },
    ],
    status: {},
    booking: [bookingContoh],
    pembayaran: [pembayaranDitolak],
  };
}

const g = globalThis as typeof globalThis & { __kodieMock?: Store };

export function storeMock(): Store {
  g.__kodieMock ??= awal();
  // Store lama dari hot reload sebelum kolom baru ditambahkan: lengkapi tanpa menghapus isinya.
  if (g.__kodieMock.booking === undefined || g.__kodieMock.pembayaran === undefined) {
    const isi = awal();
    g.__kodieMock.booking ??= isi.booking;
    g.__kodieMock.pembayaran ??= isi.pembayaran;
  }
  return g.__kodieMock;
}
