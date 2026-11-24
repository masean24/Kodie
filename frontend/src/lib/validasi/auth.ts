import { z } from "zod";
import { PANJANG_MINIMAL_PASSWORD, alasanMudahDitebak } from "./password";

/** Skema formulir auth. Dipakai di browser (react-hook-form) dan di Server Function. */

const email = z.string().trim().min(1, "Email wajib diisi.").email("Format email belum benar.");
/** Password daftar: minimal 8 karakter dan tidak mudah ditebak (lihat `./password`). */
const password = z
  .string()
  .min(PANJANG_MINIMAL_PASSWORD, `Password minimal ${PANJANG_MINIMAL_PASSWORD} karakter.`)
  .superRefine((v, ctx) => {
    if (v.length < PANJANG_MINIMAL_PASSWORD) return;
    const alasan = alasanMudahDitebak(v);
    if (alasan) ctx.addIssue({ code: "custom", message: `Password terlalu mudah ditebak. ${alasan}` });
  });
const ulangiPassword = z.string().min(1, "Ulangi password Anda.");

/** Ulangi password harus sama persis dengan password. */
const cocokPassword = {
  cek: (d: { password: string; ulangi_password: string }) => d.password === d.ulangi_password,
  pesan: { path: ["ulangi_password"], message: "Password tidak sama. Ketik ulang password yang sama." },
};
const nama = z.string().trim().min(3, "Nama lengkap minimal 3 huruf.").max(100, "Nama terlalu panjang.");
const noWa = z
  .string()
  .trim()
  .regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor WhatsApp diawali 08 atau +628, 10–15 digit.");
const opsional = (s: z.ZodString) => z.union([s, z.literal("")]).optional();

export const skemaMasuk = z.object({
  email,
  password: z.string().min(1, "Password wajib diisi."),
});

export const skemaOrangTua = z
  .object({
    peran: z.literal("orang_tua"),
    nama,
    email,
    password,
    ulangi_password: ulangiPassword,
    no_wa: noWa,
  })
  .refine(cocokPassword.cek, cocokPassword.pesan);

const KELAS_PER_JENJANG = { SD: [5, 6], SMP: [7, 8, 9], SMA: [10, 11, 12] } as const;
export const DAFTAR_KELAS = KELAS_PER_JENJANG;

export const skemaSiswa = z
  .object({
    peran: z.literal("siswa"),
    nama,
    email,
    password,
    ulangi_password: ulangiPassword,
    tanggal_lahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir wajib diisi.")
      .refine((v) => {
        const umur = (Date.now() - new Date(v).getTime()) / (365.25 * 86_400_000);
        return umur >= 9 && umur <= 21;
      }, "Tanggal lahir belum sesuai untuk siswa SMP atau SMA."),
    jenjang: z.enum(["SMP", "SMA"], { message: "Pilih jenjang SMP atau SMA." }),
    kelas: z.coerce.number().int(),
    sekolah: opsional(z.string().trim().max(120, "Nama sekolah terlalu panjang.")),
    nama_orang_tua: nama,
    email_orang_tua: opsional(email),
  })
  .refine((d) => (KELAS_PER_JENJANG[d.jenjang] as readonly number[]).includes(d.kelas), {
    path: ["kelas"],
    message: "Pilih kelas yang sesuai jenjang.",
  })
  .refine(cocokPassword.cek, cocokPassword.pesan);

export const BIDANG_PILIHAN = ["software", "jaringan", "iot", "ai_data"] as const;

export const skemaPengajar = z
  .object({
  peran: z.literal("pengajar"),
  nama,
  email,
  password,
  ulangi_password: ulangiPassword,
  no_wa: noWa,
  status_kerja: z.enum(["mahasiswa", "lulusan", "pencari_kerja"], { message: "Pilih status Anda saat ini." }),
  kampus: z.string().trim().min(2, "Isi nama kampus atau kampus terakhir.").max(120),
  jurusan: z.string().trim().min(2, "Isi jurusan.").max(120),
  keahlian: z.array(z.enum(BIDANG_PILIHAN)).min(1, "Pilih minimal satu bidang keahlian."),
  cv_url: opsional(z.string().trim().url("Tulis link lengkap, misalnya https://…")),
  })
  .refine(cocokPassword.cek, cocokPassword.pesan);

export const skemaDaftar = z.discriminatedUnion("peran", [skemaOrangTua, skemaSiswa, skemaPengajar]);

export type InputMasuk = z.infer<typeof skemaMasuk>;
export type InputDaftar = z.infer<typeof skemaDaftar>;
export type InputOrangTua = z.infer<typeof skemaOrangTua>;
export type InputSiswa = z.infer<typeof skemaSiswa>;
export type InputPengajar = z.infer<typeof skemaPengajar>;

/** Data `options.data` untuk supabase.auth.signUp (docs/SERAH-TERIMA-FE.md). Email dan password tidak ikut. */
export function dataSignUp(input: InputDaftar): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email: _e, password: _p, ulangi_password: _u, ...data } = input;
  const bersih: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) if (v !== "" && v !== undefined) bersih[k] = v;
  return bersih;
}
