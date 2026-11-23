import { z } from "zod";

export const KATEGORI_MASALAH_PILIHAN = [
  "perilaku_tidak_pantas",
  "pengajar_tidak_hadir",
  "masalah_teknis",
  "lainnya",
] as const;

export const skemaRating = z.object({
  sesi_id: z.string().min(1),
  siswa_id: z.string().min(1),
  bintang: z.coerce
    .number()
    .int("Pilih 1 sampai 5 bintang.")
    .min(1, "Pilih 1 sampai 5 bintang.")
    .max(5, "Pilih 1 sampai 5 bintang."),
  komentar: z
    .union([z.string().trim().max(300, "Komentar maksimal 300 karakter."), z.literal("")])
    .optional(),
});

export type InputRating = z.infer<typeof skemaRating>;

export const skemaLaporanMasalah = z.object({
  sesi_id: z.string().nullable().optional(),
  pengajar_id: z.string().min(1, "Pengajar tujuan wajib dipilih."),
  kategori: z.enum(KATEGORI_MASALAH_PILIHAN, { message: "Pilih kategori masalah." }),
  deskripsi: z
    .string()
    .trim()
    .min(10, "Jelaskan masalah minimal 10 karakter.")
    .max(1000, "Deskripsi maksimal 1.000 karakter."),
});

export type InputLaporanMasalah = z.infer<typeof skemaLaporanMasalah>;
