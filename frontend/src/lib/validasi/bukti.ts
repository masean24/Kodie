/** Bukti bayar (PRD F6, bagian 9): JPG, PNG, atau PDF, maksimal 2 MB. */
export const BATAS_BUKTI = 2 * 1024 * 1024;

export const TIPE_BUKTI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export const ACCEPT_BUKTI = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

/** Kembalikan pesan galat, atau null jika file boleh diunggah. */
export function cekBukti(file: { name: string; size: number; type: string }): string | null {
  const ekstensi = file.name.split(".").pop()?.toLowerCase() ?? "";
  const tipeCocok = file.type in TIPE_BUKTI || (!file.type && ["jpg", "jpeg", "png", "pdf"].includes(ekstensi));
  if (!tipeCocok) return "Format file harus JPG, PNG, atau PDF.";
  if (file.size === 0) return "File kosong. Pilih file bukti bayar yang benar.";
  if (file.size > BATAS_BUKTI) return "File lebih dari 2 MB. Perkecil ukurannya atau pilih file lain.";
  return null;
}

/** Ekstensi untuk nama file di storage. */
export function ekstensiBukti(file: { name: string; type: string }): string {
  const dariTipe = TIPE_BUKTI[file.type];
  if (dariTipe) return dariTipe;
  const e = file.name.split(".").pop()?.toLowerCase() ?? "";
  return e === "jpeg" ? "jpg" : e;
}

export function formatUkuran(byte: number): string {
  if (byte < 1024 * 1024) return `${Math.max(1, Math.round(byte / 1024))} KB`;
  return `${(byte / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}
