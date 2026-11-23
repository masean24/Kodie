import type { StatusPengguna, StatusSesi } from "@/types/database";

export const STATUS_KERJA_PILIHAN = [
  { nilai: "mahasiswa", label: "Mahasiswa" },
  { nilai: "lulusan", label: "Lulusan" },
  { nilai: "pencari_kerja", label: "Pencari kerja" },
] as const;

export const LABEL_PERAN_STATUS: Record<
  StatusPengguna,
  { label: string; nada: "sukses" | "peringatan" | "bahaya" | "netral" }
> = {
  terverifikasi: { label: "Terverifikasi", nada: "sukses" },
  menunggu_verifikasi: { label: "Menunggu verifikasi admin", nada: "peringatan" },
  ditolak: { label: "Ditolak admin", nada: "bahaya" },
  nonaktif: { label: "Nonaktif", nada: "netral" },
  aktif: { label: "Aktif", nada: "sukses" },
  menunggu_persetujuan: { label: "Menunggu persetujuan", nada: "peringatan" },
  ditolak_orang_tua: { label: "Ditolak orang tua", nada: "bahaya" },
};

export const NADA_STATUS_SESI: Record<StatusSesi, "info" | "sukses" | "netral"> = {
  terjadwal: "info",
  selesai: "sukses",
  dibatalkan: "netral",
};
