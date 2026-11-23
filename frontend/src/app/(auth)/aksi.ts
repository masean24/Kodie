"use server";

import { redirect } from "next/navigation";
import { daftar, keluar, masuk } from "@/lib/api/auth";
import { pesanError } from "@/lib/errors";
import { tujuanSetelahDaftar, tujuanSetelahMasuk } from "@/lib/peran";
import { skemaDaftar, skemaMasuk } from "@/lib/validasi/auth";

export type HasilAksi = {
  galat?: string;
  /** Galat per isian, kunci = nama isian. */
  galatIsian?: Record<string, string>;
  info?: string;
};

function galatIsian(issues: { path: PropertyKey[]; message: string }[]) {
  const hasil: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "");
    if (k && !hasil[k]) hasil[k] = i.message;
  }
  return hasil;
}

export async function aksiMasuk(masukan: unknown, lanjut: string | null): Promise<HasilAksi> {
  const cek = skemaMasuk.safeParse(masukan);
  if (!cek.success) return { galatIsian: galatIsian(cek.error.issues) };
  let tujuan: string;
  try {
    const p = await masuk(cek.data);
    tujuan = tujuanSetelahMasuk(p.peran, lanjut);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  redirect(tujuan);
}

export async function aksiDaftar(masukan: unknown): Promise<HasilAksi> {
  const cek = skemaDaftar.safeParse(masukan);
  if (!cek.success) return { galatIsian: galatIsian(cek.error.issues) };
  let tujuan: string;
  try {
    const { pengguna } = await daftar(cek.data);
    if (!pengguna) {
      return { info: "Akun dibuat. Buka email Anda dan klik tautan konfirmasi, lalu masuk." };
    }
    tujuan = tujuanSetelahDaftar(pengguna.peran);
  } catch (e) {
    const pesan = pesanError(e);
    if (e instanceof Error && e.message === "EMAIL_SUDAH_DIPAKAI") {
      return { galatIsian: { email: `${pesan} Masuk dengan email ini, atau pakai email lain.` } };
    }
    return { galat: pesan };
  }
  redirect(tujuan);
}

export async function aksiKeluar(): Promise<void> {
  await keluar();
  redirect("/");
}
