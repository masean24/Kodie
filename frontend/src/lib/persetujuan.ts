import { formatTanggal } from "./format";

/** Link persetujuan dari token dan origin situs. */
export function linkPersetujuan(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/persetujuan/${encodeURIComponent(token)}`;
}

/** Teks siap kirim untuk orang tua (PRD F2: tombol "Kirim via WhatsApp"). */
export function pesanPersetujuan(namaSiswa: string, link: string, kedaluwarsaPada: string): string {
  return [
    `Halo, ini ${namaSiswa}. Aku mendaftar kelas teknologi daring di Kodie.`,
    "Akunku baru aktif setelah orang tua menyetujui. Mohon dibaca dan disetujui lewat link ini:",
    link,
    `Link berlaku sampai ${formatTanggal(kedaluwarsaPada)}.`,
  ].join("\n");
}

/** Tautan wa.me tanpa nomor tujuan: orang tua dipilih sendiri di WhatsApp. */
export function tautanWhatsApp(pesan: string): string {
  return `https://wa.me/?text=${encodeURIComponent(pesan)}`;
}
