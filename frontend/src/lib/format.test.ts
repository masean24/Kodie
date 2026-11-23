import { describe, expect, it } from "vitest";
import { formatJamTeks, formatRupiah, formatTanggalJam } from "./format";
import { pesanError, PESAN_UMUM } from "./errors";

describe("format", () => {
  it("menampilkan waktu UTC dalam WIB", () => {
    expect(formatTanggalJam("2026-11-24T12:00:00Z")).toBe("Selasa, 24 November 2026, 19.00 WIB");
    expect(formatTanggalJam("2026-11-23T12:00:00Z")).toBe("Senin, 23 November 2026, 19.00 WIB");
  });

  it("pindah hari jika WIB sudah lewat tengah malam", () => {
    expect(formatTanggalJam("2026-11-23T18:30:00Z")).toBe("Selasa, 24 November 2026, 01.30 WIB");
  });

  it("format rupiah tanpa spasi dan desimal", () => {
    expect(formatRupiah(275000)).toBe("Rp275.000");
    expect(formatRupiah(1200000)).toBe("Rp1.200.000");
  });

  it("format jam dari kolom time", () => {
    expect(formatJamTeks("09:00:00")).toBe("09.00");
  });
});

describe("pesanError", () => {
  it("memetakan kode dan tidak membocorkan pesan mentah", () => {
    expect(pesanError(new Error("KELAS_PENUH"))).toBe("Maaf, kursi di kelas ini sudah habis.");
    expect(pesanError(new Error("duplicate key value violates unique constraint"))).toBe(PESAN_UMUM);
  });
});
