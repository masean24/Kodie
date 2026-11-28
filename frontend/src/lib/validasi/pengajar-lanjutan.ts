import { z } from "zod";

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
