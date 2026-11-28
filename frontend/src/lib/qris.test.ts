import { describe, expect, it } from "vitest";
import { buatQrisDinamis, hitungCrc16Ccitt, uraiQrisStatis } from "./qris";

const SAMPLE_QRIS_STATIS =
  "00020101021126610014COM.GO-JEK.WWW01189360091435703761450210G5703761450303UMI51440014ID.CO.QRIS.WWW0215ID10254267724100303UMI5204899953033605802ID5923Dobi, Digital & Kreatif6009TANGERANG61051515162070703A0163045224";

describe("EMVCo QRIS helper", () => {
  it("menghitung CRC-16/CCITT-FALSE sesuai standar payload QRIS nyata", () => {
    expect(hitungCrc16Ccitt(SAMPLE_QRIS_STATIS.slice(0, -4))).toBe("5224");
  });

  it("memvalidasi QRIS statis dan membaca nama serta kota merchant", () => {
    expect(uraiQrisStatis(SAMPLE_QRIS_STATIS)).toEqual({
      valid: true,
      merchantNama: "Dobi, Digital & Kreatif",
      merchantKota: "TANGERANG",
    });

    expect(uraiQrisStatis(`${SAMPLE_QRIS_STATIS.slice(0, -4)}0000`).valid).toBe(false);
    expect(uraiQrisStatis("https://contoh.id/qris").valid).toBe(false);
    expect(uraiQrisStatis(null).valid).toBe(false);
  });

  it("mengubah QRIS statis menjadi dinamis ber-nominal tepat dengan CRC valid", () => {
    const qris380k = buatQrisDinamis(SAMPLE_QRIS_STATIS, 380_000);
    expect(qris380k).not.toBeNull();
    expect(qris380k!).toContain("000201010212");
    expect(qris380k!).toContain("530336054063800005802ID");
    expect(uraiQrisStatis(qris380k)).toEqual({
      valid: true,
      merchantNama: "Dobi, Digital & Kreatif",
      merchantKota: "TANGERANG",
    });

    const qrisReferral = buatQrisDinamis(SAMPLE_QRIS_STATIS, 332_500);
    expect(qrisReferral).not.toBeNull();
    expect(qrisReferral!).toContain("5406332500");
    expect(uraiQrisStatis(qrisReferral).valid).toBe(true);
  });

  it("menolak nominal nol/negatif atau payload invalid", () => {
    expect(buatQrisDinamis(SAMPLE_QRIS_STATIS, 0)).toBeNull();
    expect(buatQrisDinamis(SAMPLE_QRIS_STATIS, -50_000)).toBeNull();
    expect(buatQrisDinamis("bukan-qris", 250_000)).toBeNull();
  });
});
