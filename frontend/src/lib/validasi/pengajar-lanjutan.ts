import { z } from "zod";

export const SLUG_TERCADANG = new Set([
  "admin",
  "masuk",
  "daftar",
  "baru",
  "profil",
  "edit",
  "api",
  "auth",
  "pengajar",
  "kodie",
  "kiko",
  "support",
]);

export function adalahUuid(nilai: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nilai.trim());
}

/**
 * Slug unik dari nama pengajar: dasar 3–32 karakter, lalu `-1`, `-2`, … bila sudah dipakai (urutan sama dengan
 * `buat_slug_pengajar_unik` di backend). Nama yang tidak menghasilkan dasar sah (terlalu pendek, bukan huruf latin,
 * kata tercadang) memakai dasar `pengajar` yang selalu diberi akhiran, karena `pengajar` sendiri tercadang.
 */
export function buatSlugUnik(nama: string, dipakai: ReadonlySet<string> = new Set()): string {
  const dasar = nama
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
  const sah = dasar.length >= 3 && !adalahUuid(dasar) && !SLUG_TERCADANG.has(dasar);
  const awal = sah ? dasar : "pengajar";
  if (sah && !dipakai.has(awal)) return awal;
  for (let n = 1; ; n++) {
    const kandidat = `${awal}-${n}`;
    if (!dipakai.has(kandidat)) return kandidat;
  }
}

/** Usulan slug dari nama saja (tanpa cek keunikan), selalu lolos `skemaSlugPengajar`. */
export function buatSlugDariNama(nama: string): string {
  return buatSlugUnik(nama);
}

export const skemaSlugPengajar = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username minimal 3 karakter.")
  .max(40, "Username maksimal 40 karakter.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Gunakan huruf kecil, angka, dan tanda hubung tunggal (bukan di awal/akhir).")
  .refine((s) => !adalahUuid(s), "Username tidak boleh menyerupai format UUID.")
  .refine((s) => !SLUG_TERCADANG.has(s), "Username ini dicadangkan sistem. Pilih yang lain.");

const teks = (min: number, maks: number, label: string) =>
  z.string().trim().min(min, `${label} wajib diisi.`).max(maks, `${label} maksimal ${maks} karakter.`);

export const skemaPengalaman = z.object({
  id: z.string().optional(),
  peran: teks(3, 80, "Peran"),
  tempat: teks(2, 100, "Tempat"),
  periode: teks(4, 40, "Periode"),
  deskripsi: z.union([z.string().trim().max(240, "Deskripsi maksimal 240 karakter."), z.literal("")]).optional(),
});

const tahunIni = new Date().getFullYear();

export const skemaSertifikat = z.object({
  id: z.string().optional(),
  nama: teks(3, 100, "Nama sertifikat"),
  penerbit: teks(2, 100, "Penerbit"),
  tahun: z.coerce
    .number({ message: "Tahun wajib angka." })
    .int("Tahun wajib angka.")
    .min(1990, "Tahun tidak valid.")
    .max(tahunIni, "Tahun tidak boleh melewati tahun ini."),
  tautan: z
    .union([z.string().trim().url("Tautan harus diawali https://").startsWith("https://", "Tautan harus diawali https://"), z.literal("")])
    .optional(),
});

export const skemaDetailProfil = z.object({
  pengalaman: z.array(skemaPengalaman).max(10, "Maksimal 10 pengalaman."),
  sertifikat: z.array(skemaSertifikat).max(10, "Maksimal 10 sertifikat."),
});

export type InputDetailProfil = z.infer<typeof skemaDetailProfil>;
