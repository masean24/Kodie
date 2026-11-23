import { z } from "zod";
import { BIDANG_PILIHAN } from "./auth";
import { TIPE_BUKTI } from "./bukti";

/** Foto profil pengajar (PRD bagian 9): JPG atau PNG, maksimal 1 MB. */
export const BATAS_FOTO_PENGAJAR = 1 * 1024 * 1024;
export const ACCEPT_FOTO_PENGAJAR = ".jpg,.jpeg,.png,image/jpeg,image/png";

/** Dokumen verifikasi KTP/KTM dan SKCK (PRD bagian 9): JPG, PNG, atau PDF, maksimal 2 MB. */
export const BATAS_DOKUMEN_PENGAJAR = 2 * 1024 * 1024;
export const ACCEPT_DOKUMEN_PENGAJAR = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

function cekFile(
  file: { name: string; size: number; type: string },
  opsi: { bolehPdf: boolean; batasByte: number; batasLabel: string },
): string | null {
  const ekstensi = file.name.split(".").pop()?.toLowerCase() ?? "";
  const tipeDiizinkan = opsi.bolehPdf ? ["image/jpeg", "image/png", "application/pdf"] : ["image/jpeg", "image/png"];
  const ekstensDiizinkan = opsi.bolehPdf ? ["jpg", "jpeg", "png", "pdf"] : ["jpg", "jpeg", "png"];
  const cocok = tipeDiizinkan.includes(file.type) || (!file.type && ekstensDiizinkan.includes(ekstensi));
  if (!cocok) {
    return opsi.bolehPdf ? "Format file harus JPG, PNG, atau PDF." : "Format foto harus JPG atau PNG.";
  }
  if (file.size === 0) return "File kosong. Pilih file yang benar.";
  if (file.size > opsi.batasByte) return `Ukuran file melebihi batas ${opsi.batasLabel}. Perkecil atau pilih file lain.`;
  return null;
}

export function cekFotoPengajar(file: { name: string; size: number; type: string }): string | null {
  return cekFile(file, { bolehPdf: false, batasByte: BATAS_FOTO_PENGAJAR, batasLabel: "1 MB" });
}

export function cekDokumenPengajar(file: { name: string; size: number; type: string }): string | null {
  return cekFile(file, { bolehPdf: true, batasByte: BATAS_DOKUMEN_PENGAJAR, batasLabel: "2 MB" });
}

export function ekstensiFilePengajar(file: { name: string; type: string }): string {
  const dariTipe = TIPE_BUKTI[file.type];
  if (dariTipe) return dariTipe;
  const e = file.name.split(".").pop()?.toLowerCase() ?? "";
  return e === "jpeg" ? "jpg" : e;
}

const opsional = (s: z.ZodString) => z.union([s, z.literal("")]).optional();
const opsionalUrl = opsional(z.string().trim().url("Tulis link lengkap, misalnya https://…"));

export const skemaProfilPengajar = z.object({
  nama: z.string().trim().min(3, "Nama lengkap minimal 3 huruf.").max(100, "Nama terlalu panjang."),
  no_wa: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor WhatsApp diawali 08 atau +628, 10–15 digit."),
  status_kerja: z.enum(["mahasiswa", "lulusan", "pencari_kerja"], { message: "Pilih status Anda saat ini." }),
  kampus: z.string().trim().min(2, "Isi nama kampus atau kampus terakhir.").max(120),
  jurusan: z.string().trim().min(2, "Isi jurusan.").max(120),
  keahlian: z.array(z.enum(BIDANG_PILIHAN)).min(1, "Pilih minimal satu bidang keahlian."),
  cv_url: opsionalUrl,
  program_ids: z.array(z.string().min(1)).min(1, "Pilih minimal satu program yang ingin diajar."),
});

export type InputProfilPengajar = z.infer<typeof skemaProfilPengajar>;

export const skemaBukaKelas = z.object({
  program_id: z.string().min(1, "Pilih program yang akan diajarkan."),
  level: z.coerce.number().int().min(1, "Level minimal 1.").max(5, "Level maksimal 5."),
  tanggal_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal sesi pertama."),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Pilih jam mulai dalam WIB."),
  kapasitas: z.coerce.number().int().min(1, "Kapasitas minimal 1 siswa.").max(15, "Kapasitas maksimal 15 siswa."),
});

export type InputBukaKelas = z.infer<typeof skemaBukaKelas>;

export const skemaGeserSesi = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal baru."),
  jam: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Pilih jam baru (WIB)."),
});

export type InputGeserSesi = z.infer<typeof skemaGeserSesi>;

const skorRapor = z.coerce
  .number()
  .int("Skor harus bilangan bulat.")
  .min(1, "Skor minimal 1.")
  .max(5, "Skor maksimal 5.");

const skemaSiswaLaporan = z
  .object({
    siswa_id: z.string().min(1),
    hadir: z.boolean(),
    catatan: opsional(z.string().trim().max(300, "Catatan maksimal 300 karakter.")),
    karya_url: opsionalUrl,
  })
  .superRefine((d, ctx) => {
    if (d.hadir && (!d.catatan || d.catatan.trim().length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["catatan"],
        message: "Catatan untuk siswa wajib diisi jika hadir.",
      });
    }
  });

const skemaItemRapor = z.object({
  siswa_id: z.string().min(1),
  skor_software: skorRapor,
  skor_jaringan: skorRapor,
  skor_iot: skorRapor,
  skor_ai_data: skorRapor,
  bidang_rekomendasi: z.enum(BIDANG_PILIHAN, { message: "Pilih bidang yang direkomendasikan." }),
  alasan: z
    .string()
    .trim()
    .min(1, "Alasan rekomendasi wajib diisi.")
    .max(1000, "Alasan maksimal 1.000 karakter."),
  saran: z
    .string()
    .trim()
    .min(1, "Saran langkah berikutnya wajib diisi.")
    .max(500, "Saran maksimal 500 karakter."),
});

/** Skema form laporan sesi (F10) dan rapor rekomendasi jurusan (F11). */
export function buatSkemaLaporan(wajibRapor: boolean) {
  return z
    .object({
      ringkasan: z
        .string()
        .trim()
        .min(1, "Ringkasan materi wajib diisi.")
        .max(500, "Ringkasan maksimal 500 karakter."),
      rekaman_url: opsionalUrl,
      kendala: opsional(z.string().trim().max(500, "Kendala maksimal 500 karakter.")),
      siswa: z.array(skemaSiswaLaporan),
      rapor: z.array(skemaItemRapor).optional(),
    })
    .superRefine((data, ctx) => {
      if (!wajibRapor) return;
      const hadirIds = data.siswa.filter((s) => s.hadir).map((s) => s.siswa_id);
      const daftarRapor = data.rapor ?? [];
      for (const sid of hadirIds) {
        if (!daftarRapor.some((r) => r.siswa_id === sid)) {
          ctx.addIssue({
            code: "custom",
            path: ["rapor"],
            message: "Rapor rekomendasi jurusan wajib diisi untuk semua siswa yang hadir pada sesi ke-4.",
          });
          break;
        }
      }
    });
}

export type InputLaporanForm = z.infer<ReturnType<typeof buatSkemaLaporan>>;
