"use server";

import { refresh } from "next/cache";
import type { StatusMasalah } from "@/types/database";
import {
  adminCobaBuatMeet,
  adminNonaktifkanPengguna,
  adminSetujuiPembayaran,
  adminSetujuiPengajar,
  adminSetWawancara,
  adminSimpanPengaturan,
  adminTandaiHonorDibayar,
  adminTolakPembayaran,
  adminTolakPengajar,
  adminUbahKelas,
  adminUbahProgram,
  adminUbahStatusLaporanMasalah,
} from "@/lib/api/admin";
import { pesanError } from "@/lib/errors";
import {
  skemaAlasanAdmin,
  skemaPengaturanRekening,
  skemaSetujuiPengajar,
  skemaUbahKelasAdmin,
  skemaUbahProgram,
} from "@/lib/validasi/admin";

/** Server Function untuk seluruh aksi admin (F6–F8, F12–F14). */

export type HasilAdmin = { ok?: true; galat?: string; galatIsian?: Record<string, string> };

function ekstrakGalat(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const galatIsian: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "");
    if (k) galatIsian[k] ??= i.message;
  }
  return galatIsian;
}

export async function aksiAdminSetujuiPembayaran(pembayaranId: string): Promise<HasilAdmin> {
  try {
    await adminSetujuiPembayaran(pembayaranId);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminTolakPembayaran(pembayaranId: string, alasan: string): Promise<HasilAdmin> {
  const cek = skemaAlasanAdmin.safeParse({ alasan });
  if (!cek.success) return { galatIsian: ekstrakGalat(cek.error.issues) };
  try {
    await adminTolakPembayaran(pembayaranId, cek.data.alasan);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminWawancara(pengajarId: string, selesai: boolean): Promise<HasilAdmin> {
  try {
    await adminSetWawancara(pengajarId, selesai);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminSetujuiPengajar(pengajarId: string, programIds: string[]): Promise<HasilAdmin> {
  const cek = skemaSetujuiPengajar.safeParse({ pengajar_id: pengajarId, program_ids: programIds });
  if (!cek.success) return { galat: cek.error.issues[0]?.message ?? pesanError("VALIDASI_GAGAL") };
  try {
    await adminSetujuiPengajar(pengajarId, cek.data.program_ids);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminTolakPengajar(pengajarId: string, alasan: string): Promise<HasilAdmin> {
  const cek = skemaAlasanAdmin.safeParse({ alasan });
  if (!cek.success) return { galatIsian: ekstrakGalat(cek.error.issues) };
  try {
    await adminTolakPengajar(pengajarId, cek.data.alasan);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminNonaktifkanPengguna(
  penggunaId: string,
  alasan: string,
): Promise<HasilAdmin & { bookingTerdampak?: number }> {
  const cek = skemaAlasanAdmin.safeParse({ alasan });
  if (!cek.success) return { galatIsian: ekstrakGalat(cek.error.issues) };
  try {
    const res = await adminNonaktifkanPengguna(penggunaId, cek.data.alasan);
    refresh();
    return { ok: true, bookingTerdampak: res.booking_terdampak.length };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiAdminStatusMasalah(id: string, status: StatusMasalah): Promise<HasilAdmin> {
  try {
    await adminUbahStatusLaporanMasalah(id, status);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminBayarHonor(id: string): Promise<HasilAdmin> {
  try {
    await adminTandaiHonorDibayar(id);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminUbahKelas(kelasId: string, masukan: unknown): Promise<HasilAdmin> {
  const cek = skemaUbahKelasAdmin.safeParse(masukan);
  if (!cek.success) return { galatIsian: ekstrakGalat(cek.error.issues) };
  try {
    await adminUbahKelas(kelasId, cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminBuatMeetUlang(kelasId: string): Promise<HasilAdmin> {
  try {
    await adminCobaBuatMeet(kelasId);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminUbahProgram(programId: string, masukan: unknown): Promise<HasilAdmin> {
  const cek = skemaUbahProgram.safeParse(masukan);
  if (!cek.success) return { galatIsian: ekstrakGalat(cek.error.issues) };
  try {
    await adminUbahProgram(programId, cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiAdminSimpanPengaturan(masukan: unknown): Promise<HasilAdmin> {
  const cek = skemaPengaturanRekening.safeParse(masukan);
  if (!cek.success) return { galatIsian: ekstrakGalat(cek.error.issues) };
  try {
    await adminSimpanPengaturan(cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}
