import { describe, expect, it } from "vitest";
import { alasanTidakCocok, kelompokBooking, kodeBooking, statusEfektif } from "./booking";
import { cekBukti, ekstensiBukti, formatUkuran } from "./validasi/bukti";
import { pesanError } from "./errors";

describe("cekBukti", () => {
  it("menerima JPG, PNG, dan PDF sampai 2 MB", () => {
    expect(cekBukti({ name: "a.jpg", size: 600_000, type: "image/jpeg" })).toBeNull();
    expect(cekBukti({ name: "a.png", size: 2 * 1024 * 1024, type: "image/png" })).toBeNull();
    expect(cekBukti({ name: "a.pdf", size: 10_000, type: "application/pdf" })).toBeNull();
  });

  it("menolak format lain dan file di atas 2 MB", () => {
    expect(cekBukti({ name: "a.heic", size: 10_000, type: "image/heic" })).toBe("Format file harus JPG, PNG, atau PDF.");
    expect(cekBukti({ name: "a.jpg", size: 2 * 1024 * 1024 + 1, type: "image/jpeg" })).toContain("lebih dari 2 MB");
    expect(cekBukti({ name: "a.jpg", size: 0, type: "image/jpeg" })).toContain("kosong");
  });

  it("ekstensi dan ukuran untuk tampilan", () => {
    expect(ekstensiBukti({ name: "Bukti.JPEG", type: "" })).toBe("jpg");
    expect(ekstensiBukti({ name: "x", type: "application/pdf" })).toBe("pdf");
    expect(formatUkuran(640 * 1024)).toBe("640 KB");
    expect(formatUkuran(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });
});

describe("booking", () => {
  it("booking menunggu pembayaran yang lewat batas dianggap kedaluwarsa", () => {
    const sekarang = new Date("2026-11-24T12:00:00Z");
    expect(statusEfektif({ status: "menunggu_pembayaran", batas_bayar_pada: "2026-11-24T11:59:00Z" }, sekarang)).toBe("kedaluwarsa");
    expect(statusEfektif({ status: "menunggu_pembayaran", batas_bayar_pada: "2026-11-24T13:00:00Z" }, sekarang)).toBe("menunggu_pembayaran");
    expect(statusEfektif({ status: "menunggu_verifikasi", batas_bayar_pada: "2026-11-24T11:00:00Z" }, sekarang)).toBe("menunggu_verifikasi");
  });

  it("kode booking memakai tanggal WIB", () => {
    expect(kodeBooking(new Date("2026-11-23T18:30:00Z"), 7)).toBe("BK-20261124-0007");
  });

  it("mengelompokkan status untuk daftar booking", () => {
    expect(kelompokBooking("menunggu_pembayaran")).toBe("perlu_dibayar");
    expect(kelompokBooking("dibatalkan")).toBe("riwayat");
  });

  it("menyaring siswa sesuai jenjang dan kelas program", () => {
    const coding = { nama: "Coding Dasar", jenjang: ["SD" as const], kelas_min: 5, kelas_maks: 6 };
    expect(alasanTidakCocok({ jenjang: "SD", kelas: 5 }, coding)).toBeNull();
    expect(alasanTidakCocok({ jenjang: "SD", kelas: 3 }, coding)).toBe("Coding Dasar untuk kelas 5–6.");
    expect(alasanTidakCocok({ jenjang: "SMP", kelas: 7 }, coding)).not.toBeNull();
  });

  it("galat booking dipetakan ke bahasa Indonesia", () => {
    expect(pesanError(new Error("BOOKING_GANDA"))).toBe("Siswa ini sudah punya pesanan aktif di kelas yang sama.");
  });
});
