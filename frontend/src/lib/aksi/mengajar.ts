"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  ambilLinkMasukSesi,
  bukaKelas,
  geserSesi,
  kirimAtauUbahLaporan,
  simpanDokumenPengajar,
  simpanProfilPengajar,
} from "@/lib/api/mengajar";
import { pesanError } from "@/lib/errors";
import {
  buatSkemaLaporan,
  skemaBukaKelas,
  skemaGeserSesi,
  skemaProfilPengajar,
} from "@/lib/validasi/mengajar";

/** Server Function untuk area pengajar (F7–F11). Akses dicek ulang di lapisan data & backend. */

export type HasilAksi = { ok?: true; galat?: string; galatIsian?: Record<string, string> };

function ekstrakGalatZod(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const galatIsian: Record<string, string> = {};
  for (const i of issues) {
    const kunci = i.path.map(String).join(".");
    if (kunci) galatIsian[kunci] ??= i.message;
  }
  return galatIsian;
}

export async function aksiSimpanProfilPengajar(masukan: unknown): Promise<HasilAksi> {
  const cek = skemaProfilPengajar.safeParse(masukan);
  if (!cek.success) return { galatIsian: ekstrakGalatZod(cek.error.issues) };
  try {
    await simpanProfilPengajar(cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiSimpanDokumenPengajar(
  kolom: "foto_path" | "identitas_path" | "skck_path",
  path: string,
): Promise<{ ok?: true; galat?: string }> {
  try {
    await simpanDokumenPengajar(kolom, path);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiBukaKelas(masukan: unknown): Promise<HasilAksi> {
  const cek = skemaBukaKelas.safeParse(masukan);
  if (!cek.success) return { galatIsian: ekstrakGalatZod(cek.error.issues) };
  let kelasId: string;
  try {
    const hasil = await bukaKelas(cek.data);
    kelasId = hasil.kelasId;
  } catch (e) {
    return { galat: pesanError(e) };
  }
  redirect(`/mengajar/kelas/${kelasId}`);
}

export async function aksiGeserSesi(sesiId: string, masukan: unknown): Promise<HasilAksi> {
  const cek = skemaGeserSesi.safeParse(masukan);
  if (!cek.success) return { galatIsian: ekstrakGalatZod(cek.error.issues) };
  const jam = cek.data.jam.length === 5 ? `${cek.data.jam}:00` : cek.data.jam;
  const mulaiPada = new Date(`${cek.data.tanggal}T${jam}+07:00`);
  if (Number.isNaN(mulaiPada.getTime())) return { galat: pesanError("VALIDASI_GAGAL") };
  try {
    await geserSesi(sesiId, mulaiPada.toISOString());
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}

export async function aksiMasukSesi(sesiId: string): Promise<{ meetUrl?: string; galat?: string }> {
  try {
    const res = await ambilLinkMasukSesi(sesiId);
    return { meetUrl: res.meet_uri };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiKirimLaporan(sesiId: string, wajibRapor: boolean, masukan: unknown): Promise<HasilAksi> {
  const skema = buatSkemaLaporan(wajibRapor);
  const cek = skema.safeParse(masukan);
  if (!cek.success) {
    const galatIsian = ekstrakGalatZod(cek.error.issues);
    const pesanUmum = cek.error.issues[0]?.message;
    return { galatIsian, galat: galatIsian.rapor ?? (Object.keys(galatIsian).length === 0 ? pesanUmum : undefined) };
  }
  let kelasId: string;
  try {
    const res = await kirimAtauUbahLaporan(sesiId, cek.data);
    kelasId = res.kelasId;
  } catch (e) {
    return { galat: pesanError(e) };
  }
  redirect(`/mengajar/kelas/${kelasId}`);
}
