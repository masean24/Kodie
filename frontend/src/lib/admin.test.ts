import { describe, expect, it } from "vitest";
import {
  bolehSetujuiPengajar,
  formatLamaMenunggu,
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
