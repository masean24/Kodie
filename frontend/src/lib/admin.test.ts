import { describe, expect, it } from "vitest";
import {
  bolehSetujuiPengajar,
  formatLamaMenunggu,
  hitungStatistikPlatform,
  persenKonversiTrial,
  urutkanAntreanWaktu,
  urutkanLaporanMasalah,
} from "./admin";
import { cekFileQris, skemaAlasanAdmin, skemaSetujuiPengajar, skemaUbahProgram } from "./validasi/admin";

describe("logika antrean & prioritas admin", () => {
  it("hanya mengizinkan setujui pengajar jika KTP/KTM, SKCK, wawancara, dan program lengkap", () => {
    expect(bolehSetujuiPengajar(null, 1)).toBe(false);
    expect(
      bolehSetujuiPengajar({ identitas_path: "a.jpg", skck_path: "b.pdf", wawancara_selesai: false }, 1),
    ).toBe(false);
    expect(
      bolehSetujuiPengajar({ identitas_path: "a.jpg", skck_path: null, wawancara_selesai: true }, 1),
    ).toBe(false);
    expect(
      bolehSetujuiPengajar({ identitas_path: "a.jpg", skck_path: "b.pdf", wawancara_selesai: true }, 0),
    ).toBe(false);
    expect(
      bolehSetujuiPengajar({ identitas_path: "a.jpg", skck_path: "b.pdf", wawancara_selesai: true }, 1),
    ).toBe(true);
  });

  it("mengurutkan antrean dari yang paling lama menunggu secara default", () => {
    const daftar = [
      { id: "baru", waktu: "2026-11-23T12:00:00Z" },
      { id: "lama", waktu: "2026-11-23T08:00:00Z" },
    ];
    expect(urutkanAntreanWaktu(daftar, (x) => x.waktu, "terlama").map((x) => x.id)).toEqual(["lama", "baru"]);
    expect(urutkanAntreanWaktu(daftar, (x) => x.waktu, "terbaru").map((x) => x.id)).toEqual(["baru", "lama"]);
  });

  it("menempatkan perilaku tidak pantas (prioritas tinggi) paling atas", () => {
    const daftar = [
      { id: "teknis", kategori: "masalah_teknis" as const, prioritas: "normal" as const, dibuat_pada: "2026-11-23T07:00:00Z" },
      { id: "perilaku", kategori: "perilaku_tidak_pantas" as const, prioritas: "tinggi" as const, dibuat_pada: "2026-11-23T11:00:00Z" },
      { id: "absen", kategori: "pengajar_tidak_hadir" as const, prioritas: "normal" as const, dibuat_pada: "2026-11-23T09:00:00Z" },
    ];
    expect(urutkanLaporanMasalah(daftar, "terlama").map((x) => x.id)).toEqual(["perilaku", "teknis", "absen"]);
  });

  it("memformat durasi menunggu dalam menit, jam, atau hari", () => {
    const sekarang = new Date("2026-11-23T12:00:00Z");
    expect(formatLamaMenunggu("2026-11-23T11:20:00Z", sekarang)).toBe("Menunggu 40 menit");
    expect(formatLamaMenunggu("2026-11-23T09:00:00Z", sekarang)).toBe("Menunggu 3 jam");
    expect(formatLamaMenunggu("2026-11-21T12:00:00Z", sekarang)).toBe("Menunggu 2 hari");
  });
});

describe("validasi input admin", () => {
  it("memvalidasi gambar QRIS (JPG/PNG <= 1 MB)", () => {
    expect(cekFileQris({ name: "qris.png", size: 400_000, type: "image/png" })).toBeNull();
    expect(cekFileQris({ name: "qris.pdf", size: 400_000, type: "application/pdf" })).toContain("JPG atau PNG");
    expect(cekFileQris({ name: "qris.png", size: 1_200_000, type: "image/png" })).toContain("1 MB");
  });

  it("mewajibkan alasan penolakan, program pengajar, dan angka program valid", () => {
    expect(skemaAlasanAdmin.safeParse({ alasan: "ok" }).success).toBe(false);
    expect(skemaAlasanAdmin.safeParse({ alasan: "Nominal bukti transfer kurang." }).success).toBe(true);
    expect(skemaSetujuiPengajar.safeParse({ pengajar_id: "p1", program_ids: [] }).success).toBe(false);
    expect(
      skemaUbahProgram.safeParse({
        harga_paket: 275000,
        durasi_menit: 90,
        jumlah_sesi: 4,
        honor_per_sesi: 65000,
        aktif: true,
      }).success,
    ).toBe(true);
  });
});

describe("statistik platform dashboard admin", () => {
  it("menghitung rincian pengguna, bagi hasil 30%/40%, dan konversi trial dengan akurat", () => {
    const stat = hitungStatistikPlatform({
      pengguna: [
        { id: "admin1", peran: "admin", status: "aktif", nama: "Admin" },
        { id: "ortu1", peran: "orang_tua", status: "aktif", nama: "Ratna" },
        { id: "ortuNonaktif", peran: "orang_tua", status: "nonaktif", nama: "Nonaktif" },
        { id: "siswa1", peran: "siswa", status: "aktif", nama: "Fajar" },
        { id: "siswa2", peran: "siswa", status: "menunggu_persetujuan", nama: "Laras" },
        { id: "pg1", peran: "pengajar", status: "terverifikasi", nama: "Bagus" },
        { id: "pg2", peran: "pengajar", status: "menunggu_verifikasi", nama: "Dimas" },
      ],
      siswa: [
        { id: "sw1", nama: "Bima", jenjang: "SD", kelas: 5, pengguna_id: null },
        { id: "sw2", nama: "Fajar", jenjang: "SMA", kelas: 11, pengguna_id: "siswa1" },
        { id: "sw3", nama: "Laras", jenjang: "SMP", kelas: 9, pengguna_id: "siswa2" },
      ],
      kelas: [
        {
          id: "k1",
          pengajar_id: "pg1",
          pengajar_nama: "Bagus",
          program_nama: "Kelas Reguler Teknologi",
          program_slug: "kelas-reguler-teknologi",
          level: 1,
        },
      ],
      sesi: [
        {
          kelas_id: "k1",
          nomor: 1,
          mulai_pada: "2026-12-01T12:00:00.000Z",
          status: "terjadwal",
        },
      ],
      kodeReferral: [{ pengajar_id: "pg1", kode: "BAGUS-M4P9" }],
      honor: [
        { jumlah: 60_000, status: "belum_dibayar" },
        { jumlah: 90_000, status: "dibayar" },
      ],
      booking: [
        {
          id: "b-trial-1",
          kode: "BK-TRIAL-1",
          kelas_id: "k1",
          siswa_id: "sw1",
          dibuat_oleh: "ortu1",
          status: "selesai",
          jenis: "trial",
          kode_referral: null,
          potongan: 0,
          total: 0,
          dibuat_pada: "2026-11-10T10:00:00.000Z",
        },
        {
          id: "b-trial-2",
          kode: "BK-TRIAL-2",
          kelas_id: "k1",
          siswa_id: "sw2",
          dibuat_oleh: "siswa1",
          status: "terkonfirmasi",
          jenis: "trial",
          kode_referral: null,
          potongan: 0,
          total: 0,
          dibuat_pada: "2026-11-27T10:00:00.000Z",
        },
        {
          id: "b-trial-batal",
          kode: "BK-TRIAL-BATAL",
          kelas_id: "k1",
          siswa_id: "sw3",
          dibuat_oleh: "ortu1",
          status: "dibatalkan",
          jenis: "trial",
          kode_referral: null,
          potongan: 0,
          total: 0,
          dibuat_pada: "2026-11-28T10:00:00.000Z",
        },
        {
          id: "b-paket-ref",
          kode: "BK-PAKET-1",
          kelas_id: "k1",
          siswa_id: "sw1",
          dibuat_oleh: "ortu1",
          status: "terkonfirmasi",
          jenis: "paket",
          kode_referral: "BAGUS-M4P9",
          potongan: 17_500,
          total: 332_500,
          dibuat_pada: "2026-11-20T10:00:00.000Z",
        },
        {
          id: "b-paket-biasa",
          kode: "BK-PAKET-2",
          kelas_id: "k1",
          siswa_id: "sw3",
          dibuat_oleh: "ortu1",
          status: "selesai",
          jenis: "paket",
          kode_referral: null,
          potongan: 0,
          total: 250_000,
          dibuat_pada: "2026-11-21T10:00:00.000Z",
        },
      ],
    });

    expect(stat.pengguna).toEqual({
      total: 5,
      orang_tua: 1,
      siswa_mandiri: 2,
      pengajar_terverifikasi: 1,
      pengajar_menunggu: 1,
      profil_siswa: 2,
    });
    // 332.500 * 40% = 133.000; 250.000 * 30% = 75.000 -> total pengajar = 208.000; platform = 582.500 - 208.000 = 374.500
    expect(stat.pendapatan).toEqual({
      omzet_kotor: 582_500,
      bagian_pengajar: 208_000,
      pendapatan_bersih_platform: 374_500,
      honor_tercatat: 150_000,
      honor_dibayar: 90_000,
      booking_lunas: 2,
      booking_referral: 1,
      total_potongan_referral: 17_500,
    });
    expect(stat.trial.total).toBe(2);
    expect(stat.trial.aktif).toBe(1);
    expect(stat.trial.selesai).toBe(1);
    expect(stat.trial.konversi_paket).toBe(1);
    expect(stat.trial.daftar_terbaru.map((d) => d.kode)).toEqual(["BK-TRIAL-2", "BK-TRIAL-1"]);
    expect(stat.trial.daftar_terbaru[0]?.sudah_lanjut_paket).toBe(false);
    expect(stat.trial.daftar_terbaru[1]?.sudah_lanjut_paket).toBe(true);
    expect(persenKonversiTrial(stat.trial.konversi_paket, stat.trial.total)).toBe(50);
    expect(persenKonversiTrial(0, 0)).toBe(0);
  });
});
