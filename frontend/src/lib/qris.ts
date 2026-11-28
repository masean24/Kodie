/**
 * Utilitas EMVCo QRIS (Bank Indonesia):
 * validasi payload QRIS statis serta konversi ke QRIS dinamis dengan nominal tagihan (Tag 54)
 * dan checksum CRC-16/CCITT-FALSE (Tag 63).
 */

export interface InfoMerchantQris {
  valid: boolean;
  merchantNama: string | null;
  merchantKota: string | null;
}

interface TlvItem {
  tag: string;
  value: string;
}

export function hitungCrc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function uraiTlvEmv(payload: string): TlvItem[] | null {
  const items: TlvItem[] = [];
  let pos = 0;
  while (pos < payload.length) {
    if (pos + 4 > payload.length) return null;
    const tag = payload.slice(pos, pos + 2);
    const lenStr = payload.slice(pos + 2, pos + 4);
    if (!/^\d{2}$/.test(lenStr)) return null;
    const len = Number(lenStr);
    const start = pos + 4;
    const end = start + len;
    if (end > payload.length) return null;
    items.push({ tag, value: payload.slice(start, end) });
    pos = end;
  }
  return pos === payload.length && items.length > 0 ? items : null;
}

export function uraiQrisStatis(payload: string | null | undefined): InfoMerchantQris {
  const invalid: InfoMerchantQris = { valid: false, merchantNama: null, merchantKota: null };
  const trimmed = (payload ?? "").trim();
  if (trimmed.length < 30) return invalid;
  if (!/6304[0-9A-Fa-f]{4}$/.test(trimmed)) return invalid;

  const bodyTanpaCrc = trimmed.slice(0, -4);
  const crcAktual = trimmed.slice(-4).toUpperCase();
  if (hitungCrc16Ccitt(bodyTanpaCrc) !== crcAktual) return invalid;

  const tlv = uraiTlvEmv(trimmed);
  if (!tlv) return invalid;

  const nilai = (tag: string) => tlv.find((x) => x.tag === tag)?.value;
  if (nilai("00") !== "01") return invalid;
  if (nilai("53") !== "360") return invalid;
  if (nilai("58") !== "ID") return invalid;

  const adaAkunMerchant = tlv.some((x) => {
    const num = Number(x.tag);
    return Number.isInteger(num) && num >= 26 && num <= 51;
  });
  if (!adaAkunMerchant) return invalid;

  return {
    valid: true,
    merchantNama: nilai("59") ?? null,
    merchantKota: nilai("60") ?? null,
  };
}

export function buatQrisDinamis(payloadStatis: string | null | undefined, nominalRupiah: number): string | null {
  if (!uraiQrisStatis(payloadStatis).valid) return null;
  const nominal = Math.round(nominalRupiah);
  if (!Number.isFinite(nominal) || nominal <= 0) return null;

  const nominalStr = String(nominal);
  if (nominalStr.length > 99) return null;

  const tlvAsli = uraiTlvEmv(payloadStatis!.trim());
  if (!tlvAsli) return null;

  const tanpaNominalDanCrc = tlvAsli.filter((x) => x.tag !== "54" && x.tag !== "63");

  // Tag 01 = "12" menandakan QRIS dinamis
  const adaTag01 = tanpaNominalDanCrc.some((x) => x.tag === "01");
  const denganDinamis: TlvItem[] = [];
  for (const item of tanpaNominalDanCrc) {
    if (item.tag === "01") {
      denganDinamis.push({ tag: "01", value: "12" });
    } else {
      denganDinamis.push(item);
      if (!adaTag01 && item.tag === "00") {
        denganDinamis.push({ tag: "01", value: "12" });
      }
    }
  }

  // Sisipkan Tag 54 tepat setelah Tag 53 (atau sebelum Tag 58 bila urutan berbeda)
  const hasilTlv: TlvItem[] = [];
  let sudahSisipNominal = false;
  for (const item of denganDinamis) {
    if (!sudahSisipNominal && item.tag === "58") {
      hasilTlv.push({ tag: "54", value: nominalStr });
      sudahSisipNominal = true;
    }
    hasilTlv.push(item);
    if (!sudahSisipNominal && item.tag === "53") {
      hasilTlv.push({ tag: "54", value: nominalStr });
      sudahSisipNominal = true;
    }
  }
  if (!sudahSisipNominal) {
    hasilTlv.push({ tag: "54", value: nominalStr });
  }

  const encodedBody = hasilTlv
    .map((x) => `${x.tag}${String(x.value.length).padStart(2, "0")}${x.value}`)
    .join("");
  const bodyPlusCrcTag = `${encodedBody}6304`;
  return `${bodyPlusCrcTag}${hitungCrc16Ccitt(bodyPlusCrcTag)}`;
}
