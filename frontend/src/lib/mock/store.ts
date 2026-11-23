/**
 * Penyimpanan data mock yang bisa berubah (siswa, token persetujuan, hasil tes minat, status pengguna, booking, pengajar).
 * Disimpan di globalThis supaya bertahan saat hot reload. Hilang saat server dimulai ulang.
 * Hanya dipakai di server.
 */
import type {
  Booking,
  HasilMinat,
  Honor,
  KelasKatalog,
  LaporanSesi,
  LaporanSiswa,
  Pembayaran,
  PengajarProgram,
  ProfilPengajar,
  RaporJurusan,
  SesiSaya,
  Siswa,
  StatusPengguna,
} from "@/types/database";

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
  /** Perubahan nama / no_wa pengguna di mode mock. */
  profilPengguna: Record<string, { nama: string; no_wa: string | null }>;
  booking: Booking[];
  pembayaran: Pembayaran[];
  profilPengajar: ProfilPengajar[];
  pengajarProgram: PengajarProgram[];
  kelasTambahan: KelasKatalog[];
  sesi: SesiSaya[];
  laporanSesi: LaporanSesi[];
  laporanSiswa: LaporanSiswa[];
  raporJurusan: RaporJurusan[];
  honor: Honor[];
};

const ORTU = "00000000-0000-4000-c000-000000000001";
const PENGAJAR_VERIFIED = "00000000-0000-4000-9000-000000000001";
const PENGAJAR_BARU = "00000000-0000-4000-c000-000000000005";
const ADMIN_MOCK = "00000000-0000-4000-c000-000000000006";

function awal(): Store {
  const jam = 3_600_000;
  const hari = 86_400_000;
  const menit = 60_000;
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
    diverifikasi_oleh: ADMIN_MOCK,
    diverifikasi_pada: new Date(sekarang - 4 * jam).toISOString(),
  };

  // Booking terkonfirmasi untuk kelas-kelas yang diajar Nadia Putri (untuk demo form laporan & rapor).
  const bookingDinda: Booking = {
    id: "00000000-0000-4000-f000-000000000002",
    kode: "BK-20261115-0002",
    kelas_id: "00000000-0000-4000-a000-000000000001",
    siswa_id: "00000000-0000-4000-d000-000000000001",
    dibuat_oleh: ORTU,
    status: "terkonfirmasi",
    total: 200_000,
    batas_bayar_pada: new Date(sekarang - 7 * hari).toISOString(),
    dibuat_pada: new Date(sekarang - 8 * hari).toISOString(),
  };
  const bookingBima: Booking = {
    id: "00000000-0000-4000-f000-000000000003",
    kode: "BK-20261115-0003",
    kelas_id: "00000000-0000-4000-a000-000000000001",
    siswa_id: "00000000-0000-4000-d000-000000000004",
    dibuat_oleh: "00000000-0000-4000-c000-000000000099",
    status: "terkonfirmasi",
    total: 200_000,
    batas_bayar_pada: new Date(sekarang - 7 * hari).toISOString(),
    dibuat_pada: new Date(sekarang - 8 * hari).toISOString(),
  };
  const bookingRakaSimulasi: Booking = {
    id: "00000000-0000-4000-f000-000000000004",
    kode: "BK-20261101-0004",
    kelas_id: "00000000-0000-4000-a000-000000000006",
    siswa_id: "00000000-0000-4000-d000-000000000002",
    dibuat_oleh: ORTU,
    status: "terkonfirmasi",
    total: 300_000,
    batas_bayar_pada: new Date(sekarang - 20 * hari).toISOString(),
    dibuat_pada: new Date(sekarang - 21 * hari).toISOString(),
  };
  const bookingRakaReguler: Booking = {
    id: "00000000-0000-4000-f000-000000000005",
    kode: "BK-20261120-0005",
    kelas_id: "00000000-0000-4000-a000-000000000003",
    siswa_id: "00000000-0000-4000-d000-000000000002",
    dibuat_oleh: ORTU,
    status: "terkonfirmasi",
    total: 275_000,
    batas_bayar_pada: new Date(sekarang - 2 * hari).toISOString(),
    dibuat_pada: new Date(sekarang - 3 * hari).toISOString(),
  };

  // Sesi untuk 3 kelas Nadia Putri:
  // 1) Coding Dasar Level 1 (a000-...0001): Sesi 1 selesai (berlaporan), Sesi 2 sedang berlangsung (mulai 10 mnt lalu, selesai 50 mnt lagi -> Masuk kelas + Playbook + Laporan aktif!).
  const sesiCoding1Mulai = sekarang - 7 * hari;
  const sesiCoding2Mulai = sekarang - 10 * menit;
  const sesiCoding: SesiSaya[] = [
    {
      id: "00000000-0000-4000-b100-000000000101",
      kelas_id: "00000000-0000-4000-a000-000000000001",
      nomor: 1,
      mulai_pada: new Date(sesiCoding1Mulai).toISOString(),
      selesai_pada: new Date(sesiCoding1Mulai + 60 * menit).toISOString(),
      status: "selesai",
      bisa_masuk_kelas: false,
    },
    {
      id: "00000000-0000-4000-b100-000000000102",
      kelas_id: "00000000-0000-4000-a000-000000000001",
      nomor: 2,
      mulai_pada: new Date(sesiCoding2Mulai).toISOString(),
      selesai_pada: new Date(sesiCoding2Mulai + 60 * menit).toISOString(),
      status: "terjadwal",
      bisa_masuk_kelas: true,
    },
    {
      id: "00000000-0000-4000-b100-000000000103",
      kelas_id: "00000000-0000-4000-a000-000000000001",
      nomor: 3,
      mulai_pada: new Date(sesiCoding2Mulai + 7 * hari).toISOString(),
      selesai_pada: new Date(sesiCoding2Mulai + 7 * hari + 60 * menit).toISOString(),
      status: "terjadwal",
      bisa_masuk_kelas: false,
    },
    {
      id: "00000000-0000-4000-b100-000000000104",
      kelas_id: "00000000-0000-4000-a000-000000000001",
      nomor: 4,
      mulai_pada: new Date(sesiCoding2Mulai + 14 * hari).toISOString(),
      selesai_pada: new Date(sesiCoding2Mulai + 14 * hari + 60 * menit).toISOString(),
      status: "terjadwal",
      bisa_masuk_kelas: false,
    },
  ];

  // 2) Kelas Reguler Teknologi Level 2 (a000-...0003): sesi 1 mulai 3 hari lagi (bisa digeser jadwal).
  const regulerMulai = sekarang + 3 * hari;
  const sesiReguler: SesiSaya[] = Array.from({ length: 4 }, (_, i) => {
    const m = regulerMulai + i * 7 * hari;
    return {
      id: `00000000-0000-4000-b100-00000000030${i + 1}`,
      kelas_id: "00000000-0000-4000-a000-000000000003",
      nomor: i + 1,
      mulai_pada: new Date(m).toISOString(),
      selesai_pada: new Date(m + 90 * menit).toISOString(),
      status: "terjadwal",
      bisa_masuk_kelas: false,
    };
  });

  // 3) Simulasi Jurusan IT Level 1 (a000-...0006): Sesi 1–3 selesai, Sesi 4 berakhir 3 jam lalu belum ada laporan -> memicu pengingat 2 jam + form rapor F11!
  const simSesi4Selesai = sekarang - 3 * jam;
  const simSesi4Mulai = simSesi4Selesai - 90 * menit;
  const sesiSimulasi: SesiSaya[] = [
    {
      id: "00000000-0000-4000-b100-000000000601",
      kelas_id: "00000000-0000-4000-a000-000000000006",
      nomor: 1,
      mulai_pada: new Date(simSesi4Mulai - 21 * hari).toISOString(),
      selesai_pada: new Date(simSesi4Selesai - 21 * hari).toISOString(),
      status: "selesai",
      bisa_masuk_kelas: false,
    },
    {
      id: "00000000-0000-4000-b100-000000000602",
      kelas_id: "00000000-0000-4000-a000-000000000006",
      nomor: 2,
      mulai_pada: new Date(simSesi4Mulai - 14 * hari).toISOString(),
      selesai_pada: new Date(simSesi4Selesai - 14 * hari).toISOString(),
      status: "selesai",
      bisa_masuk_kelas: false,
    },
    {
      id: "00000000-0000-4000-b100-000000000603",
      kelas_id: "00000000-0000-4000-a000-000000000006",
      nomor: 3,
      mulai_pada: new Date(simSesi4Mulai - 7 * hari).toISOString(),
      selesai_pada: new Date(simSesi4Selesai - 7 * hari).toISOString(),
      status: "selesai",
      bisa_masuk_kelas: false,
    },
    {
      id: "00000000-0000-4000-b100-000000000604",
      kelas_id: "00000000-0000-4000-a000-000000000006",
      nomor: 4,
      mulai_pada: new Date(simSesi4Mulai).toISOString(),
      selesai_pada: new Date(simSesi4Selesai).toISOString(),
      status: "terjadwal",
      bisa_masuk_kelas: false,
    },
  ];

  const laporanContohId = "00000000-0000-4000-b200-000000000101";
  const laporanSesi: LaporanSesi[] = [
    {
      id: laporanContohId,
      sesi_id: sesiCoding[0].id,
      pengajar_id: PENGAJAR_VERIFIED,
      ringkasan: "Siswa mengenal panggung Scratch, sprite, serta blok gerak dasar dan bunyi.",
      rekaman_url: null,
      kendala: null,
      dikirim_pada: new Date(sesiCoding1Mulai + 90 * menit).toISOString(),
      diubah_pada: null,
    },
    {
      id: "00000000-0000-4000-b200-000000000601",
      sesi_id: sesiSimulasi[0].id,
      pengajar_id: PENGAJAR_VERIFIED,
      ringkasan: "Pengenalan logika alur kerja aplikasi web sederhana dan debugging dasar.",
      rekaman_url: null,
      kendala: null,
      dikirim_pada: new Date(simSesi4Mulai - 21 * hari + 2 * jam).toISOString(),
      diubah_pada: null,
    },
    {
      id: "00000000-0000-4000-b200-000000000602",
      sesi_id: sesiSimulasi[1].id,
      pengajar_id: PENGAJAR_VERIFIED,
      ringkasan: "Simulasi paket data, alamat IP, dan cara kerja router di jaringan lokal.",
      rekaman_url: null,
      kendala: null,
      dikirim_pada: new Date(simSesi4Mulai - 14 * hari + 2 * jam).toISOString(),
      diubah_pada: null,
    },
    {
      id: "00000000-0000-4000-b200-000000000603",
      sesi_id: sesiSimulasi[2].id,
      pengajar_id: PENGAJAR_VERIFIED,
      ringkasan: "Merangkai LED dan sensor jarak virtual di Wokwi dengan kontrol logika.",
      rekaman_url: null,
      kendala: null,
      dikirim_pada: new Date(simSesi4Mulai - 7 * hari + 2 * jam).toISOString(),
      diubah_pada: null,
    },
  ];

  const laporanSiswa: LaporanSiswa[] = [
    {
      id: "00000000-0000-4000-b300-000000000101",
      laporan_sesi_id: laporanContohId,
      siswa_id: "00000000-0000-4000-d000-000000000001",
      hadir: true,
      catatan: "Dinda antusias mencoba suara sprite baru dan cepat mengerti koordinat.",
      karya_url: "https://scratch.mit.edu/projects/1000001",
    },
    {
      id: "00000000-0000-4000-b300-000000000102",
      laporan_sesi_id: laporanContohId,
      siswa_id: "00000000-0000-4000-d000-000000000004",
      hadir: true,
      catatan: "Bima berani mempresentasikan animasi pertamanya di akhir sesi.",
      karya_url: null,
    },
  ];

  const honor: Honor[] = [
    {
      id: "00000000-0000-4000-b400-000000000001",
      pengajar_id: PENGAJAR_VERIFIED,
      sesi_id: sesiCoding[0].id,
      jumlah: 50_000,
      status: "dibayar",
      dibayar_pada: new Date(sesiCoding1Mulai + 2 * hari).toISOString(),
      dibayar_oleh: ADMIN_MOCK,
    },
    {
      id: "00000000-0000-4000-b400-000000000002",
      pengajar_id: PENGAJAR_VERIFIED,
      sesi_id: sesiSimulasi[0].id,
      jumlah: 75_000,
      status: "dibayar",
      dibayar_pada: new Date(simSesi4Mulai - 18 * hari).toISOString(),
      dibayar_oleh: ADMIN_MOCK,
    },
    {
      id: "00000000-0000-4000-b400-000000000003",
      pengajar_id: PENGAJAR_VERIFIED,
      sesi_id: sesiSimulasi[1].id,
      jumlah: 75_000,
      status: "dibayar",
      dibayar_pada: new Date(simSesi4Mulai - 11 * hari).toISOString(),
      dibayar_oleh: ADMIN_MOCK,
    },
    {
      id: "00000000-0000-4000-b400-000000000004",
      pengajar_id: PENGAJAR_VERIFIED,
      sesi_id: sesiSimulasi[2].id,
      jumlah: 75_000,
      status: "belum_dibayar",
      dibayar_pada: null,
      dibayar_oleh: null,
    },
  ];

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
      {
        id: "00000000-0000-4000-d000-000000000004",
        nama: "Bima Santoso",
        tanggal_lahir: "2015-05-09",
        jenjang: "SD",
        kelas: 6,
        sekolah: "SD Contoh 1",
        orang_tua_id: "00000000-0000-4000-c000-000000000099",
        pengguna_id: null,
        nama_orang_tua: null,
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
    profilPengguna: {},
    booking: [bookingContoh, bookingDinda, bookingBima, bookingRakaSimulasi, bookingRakaReguler],
    pembayaran: [pembayaranDitolak],
    profilPengajar: [
      {
        pengguna_id: PENGAJAR_VERIFIED,
        status_kerja: "mahasiswa",
        kampus: "Universitas Contoh Nusantara",
        jurusan: "Informatika",
        keahlian: ["software", "ai_data"],
        cv_url: "https://contoh.id/cv-nadia",
        foto_path: null,
        identitas_path: `${PENGAJAR_VERIFIED}/ktm-nadia.jpg`,
        skck_path: `${PENGAJAR_VERIFIED}/skck-nadia.pdf`,
        wawancara_selesai: true,
        alasan_penolakan: null,
        diverifikasi_pada: "2026-11-02T09:00:00.000Z",
        diverifikasi_oleh: ADMIN_MOCK,
      },
      {
        pengguna_id: PENGAJAR_BARU,
        status_kerja: "lulusan",
        kampus: "Institut Teknologi Contoh",
        jurusan: "Teknik Komputer",
        keahlian: ["jaringan", "iot"],
        cv_url: null,
        foto_path: null,
        identitas_path: null,
        skck_path: null,
        wawancara_selesai: false,
        alasan_penolakan: null,
        diverifikasi_pada: null,
        diverifikasi_oleh: null,
      },
    ],
    pengajarProgram: [
      { pengajar_id: PENGAJAR_VERIFIED, program_id: "00000000-0000-4000-8000-000000000001", disetujui: true },
      { pengajar_id: PENGAJAR_VERIFIED, program_id: "00000000-0000-4000-8000-000000000002", disetujui: true },
      { pengajar_id: PENGAJAR_VERIFIED, program_id: "00000000-0000-4000-8000-000000000003", disetujui: true },
      { pengajar_id: PENGAJAR_BARU, program_id: "00000000-0000-4000-8000-000000000002", disetujui: false },
    ],
    kelasTambahan: [],
    sesi: [...sesiCoding, ...sesiReguler, ...sesiSimulasi],
    laporanSesi,
    laporanSiswa,
    raporJurusan: [],
    honor,
  };
}

const g = globalThis as typeof globalThis & { __kodieMock?: Store };

export function storeMock(): Store {
  g.__kodieMock ??= awal();
  // Store lama dari hot reload sebelum kolom baru ditambahkan: lengkapi tanpa menghapus isinya.
  if (
    g.__kodieMock.booking === undefined ||
    g.__kodieMock.pembayaran === undefined ||
    g.__kodieMock.profilPengajar === undefined ||
    g.__kodieMock.sesi === undefined
  ) {
    const isi = awal();
    g.__kodieMock.booking ??= isi.booking;
    g.__kodieMock.pembayaran ??= isi.pembayaran;
    g.__kodieMock.profilPengguna ??= isi.profilPengguna;
    g.__kodieMock.profilPengajar ??= isi.profilPengajar;
    g.__kodieMock.pengajarProgram ??= isi.pengajarProgram;
    g.__kodieMock.kelasTambahan ??= isi.kelasTambahan;
    g.__kodieMock.sesi ??= isi.sesi;
    g.__kodieMock.laporanSesi ??= isi.laporanSesi;
    g.__kodieMock.laporanSiswa ??= isi.laporanSiswa;
    g.__kodieMock.raporJurusan ??= isi.raporJurusan;
    g.__kodieMock.honor ??= isi.honor;
  }
  return g.__kodieMock;
}
