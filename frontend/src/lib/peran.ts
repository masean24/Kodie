import type { Peran, StatusPengguna } from "@/types/database";

/** Prefix area login per peran (PRD bagian 6). */
export const AREA: Record<string, Peran> = {
  "/orang-tua": "orang_tua",
  "/siswa": "siswa",
  "/mengajar": "pengajar",
  "/admin": "admin",
};

export const DASHBOARD: Record<Peran, string> = {
  orang_tua: "/orang-tua",
  siswa: "/siswa",
  pengajar: "/mengajar",
  admin: "/admin",
};

export const NAMA_PERAN: Record<Peran, string> = {
  orang_tua: "Orang tua",
  siswa: "Siswa",
  pengajar: "Pengajar",
  admin: "Admin",
};

/** Peran pemilik area untuk sebuah path, atau null jika path publik. */
export function peranArea(path: string): Peran | null {
  for (const [prefix, peran] of Object.entries(AREA)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return peran;
  }
  return null;
}

/** Rute khusus tamu: pengguna yang sudah login diarahkan ke dashboard. */
export function rutekhususTamu(path: string): boolean {
  return path === "/masuk" || path === "/daftar";
}

/** Hanya path relatif di situs ini; menolak "//evil.com", "/\\evil.com", dan URL absolut. */
export function lanjutAman(lanjut: string | null | undefined): string | null {
  if (!lanjut || !lanjut.startsWith("/") || lanjut.startsWith("//") || lanjut.startsWith("/\\")) return null;
  return lanjut;
}

/** Tujuan setelah masuk: `lanjut` jika aman dan boleh untuk peran ini, selain itu dashboard. */
export function tujuanSetelahMasuk(peran: Peran, lanjut?: string | null): string {
  const aman = lanjutAman(lanjut);
  if (aman && !rutekhususTamu(aman.split("?")[0])) {
    const pemilik = peranArea(aman.split("?")[0]);
    if (pemilik === null || pemilik === peran) return aman;
  }
  return DASHBOARD[peran];
}

/** Tujuan setelah daftar (PRD F1): siswa ke halaman persetujuan orang tua. */
export function tujuanSetelahDaftar(peran: Peran): string {
  return peran === "siswa" ? "/siswa/persetujuan" : DASHBOARD[peran];
}

export const LABEL_STATUS: Record<StatusPengguna, string> = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  menunggu_persetujuan: "Menunggu persetujuan orang tua",
  ditolak_orang_tua: "Ditolak orang tua",
  menunggu_verifikasi: "Menunggu verifikasi admin",
  terverifikasi: "Terverifikasi",
  ditolak: "Ditolak admin",
};
