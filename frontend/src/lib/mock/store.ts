/**
 * Penyimpanan data mock yang bisa berubah (siswa, token persetujuan, hasil tes minat, status pengguna, booking, pengajar, sesi, notifikasi).
 * Disimpan di globalThis supaya bertahan saat hot reload. Hilang saat server dimulai ulang.
 * Hanya dipakai di server.
 */
import type {
  Booking,
  HasilMinat,
  Honor,
  KelasKatalog,
  LaporanMasalah,
  LaporanSesi,
  LaporanSiswa,
  LogAdmin,
  Notifikasi,
  Pembayaran,
  PengajarProgram,
  ProfilPengajar,
  Program,
  RaporJurusan,
  Rating,
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
  rating: Rating[];
  laporanMasalah: LaporanMasalah[];
  notifikasi: Notifikasi[];
  pengaturan: {
    nama_bank: string;
    nomor_rekening: string;
    nama_pemilik_rekening: string;
    qris_path: string | null;
  };
  programOverride: Record<string, Partial<Pick<Program, "harga_paket" | "durasi_menit" | "jumlah_sesi" | "honor_per_sesi" | "aktif">>>;
  sesiTanpaMeetIds: string[];
  logAdmin: LogAdmin[];
};

const ORTU = "00000000-0000-4000-c000-000000000001";
const SISWA_RAKA = "00000000-0000-4000-c000-000000000002";
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

  // Contoh antrean verifikasi admin: 1 pembayaran menunggu pemeriksaan.
  const bookingMenungguVerif: Booking = {
    id: "00000000-0000-4000-f000-000000000006",
    kode: "BK-20261123-0006",
    kelas_id: "00000000-0000-4000-a000-000000000004",
    siswa_id: "00000000-0000-4000-d000-000000000002",
    dibuat_oleh: ORTU,
    status: "menunggu_verifikasi",
    total: 275_000,
    batas_bayar_pada: new Date(sekarang + 18 * jam).toISOString(),
    dibuat_pada: new Date(sekarang - 5 * jam).toISOString(),
  };
  const pembayaranMenunggu: Pembayaran = {
    id: "00000000-0000-4000-f100-000000000002",
    booking_id: bookingMenungguVerif.id,
    bukti_path: `${bookingMenungguVerif.id}/transfer-contoh.jpg`,
    diunggah_pada: new Date(sekarang - 3 * jam).toISOString(),
    status: "menunggu",
    alasan_penolakan: null,
    diverifikasi_oleh: null,
    diverifikasi_pada: null,
  };

  // Booking terkonfirmasi untuk kelas-kelas yang diajar Nadia Putri (untuk demo form laporan, halaman sesi, & rapor).
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
    status: "selesai",
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

  // 1) Coding Dasar Level 1 (a000-...0001): Sesi 1 selesai (berlaporan), Sesi 2 sedang berlangsung (Masuk kelas aktif!).
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

  // 3) Simulasi Jurusan IT Level 1 (a000-...0006): Sesi 1–4 selesai dengan 1 contoh rapor jurusan (masih bisa diedit pengajar 24 jam).
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
      status: "selesai",
      bisa_masuk_kelas: false,
    },
  ];

  const laporanContohId = "00000000-0000-4000-b200-000000000101";
  const laporanSim4Id = "00000000-0000-4000-b200-000000000604";
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
    {
      id: laporanSim4Id,
      sesi_id: sesiSimulasi[3].id,
      pengajar_id: PENGAJAR_VERIFIED,
      ringkasan: "Integrasi AI sederhana dengan notebook klasifikasi teks dan refleksi proyek lintas bidang.",
      rekaman_url: null,
      kendala: null,
      dikirim_pada: new Date(sekarang - 2 * jam).toISOString(),
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
    {
      id: "00000000-0000-4000-b300-000000000601",
      laporan_sesi_id: "00000000-0000-4000-b200-000000000601",
      siswa_id: "00000000-0000-4000-d000-000000000002",
      hadir: true,
      catatan: "Raka cepat memecah alur fitur halaman dan menemukan bug formulir dengan tepat.",
      karya_url: "https://codesandbox.io/",
    },
    {
      id: "00000000-0000-4000-b300-000000000602",
      laporan_sesi_id: "00000000-0000-4000-b200-000000000602",
      siswa_id: "00000000-0000-4000-d000-000000000002",
      hadir: true,
      catatan: "Raka memahami alur IP dan subnetting dasar dengan baik.",
      karya_url: null,
    },
    {
      id: "00000000-0000-4000-b300-000000000603",
      laporan_sesi_id: "00000000-0000-4000-b200-000000000603",
      siswa_id: "00000000-0000-4000-d000-000000000002",
      hadir: true,
      catatan: "Raka berhasil memprogram logika sensor jarak LED otomatis di Wokwi.",
      karya_url: "https://wokwi.com/",
    },
    {
      id: "00000000-0000-4000-b300-000000000604",
      laporan_sesi_id: laporanSim4Id,
      siswa_id: "00000000-0000-4000-d000-000000000002",
      hadir: true,
      catatan: "Raka sangat menonjol saat merancang alur integrasi aplikasi dan menguji kasus tepi model AI.",
      karya_url: "https://colab.research.google.com/",
    },
  ];

  const raporJurusan: RaporJurusan[] = [
    {
      id: "00000000-0000-4000-b600-000000000001",
      sesi_id: sesiSimulasi[3].id,
      siswa_id: "00000000-0000-4000-d000-000000000002",
      skor_software: 5,
      skor_jaringan: 3,
      skor_iot: 4,
      skor_ai_data: 4,
      bidang_rekomendasi: "software",
      alasan:
        "Selama 4 sesi Simulasi Jurusan IT, Raka paling menonjol dalam menyusun logika program, debugging alur aplikasi, dan mengintegrasikan fitur baru dengan rapi.",
      saran: "Lanjutkan ke Kelas Reguler Teknologi untuk memperdalam proyek web dan basis data sebelum memilih jurusan.",
      dibuat_pada: new Date(sekarang - 2 * jam).toISOString(),
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
    {
      id: "00000000-0000-4000-b400-000000000005",
      pengajar_id: PENGAJAR_VERIFIED,
      sesi_id: sesiSimulasi[3].id,
      jumlah: 75_000,
      status: "belum_dibayar",
      dibayar_pada: null,
      dibayar_oleh: null,
    },
  ];

  const notifikasi: Notifikasi[] = [
    {
      id: "00000000-0000-4000-b700-000000000001",
      pengguna_id: ORTU,
      tipe: "laporan_dikirim",
      judul: "Laporan baru dari Kak Nadia",
      isi: "Laporan dan rapor jurusan Raka untuk Simulasi Jurusan IT Sesi 4 sudah tersedia.",
      tautan: `/orang-tua/sesi/${sesiSimulasi[3].id}`,
      dibaca_pada: null,
      dibuat_pada: new Date(sekarang - 2 * jam).toISOString(),
    },
    {
      id: "00000000-0000-4000-b700-000000000002",
      pengguna_id: ORTU,
      tipe: "pengingat",
      judul: "Sesi Coding Dasar Level 1 sedang berlangsung",
      isi: "Dinda bisa masuk ke ruang Google Meet dari halaman sesi.",
      tautan: `/orang-tua/sesi/${sesiCoding[1].id}`,
      dibaca_pada: null,
      dibuat_pada: new Date(sekarang - 20 * menit).toISOString(),
    },
    {
      id: "00000000-0000-4000-b700-000000000003",
      pengguna_id: SISWA_RAKA,
      tipe: "laporan_dikirim",
      judul: "Laporan & rapor sesi ke-4 tersedia",
      isi: "Kak Nadia telah mengirim laporan Simulasi Jurusan IT Sesi 4 dan rapor rekomendasi jurusanmu.",
      tautan: `/siswa/sesi/${sesiSimulasi[3].id}`,
      dibaca_pada: null,
      dibuat_pada: new Date(sekarang - 2 * jam).toISOString(),
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
        pengguna_id: SISWA_RAKA,
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
        dikerjakan_oleh: SISWA_RAKA,
        jawaban: {},
        skor: { software: 38, jaringan: 15, iot: 20, ai_data: 27 },
        bidang_teratas: "software",
        dibuat_pada: "2026-11-17T08:00:00.000Z",
      },
    ],
    status: {},
    profilPengguna: {},
    booking: [bookingContoh, bookingDinda, bookingBima, bookingRakaSimulasi, bookingRakaReguler, bookingMenungguVerif],
    pembayaran: [pembayaranDitolak, pembayaranMenunggu],
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
        cv_url: "https://contoh.id/cv-yoga",
        foto_path: null,
        identitas_path: `${PENGAJAR_BARU}/ktp-yoga.jpg`,
        skck_path: `${PENGAJAR_BARU}/skck-yoga.pdf`,
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
    raporJurusan,
    honor,
    rating: [],
    laporanMasalah: [
      {
        id: "00000000-0000-4000-b800-000000000001",
        pelapor_id: ORTU,
        sesi_id: sesiCoding[0].id,
        pengajar_id: PENGAJAR_VERIFIED,
        kategori: "masalah_teknis",
        deskripsi: "Suara mikrofon sempat terputus 3 menit di awal sesi sebelum kembali normal.",
        prioritas: "normal",
        status: "baru",
        dibuat_pada: new Date(sekarang - 5 * jam).toISOString(),
      },
      {
        id: "00000000-0000-4000-b800-000000000002",
        pelapor_id: SISWA_RAKA,
        sesi_id: null,
        pengajar_id: PENGAJAR_VERIFIED,
        kategori: "perilaku_tidak_pantas",
        deskripsi: "Contoh laporan prioritas tinggi untuk menguji urutan paling atas di antrean admin.",
        prioritas: "tinggi",
        status: "baru",
        dibuat_pada: new Date(sekarang - 1 * jam).toISOString(),
      },
    ],
    notifikasi,
    pengaturan: {
      nama_bank: "Bank Contoh",
      nomor_rekening: "1234 5678 90",
      nama_pemilik_rekening: "Kodie (contoh)",
      qris_path: null,
    },
    programOverride: {},
    sesiTanpaMeetIds: [sesiReguler[3].id],
    logAdmin: [
      {
        id: "00000000-0000-4000-b900-000000000001",
        admin_id: ADMIN_MOCK,
        aksi: "setujui_pengajar",
        target_tipe: "pengajar",
        target_id: PENGAJAR_VERIFIED,
        detail: { catatan: "Verifikasi awal pengajar contoh" },
        dibuat_pada: "2026-11-02T09:00:00.000Z",
      },
      {
        id: "00000000-0000-4000-b900-000000000002",
        admin_id: ADMIN_MOCK,
        aksi: "tolak_pembayaran",
        target_tipe: "pembayaran",
        target_id: pembayaranDitolak.id,
        detail: { alasan: pembayaranDitolak.alasan_penolakan },
        dibuat_pada: new Date(sekarang - 4 * jam).toISOString(),
      },
    ],
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
    g.__kodieMock.sesi === undefined ||
    g.__kodieMock.notifikasi === undefined ||
    g.__kodieMock.pengaturan === undefined
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
    g.__kodieMock.rating ??= isi.rating;
    g.__kodieMock.laporanMasalah ??= isi.laporanMasalah;
    g.__kodieMock.notifikasi ??= isi.notifikasi;
    g.__kodieMock.pengaturan ??= isi.pengaturan;
    g.__kodieMock.programOverride ??= isi.programOverride;
    g.__kodieMock.sesiTanpaMeetIds ??= isi.sesiTanpaMeetIds;
    g.__kodieMock.logAdmin ??= isi.logAdmin;
  }
  return g.__kodieMock;
}
