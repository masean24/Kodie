/**
 * Akun mock untuk mode NEXT_PUBLIC_USE_MOCK=true. Semua nama dan email karangan.
 * Password ini hanya berlaku di mode mock dan BUKAN password akun demo Supabase.
 */
import type { Pengguna } from "@/types/database";

export const PASSWORD_MOCK = "kodie-mock-123";

type AkunMock = { email: string; password: string; pengguna: Pengguna };

const dibuat = "2026-11-01T03:00:00.000Z";

export const akunMock: AkunMock[] = [
  {
    email: "ortu@contoh.id",
    password: PASSWORD_MOCK,
    pengguna: { id: "00000000-0000-4000-c000-000000000001", peran: "orang_tua", nama: "Sari Wulandari", no_wa: "081200000001", status: "aktif", dibuat_pada: dibuat },
  },
  {
    email: "siswa@contoh.id",
    password: PASSWORD_MOCK,
    pengguna: { id: "00000000-0000-4000-c000-000000000002", peran: "siswa", nama: "Raka Pratama", no_wa: null, status: "aktif", dibuat_pada: dibuat },
  },
  {
    email: "siswa.baru@contoh.id",
    password: PASSWORD_MOCK,
    pengguna: { id: "00000000-0000-4000-c000-000000000003", peran: "siswa", nama: "Laras Kinanti", no_wa: null, status: "menunggu_persetujuan", dibuat_pada: dibuat },
  },
  {
    email: "pengajar@contoh.id",
    password: PASSWORD_MOCK,
    pengguna: { id: "00000000-0000-4000-9000-000000000001", peran: "pengajar", nama: "Nadia Putri", no_wa: "081200000004", status: "terverifikasi", dibuat_pada: dibuat },
  },
  {
    email: "pengajar.baru@contoh.id",
    password: PASSWORD_MOCK,
    pengguna: { id: "00000000-0000-4000-c000-000000000005", peran: "pengajar", nama: "Yoga Saputra", no_wa: "081200000005", status: "menunggu_verifikasi", dibuat_pada: dibuat },
  },
  {
    email: "admin@contoh.id",
    password: PASSWORD_MOCK,
    pengguna: { id: "00000000-0000-4000-c000-000000000006", peran: "admin", nama: "Admin Kodie", no_wa: null, status: "aktif", dibuat_pada: dibuat },
  },
];
