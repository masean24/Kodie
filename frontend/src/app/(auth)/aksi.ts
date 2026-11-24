"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { aturUlangPassword, daftar, keluar, masuk, mintaAturUlangPassword } from "@/lib/api/auth";
import { pesanError } from "@/lib/errors";
import { lanjutAman, tujuanSetelahDaftar, tujuanSetelahMasuk } from "@/lib/peran";
import { skemaAturUlangPassword, skemaDaftar, skemaLupaPassword, skemaMasuk } from "@/lib/validasi/auth";

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

export async function aksiDaftar(masukan: unknown, lanjut: string | null = null): Promise<HasilAksi> {
  const cek = skemaDaftar.safeParse(masukan);
  if (!cek.success) return { galatIsian: galatIsian(cek.error.issues) };
  let tujuan: string;
  try {
    const { pengguna } = await daftar(cek.data);
    if (!pengguna) {
      return { info: "Akun dibuat. Buka email Anda dan klik tautan konfirmasi, lalu masuk." };
    }
    tujuan = tujuanSetelahDaftar(pengguna.peran, lanjut);
  } catch (e) {
    const pesan = pesanError(e);
    if (e instanceof Error && e.message === "EMAIL_SUDAH_DIPAKAI") {
      return { galatIsian: { email: `${pesan} Masuk dengan email ini, atau pakai email lain.` } };
    }
    return { galat: pesan };
  }
  redirect(tujuan);
}

export async function aksiKeluar(lanjut?: string | null | FormData): Promise<void> {
  await keluar();
  redirect(lanjutAman(typeof lanjut === "string" ? lanjut : null) ?? "/");
}

/** Origin situs yang sedang dibuka (di balik proxy Coolify/Cloudflare), untuk tautan di email. */
async function originSitus(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Lupa password. Selalu membalas pesan yang sama agar tidak membocorkan email mana yang terdaftar.
 */
export async function aksiLupaPassword(masukan: unknown): Promise<HasilAksi> {
  const cek = skemaLupaPassword.safeParse(masukan);
  if (!cek.success) return { galatIsian: galatIsian(cek.error.issues) };
  try {
    await mintaAturUlangPassword(cek.data.email, `${await originSitus()}/auth/atur-ulang`);
  } catch (e) {
    const pesan = pesanError(e);
    if (e instanceof Error && e.message === "TERLALU_BANYAK_PERCOBAAN") return { galat: pesan };
  }
  return {
    info: "Jika email itu terdaftar, tautan atur ulang password sudah kami kirim. Cek kotak masuk dan folder spam, lalu buka tautannya di perangkat ini.",
  };
}

export async function aksiAturUlangPassword(masukan: unknown): Promise<HasilAksi> {
  const cek = skemaAturUlangPassword.safeParse(masukan);
  if (!cek.success) return { galatIsian: galatIsian(cek.error.issues) };
  try {
    await aturUlangPassword(cek.data.password);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  redirect("/masuk?password=diubah");
}
