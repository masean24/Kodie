import { describe, expect, it } from "vitest";
import {
  apakahLaporanBaru,
  bisaBeriRating,
  hitungRataRating,
  jumlahBelumDibaca,
  prioritasMasalah,
  skorPengajarKePersen,
} from "./sesi";
import { skemaLaporanMasalah, skemaRating } from "./validasi/sesi";

describe("aturan sesi, rating, laporan masalah, dan notifikasi", () => {
  it("menetapkan prioritas tinggi otomatis untuk perilaku tidak pantas", () => {
    expect(prioritasMasalah("perilaku_tidak_pantas")).toBe("tinggi");
    expect(prioritasMasalah("masalah_teknis")).toBe("normal");
    expect(prioritasMasalah("pengajar_tidak_hadir")).toBe("normal");
  });

  it("rating hanya boleh setelah laporan dikirim dan belum pernah dinilai", () => {
    expect(bisaBeriRating(false, false)).toBe(false);
    expect(bisaBeriRating(true, false)).toBe(true);
    expect(bisaBeriRating(true, true)).toBe(false);
  });

  it("rata-rata rating baru muncul setelah minimal 3 rating", () => {
    expect(hitungRataRating([5, 4])).toEqual({ jumlah: 2, rataRata: null });
    expect(hitungRataRating([5, 4, 5])).toEqual({ jumlah: 3, rataRata: 4.7 });
  });

  it("menandai laporan baru dalam 48 jam", () => {
    const sekarang = new Date("2026-11-23T12:00:00.000Z");
    expect(apakahLaporanBaru("2026-11-22T12:00:00.000Z", sekarang)).toBe(true);
    expect(apakahLaporanBaru("2026-11-21T11:59:00.000Z", sekarang)).toBe(false);
  });

  it("menghitung notifikasi belum dibaca dan konversi skor rapor", () => {
    expect(jumlahBelumDibaca([{ dibaca_pada: null }, { dibaca_pada: "2026-11-23T10:00:00Z" }, { dibaca_pada: null }])).toBe(2);
    expect(skorPengajarKePersen(5)).toBe(100);
    expect(skorPengajarKePersen(3)).toBe(60);
  });
});

describe("validasi rating & laporan masalah", () => {
  it("memvalidasi bintang 1-5 dan komentar maks 300 karakter", () => {
    expect(skemaRating.safeParse({ sesi_id: "s1", siswa_id: "a1", bintang: 5, komentar: "Bagus" }).success).toBe(true);
    expect(skemaRating.safeParse({ sesi_id: "s1", siswa_id: "a1", bintang: 0 }).success).toBe(false);
    expect(skemaRating.safeParse({ sesi_id: "s1", siswa_id: "a1", bintang: 6 }).success).toBe(false);
    expect(skemaRating.safeParse({ sesi_id: "s1", siswa_id: "a1", bintang: 4, komentar: "x".repeat(301) }).success).toBe(false);
  });

  it("mewajibkan kategori dan deskripsi minimal 10 karakter pada laporan masalah", () => {
    expect(
      skemaLaporanMasalah.safeParse({
        sesi_id: null,
        pengajar_id: "p1",
        kategori: "masalah_teknis",
        deskripsi: "Audio terputus terus saat kelas berlangsung.",
      }).success,
    ).toBe(true);
    expect(
      skemaLaporanMasalah.safeParse({
        pengajar_id: "p1",
        kategori: "lainnya",
        deskripsi: "pendek",
      }).success,
    ).toBe(false);
  });
});
