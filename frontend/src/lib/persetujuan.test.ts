import { describe, expect, it } from "vitest";
import { linkPersetujuan, pesanPersetujuan, tautanWhatsApp } from "./persetujuan";
import { skemaAnak } from "./validasi/anak";
import { pesanError } from "./errors";

describe("persetujuan", () => {
  it("membuat link tanpa garis miring ganda", () => {
    expect(linkPersetujuan("https://kodie.id/", "abc123")).toBe("https://kodie.id/persetujuan/abc123");
  });

  it("pesan WhatsApp memuat nama, link, dan batas waktu WIB", () => {
    const pesan = pesanPersetujuan("Laras", "https://kodie.id/persetujuan/x", "2026-11-30T10:00:00Z");
    expect(pesan).toContain("Laras");
    expect(pesan).toContain("https://kodie.id/persetujuan/x");
    expect(pesan).toContain("Senin, 30 November 2026");
  });

  it("tautan wa.me meng-encode pesan", () => {
    expect(tautanWhatsApp("a b&c")).toBe("https://wa.me/?text=a%20b%26c");
  });

  it("token tidak berlaku dipetakan ke pesan PRD", () => {
    expect(pesanError(new Error("TOKEN_TIDAK_BERLAKU"))).toBe("Link tidak berlaku.");
  });
});

describe("skemaAnak", () => {
  const dasar = { nama: "Dinda Pratama", tanggal_lahir: "2016-02-11", sekolah: "" };

  it("menerima kelas sesuai jenjang, termasuk SD", () => {
    expect(skemaAnak.safeParse({ ...dasar, jenjang: "SD", kelas: "5" }).success).toBe(true);
    expect(skemaAnak.safeParse({ ...dasar, jenjang: "SMP", kelas: "9" }).success).toBe(true);
  });

  it("menolak kelas yang tidak sesuai jenjang", () => {
    expect(skemaAnak.safeParse({ ...dasar, jenjang: "SD", kelas: "8" }).success).toBe(false);
    expect(skemaAnak.safeParse({ ...dasar, jenjang: "SMA", kelas: "9" }).success).toBe(false);
  });
});
