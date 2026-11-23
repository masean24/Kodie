import { z } from "zod";

/** Kelas yang boleh dipilih per jenjang di profil anak (F3). */
export const KELAS_ANAK = { SD: [1, 2, 3, 4, 5, 6], SMP: [7, 8, 9], SMA: [10, 11, 12] } as const;

export const skemaAnak = z
  .object({
    nama: z.string().trim().min(3, "Nama lengkap minimal 3 huruf.").max(100, "Nama terlalu panjang."),
    tanggal_lahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir wajib diisi.")
      .refine((v) => {
        const umur = (Date.now() - new Date(v).getTime()) / (365.25 * 86_400_000);
        return umur >= 5 && umur <= 21;
      }, "Tanggal lahir belum sesuai untuk siswa SD sampai SMA."),
    jenjang: z.enum(["SD", "SMP", "SMA"], { message: "Pilih jenjang." }),
    kelas: z.coerce.number().int(),
    sekolah: z.union([z.string().trim().max(120, "Nama sekolah terlalu panjang."), z.literal("")]).optional(),
  })
  .refine((d) => (KELAS_ANAK[d.jenjang] as readonly number[]).includes(d.kelas), {
    path: ["kelas"],
    message: "Pilih kelas yang sesuai jenjang.",
  });

export type InputAnak = z.infer<typeof skemaAnak>;
