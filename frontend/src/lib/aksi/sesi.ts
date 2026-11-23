"use server";

import { refresh } from "next/cache";
import type { Notifikasi } from "@/types/database";
import {
  ambilDaftarNotifikasi,
  tandaiNotifikasiDibaca,
  tandaiSemuaNotifikasiDibaca,
} from "@/lib/api/notifikasi";
import {
  ambilLinkMasukSesiPengguna,
  simpanLaporanMasalah,
  simpanRatingSesi,
} from "@/lib/api/sesi";
import { pesanError } from "@/lib/errors";
import { skemaLaporanMasalah, skemaRating } from "@/lib/validasi/sesi";

/** Server Function untuk halaman sesi, rating, laporan masalah, dan notifikasi (F8, F12, Bagian 9). */

export async function aksiMasukKelasPengguna(sesiId: string): Promise<{ meetUrl?: string; galat?: string }> {
  try {
    const res = await ambilLinkMasukSesiPengguna(sesiId);
    return { meetUrl: res.meet_uri };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiBeriRating(
  masukan: unknown,
): Promise<{ ok?: true; galat?: string; galatIsian?: Record<string, string> }> {
  const cek = skemaRating.safeParse(masukan);
  if (!cek.success) {
    const galatIsian: Record<string, string> = {};
    for (const i of cek.error.issues) galatIsian[String(i.path[0])] ??= i.message;
    return { galatIsian };
  }
  try {
    await simpanRatingSesi(cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiLaporMasalah(
  masukan: unknown,
): Promise<{ ok?: true; galat?: string; galatIsian?: Record<string, string> }> {
  const cek = skemaLaporanMasalah.safeParse(masukan);
  if (!cek.success) {
    const galatIsian: Record<string, string> = {};
    for (const i of cek.error.issues) galatIsian[String(i.path[0])] ??= i.message;
    return { galatIsian };
  }
  try {
    await simpanLaporanMasalah(cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  return { ok: true };
}

export async function aksiAmbilNotifikasi(): Promise<Notifikasi[]> {
  try {
    return await ambilDaftarNotifikasi();
  } catch {
    return [];
  }
}

export async function aksiBacaNotifikasi(id: string): Promise<void> {
  try {
    await tandaiNotifikasiDibaca(id);
  } catch {
    // Abaikan jika gagal sementara.
  }
}

export async function aksiBacaSemuaNotifikasi(): Promise<void> {
  try {
    await tandaiSemuaNotifikasiDibaca();
  } catch {
    // Abaikan jika gagal sementara.
  }
}
