"use server";

import { refresh } from "next/cache";
import { buatKodeReferralSaya, simpanDetailProfilSaya } from "@/lib/api/pengajar-lanjutan";
import { pesanError } from "@/lib/errors";
import { skemaDetailProfil } from "@/lib/validasi/pengajar-lanjutan";

/** Server Function kode referral & detail profil pengajar (2026-11-28). Akses dicek ulang di lapisan data. */

export type HasilAksiLanjutan = { ok?: true; galat?: string; galatIsian?: Record<string, string>; kode?: string };

export async function aksiBuatKodeReferral(): Promise<HasilAksiLanjutan> {
  try {
    const k = await buatKodeReferralSaya();
    refresh();
    return { ok: true, kode: k.kode };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiSimpanDetailProfil(masukan: unknown): Promise<HasilAksiLanjutan> {
  const cek = skemaDetailProfil.safeParse(masukan);
  if (!cek.success) {
    const galatIsian: Record<string, string> = {};
    for (const i of cek.error.issues) {
      const kunci = i.path.map(String).join(".");
      galatIsian[kunci || "_"] ??= i.message;
    }
    return { galatIsian };
  }
  try {
    await simpanDetailProfilSaya(cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}
