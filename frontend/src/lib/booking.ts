import type { Booking, Jenjang, Program, Siswa, StatusBooking } from "@/types/database";

/** Status yang menghitung kursi terpakai dan dianggap aktif (PRD F6). */
export const STATUS_AKTIF: StatusBooking[] = ["menunggu_pembayaran", "menunggu_verifikasi", "terkonfirmasi"];

export const LABEL_STATUS_BOOKING: Record<StatusBooking, string> = {
  menunggu_pembayaran: "Menunggu pembayaran",
  menunggu_verifikasi: "Bukti sedang diperiksa",
  terkonfirmasi: "Terkonfirmasi",
  selesai: "Selesai",
  kedaluwarsa: "Kedaluwarsa",
  dibatalkan: "Dibatalkan",
};

export const NADA_STATUS_BOOKING: Record<StatusBooking, "peringatan" | "info" | "sukses" | "netral" | "bahaya"> = {
  menunggu_pembayaran: "peringatan",
  menunggu_verifikasi: "info",
  terkonfirmasi: "sukses",
  selesai: "netral",
  kedaluwarsa: "netral",
  dibatalkan: "netral",
};

/** Status yang ditampilkan: booking menunggu pembayaran yang lewat batas dianggap kedaluwarsa. */
export function statusEfektif(b: Pick<Booking, "status" | "batas_bayar_pada">, sekarang: Date): StatusBooking {
  if (b.status === "menunggu_pembayaran" && new Date(b.batas_bayar_pada) <= sekarang) return "kedaluwarsa";
  return b.status;
}

export type KelompokBooking = "perlu_dibayar" | "diperiksa" | "terkonfirmasi" | "riwayat";

export function kelompokBooking(status: StatusBooking): KelompokBooking {
  if (status === "menunggu_pembayaran") return "perlu_dibayar";
  if (status === "menunggu_verifikasi") return "diperiksa";
  if (status === "terkonfirmasi") return "terkonfirmasi";
  return "riwayat";
}

/** Kode booking seperti `BK-20261124-0007` (tanggal WIB). Backend membuat kode aslinya. */
export function kodeBooking(tanggal: Date, urutan: number): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(tanggal)
    .replaceAll("-", "");
  return `BK-${p}-${String(urutan).padStart(4, "0")}`;
}

/** Apakah siswa cocok dengan program (jenjang dan rentang kelas, PRD F3). Null jika cocok, selain itu alasannya. */
export function alasanTidakCocok(
  siswa: Pick<Siswa, "jenjang" | "kelas">,
  program: Pick<Program, "jenjang" | "kelas_min" | "kelas_maks" | "nama">,
): string | null {
  if (!program.jenjang.includes(siswa.jenjang as Jenjang) || siswa.kelas < program.kelas_min || siswa.kelas > program.kelas_maks) {
    return `${program.nama} untuk kelas ${program.kelas_min}–${program.kelas_maks}.`;
  }
  return null;
}
