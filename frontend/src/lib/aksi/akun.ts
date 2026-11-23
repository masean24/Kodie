"use server";

import { refresh } from "next/cache";
import type { HasilPersetujuan, HasilTesMinat, JawabanMinat, KeputusanPersetujuan, LinkPersetujuan } from "@/types/database";
import { buatLinkPersetujuan, putuskanPersetujuan } from "@/lib/api/persetujuan";
import { hapusAnak, tambahAnak, ubahAnak } from "@/lib/api/siswa";
import { hitungTesMinat } from "@/lib/api/tes-minat";
import { pesanError } from "@/lib/errors";
import { skemaAnak } from "@/lib/validasi/anak";

/** Server Function untuk F2, F3, dan F4. Pemeriksaan akses tetap di lapisan data dan di backend. */

type Gagal = { galat: string };

export async function aksiBuatLink(): Promise<{ link: LinkPersetujuan } | Gagal> {
  try {
    return { link: await buatLinkPersetujuan() };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiPutuskan(
  token: string,
  keputusan: KeputusanPersetujuan,
): Promise<{ hasil: HasilPersetujuan } | Gagal> {
  if (keputusan !== "setujui" && keputusan !== "tolak") return { galat: pesanError("VALIDASI_GAGAL") };
  try {
    return { hasil: await putuskanPersetujuan(token, keputusan) };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export type HasilSimpanAnak = { ok?: true; galat?: string; galatIsian?: Record<string, string> };

export async function aksiSimpanAnak(id: string | null, masukan: unknown): Promise<HasilSimpanAnak> {
  const cek = skemaAnak.safeParse(masukan);
  if (!cek.success) {
    const galatIsian: Record<string, string> = {};
    for (const i of cek.error.issues) galatIsian[String(i.path[0])] ??= i.message;
    return { galatIsian };
  }
  try {
    if (id) await ubahAnak(id, cek.data);
    else await tambahAnak(cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiHapusAnak(id: string): Promise<{ ok?: true; galat?: string }> {
  try {
    await hapusAnak(id);
  } catch (e) {
    // Trigger backend menolak hapus profil yang punya booking aktif. Kodenya belum disebut di serah terima.
    const kode = e instanceof Error ? e.message : "";
    return {
      galat:
        kode === "TIDAK_BERHAK"
          ? pesanError(e)
          : "Profil anak yang punya booking aktif tidak bisa dihapus. Selesaikan atau batalkan booking-nya dulu.",
    };
  }
  refresh();
  return { ok: true };
}

export async function aksiHitungTesMinat(
  jawaban: JawabanMinat,
  siswaId: string | null,
): Promise<{ hasil: HasilTesMinat } | Gagal> {
  try {
    return { hasil: await hitungTesMinat(jawaban, siswaId) };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}
