import { describe, expect, it } from "vitest";
import { alasanMudahDitebak, nilaiPassword } from "./password";

describe("nilaiPassword", () => {
  it("memberi tahu kekurangan panjang", () => {
    expect(nilaiPassword("")).toEqual({ tingkat: "kosong", pesan: "Minimal 8 karakter." });
    expect(nilaiPassword("abc12")).toEqual({ tingkat: "pendek", pesan: "Tambah 3 karakter lagi (minimal 8)." });
  });

  it("menandai password yang mudah ditebak", () => {
    expect(nilaiPassword("password123").tingkat).toBe("lemah");
    expect(nilaiPassword("87654321").tingkat).toBe("lemah");
    expect(nilaiPassword("qwerty123").tingkat).toBe("lemah");
  });

  it("membedakan sedang dan kuat", () => {
    expect(nilaiPassword("belajarkode").tingkat).toBe("sedang");
    expect(nilaiPassword("Belajar#Kode26").tingkat).toBe("kuat");
  });

  it("tidak menandai password acak sebagai mudah ditebak", () => {
    expect(alasanMudahDitebak("Kucing-Biru-77")).toBeNull();
  });
});
