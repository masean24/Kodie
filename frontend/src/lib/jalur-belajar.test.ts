import { describe, expect, it } from "vitest";
import { JALUR_BELAJAR, langkahBerikutnya } from "./jalur-belajar";
import { hitungHonorPerSesi, hitungPotongan, buatKodeAcak, kodeValid } from "./referral";

describe("langkahBerikutnya", () => {
  it("naik ke level berikutnya di program yang sama", () => {
    expect(langkahBerikutnya({ slug: "coding-dasar", level: 1 }, { jenjang: "SD", kelas: 5 })).toMatchObject({
      slug: "coding-dasar",
      level: 2,
    });
  });

  it("pindah program saat level terakhir selesai dan jenjang cocok", () => {
    expect(langkahBerikutnya({ slug: "coding-dasar", level: 3 }, { jenjang: "SMP", kelas: 7 })).toMatchObject({
      slug: "kelas-reguler-teknologi",
      level: 1,
    });
    expect(langkahBerikutnya({ slug: "kelas-reguler-teknologi", level: 5 }, { jenjang: "SMA", kelas: 10 })).toMatchObject({
      slug: "simulasi-jurusan-it",
    });
  });

  it("tidak menyarankan paket yang belum sesuai umur", () => {
    expect(langkahBerikutnya({ slug: "kenal-komputer", level: 2 }, { jenjang: "SD", kelas: 2 })).toBeNull();
    expect(langkahBerikutnya({ slug: "coding-dasar", level: 3 }, { jenjang: "SD", kelas: 6 })).toBeNull();
  });

  it("setelah Simulasi Jurusan IT, ikut bidang rapor", () => {
    expect(langkahBerikutnya({ slug: "simulasi-jurusan-it", level: 1 }, { jenjang: "SMA", kelas: 11 }, "iot")).toMatchObject({
      slug: "kelas-reguler-teknologi",
      level: 4,
    });
  });

  it("level tiap tahap berurutan mulai 1", () => {
    for (const t of JALUR_BELAJAR) t.level.forEach((l, i) => expect(l.level).toBe(i + 1));
  });
});

describe("bagi hasil dan referral", () => {
  it("30% per siswa dibagi 4 sesi, referral 40%", () => {
    expect(hitungHonorPerSesi([{ total: 400_000, pakaiReferral: false }], 4)).toBe(30_000);
    expect(hitungHonorPerSesi([{ total: 380_000, pakaiReferral: true }], 4)).toBe(38_000);
    expect(hitungHonorPerSesi([], 4)).toBe(0);
  });

  it("potongan 5% dan format kode", () => {
    expect(hitungPotongan(350_000)).toBe(17_500);
    expect(kodeValid("nadia-k7q2")).toBe(true);
    expect(kodeValid("ab")).toBe(false);
    expect(buatKodeAcak("Nadia Putri", () => 0)).toBe("NADIA-AAAA");
  });
});
