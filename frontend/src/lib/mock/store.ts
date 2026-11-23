/**
 * Penyimpanan data mock yang bisa berubah (siswa, token persetujuan, hasil tes minat, status pengguna).
 * Disimpan di globalThis supaya bertahan saat hot reload. Hilang saat server dimulai ulang.
 * Hanya dipakai di server.
 */
import type { HasilMinat, Siswa, StatusPengguna } from "@/types/database";

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
};

const ORTU = "00000000-0000-4000-c000-000000000001";

function awal(): Store {
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
  };
}

const g = globalThis as typeof globalThis & { __kodieMock?: Store };

export function storeMock(): Store {
  g.__kodieMock ??= awal();
  return g.__kodieMock;
}
