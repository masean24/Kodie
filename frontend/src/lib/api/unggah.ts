import { buatClientBrowser } from "@/lib/supabase/browser";
import { cekBukti, ekstensiBukti } from "@/lib/validasi/bukti";
import { pakaiMock } from "./sumber";

/**
 * Unggah bukti bayar dari browser ke bucket privat `bukti-bayar` di path `{booking_id}/{uuid}.{ext}`
 * (PRD bagian 9). Langsung dari browser karena batas body Server Function bawaan 1 MB, sedangkan file boleh 2 MB.
 * Mode mock: file tidak diunggah ke mana pun, hanya path yang dikembalikan.
 * Kembalikan path untuk RPC `kirim_bukti_bayar`. Lempar Error berisi kode jika gagal.
 */
export async function unggahBuktiBayar(bookingId: string, file: File): Promise<string> {
  if (cekBukti(file)) throw new Error("FILE_TIDAK_VALID");
  const path = `${bookingId}/${crypto.randomUUID()}.${ekstensiBukti(file)}`;
  if (pakaiMock) return path;
  const { error } = await buatClientBrowser()
    .storage.from("bukti-bayar")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error("FILE_TIDAK_VALID");
  return path;
}
