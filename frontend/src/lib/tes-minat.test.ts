import { describe, expect, it } from "vitest";
import type { JawabanMinat } from "@/types/database";
import { soalMinatMock } from "@/lib/mock/data";
import {
  bidangTeratas,
  hitungPersentase,
  hitungSkorMentah,
  rekomendasiProgram,
  semuaTerjawab,
} from "./tes-minat";

const semua = (kode: "A" | "B" | "C" | "D"): JawabanMinat =>
  Object.fromEntries(soalMinatMock.map((s) => [String(s.urutan), kode]));

describe("hitungPersentase", () => {
  it("membulatkan skor ÷ total × 100", () => {
    expect(hitungPersentase({ software: 1, jaringan: 1, iot: 1, ai_data: 0 })).toEqual({
      software: 33,
      jaringan: 33,
      iot: 33,
      ai_data: 0,
    });
    expect(hitungPersentase({ software: 3, jaringan: 1, iot: 0, ai_data: 4 })).toEqual({
      software: 38,
      jaringan: 13,
      iot: 0,
      ai_data: 50,
    });
  });

  it("mengembalikan nol semua jika total 0", () => {
    expect(hitungPersentase({ software: 0, jaringan: 0, iot: 0, ai_data: 0 })).toEqual({
      software: 0,
      jaringan: 0,
      iot: 0,
      ai_data: 0,
    });
  });
});

describe("bidangTeratas", () => {
  it("memilih skor tertinggi", () => {
    expect(bidangTeratas({ software: 2, jaringan: 5, iot: 1, ai_data: 4 })).toBe("jaringan");
  });

  it("memecah seri dengan urutan Software > Jaringan > IoT > AI & Data", () => {
    expect(bidangTeratas({ software: 5, jaringan: 5, iot: 5, ai_data: 5 })).toBe("software");
    expect(bidangTeratas({ software: 1, jaringan: 4, iot: 4, ai_data: 4 })).toBe("jaringan");
    expect(bidangTeratas({ software: 1, jaringan: 2, iot: 4, ai_data: 4 })).toBe("iot");
  });
});

describe("hitungSkorMentah dengan soal mock", () => {
  it("semua jawaban D mengarah ke AI & Data", () => {
    const mentah = hitungSkorMentah(soalMinatMock, semua("D"));
    expect(bidangTeratas(mentah)).toBe("ai_data");
    expect(mentah.ai_data).toBe(36);
  });

  it("semua jawaban A mengarah ke Software", () => {
    expect(bidangTeratas(hitungSkorMentah(soalMinatMock, semua("A")))).toBe("software");
  });
});

describe("semuaTerjawab", () => {
  it("menolak jawaban yang belum lengkap", () => {
    const jawaban = semua("A");
    delete jawaban["7"];
    expect(semuaTerjawab(12, jawaban)).toBe(false);
    expect(semuaTerjawab(12, semua("B"))).toBe(true);
  });
});

describe("rekomendasiProgram", () => {
  it("mengikuti tabel jenjang PRD F4", () => {
    expect(rekomendasiProgram("SD", 5)).toEqual(["coding-dasar"]);
    expect(rekomendasiProgram("SMP", 8)).toEqual(["kelas-reguler-teknologi"]);
    expect(rekomendasiProgram("SMP", 9)).toEqual(["simulasi-jurusan-it", "kelas-reguler-teknologi"]);
    expect(rekomendasiProgram("SMA", 11)).toEqual(["simulasi-jurusan-it", "kelas-reguler-teknologi"]);
  });
});
