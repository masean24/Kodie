import { z } from "zod";
import { ekstensiFilePengajar } from "./mengajar";

/** Gambar QRIS (PRD bagian 9): JPG atau PNG, maksimal 1 MB. */
export const BATAS_QRIS = 1 * 1024 * 1024;
export const ACCEPT_QRIS = ".jpg,.jpeg,.png,image/jpeg,image/png";

export function cekFileQris(file: { name: string; size: number; type: string }): string | null {
  const ekstensi = file.name.split(".").pop()?.toLowerCase() ?? "";
  const cocok = ["image/jpeg", "image/png"].includes(file.type) || (!file.type && ["jpg", "jpeg", "png"].includes(ekstensi));
  if (!cocok) return "Format gambar QRIS harus JPG atau PNG.";
  if (file.size === 0) return "File kosong. Pilih gambar QRIS yang benar.";
  if (file.size > BATAS_QRIS) return "Ukuran gambar QRIS melebihi batas 1 MB.";
  return null;
}

export const ekstensiQris = ekstensiFilePengajar;

export const skemaAlasanAdmin = z.object({
  alasan: z
    .string()
    .trim()
    .min(5, "Alasan wajib diisi minimal 5 karakter.")
    .max(500, "Alasan maksimal 500 karakter."),
});

export const skemaSetujuiPengajar = z.object({
  pengajar_id: z.string().min(1),
  program_ids: z.array(z.string().min(1)).min(1, "Pilih minimal satu program yang disetujui."),
});

export const skemaUbahProgram = z.object({
  harga_paket: z.coerce.number().int("Harus bilangan bulat rupiah.").min(0, "Harga tidak boleh negatif."),
  durasi_menit: z.coerce.number().int().min(30, "Minimal 30 menit.").max(180, "Maksimal 180 menit."),
  jumlah_sesi: z.coerce.number().int().min(1, "Minimal 1 sesi.").max(12, "Maksimal 12 sesi."),
  honor_per_sesi: z.coerce.number().int("Harus bilangan bulat rupiah.").min(0, "Honor tidak boleh negatif."),
  aktif: z.boolean(),
});

export const skemaUbahKelasAdmin = z.object({
  status: z.enum(["terbuka", "berjalan", "selesai", "disembunyikan"]),
  kapasitas: z.coerce.number().int().min(1, "Minimal 1 siswa.").max(15, "Maksimal 15 siswa."),
});

export const skemaPengaturanRekening = z.object({
  nama_bank: z.string().trim().min(2, "Nama bank wajib diisi.").max(80),
  nomor_rekening: z.string().trim().min(4, "Nomor rekening wajib diisi.").max(40),
  nama_pemilik_rekening: z.string().trim().min(2, "Nama pemilik rekening wajib diisi.").max(120),
  qris_path: z.string().nullable().optional(),
  qris_payload: z.string().trim().max(600).nullable().optional(),
});

export const skemaPengaturanChatbot = z.object({
  chatbot_aktif: z.boolean(),
  chatbot_nama: z.string().trim().min(2, "Nama asisten minimal 2 karakter.").max(40),
  chatbot_sapaan: z.string().trim().min(5, "Pesan sapaan minimal 5 karakter.").max(300),
  chatbot_kontak_wa: z
    .string()
    .trim()
    .regex(/^62[0-9]{8,15}$/, "Gunakan format angka diawali 62, contoh 6281100000001."),
  chatbot_kontak_email: z.string().trim().email("Format email bantuan tidak valid."),
});

export type InputUbahProgram = z.infer<typeof skemaUbahProgram>;
export type InputUbahKelasAdmin = z.infer<typeof skemaUbahKelasAdmin>;
export type InputPengaturanRekening = z.infer<typeof skemaPengaturanRekening>;
export type InputPengaturanChatbot = z.infer<typeof skemaPengaturanChatbot>;
