import { buatClientBrowser } from "@/lib/supabase/browser";
import { cekBukti, ekstensiBukti } from "@/lib/validasi/bukti";
import { cekDokumenPengajar, cekFotoPengajar, ekstensiFilePengajar } from "@/lib/validasi/mengajar";
import { cekFileQris, ekstensiQris } from "@/lib/validasi/admin";
import { pakaiMock } from "./sumber";

/**
 * Unggah file langsung dari browser ke bucket Supabase (PRD bagian 9).
 * Mode mock: file tidak diunggah, hanya path yang dikembalikan.
 */
async function unggahKeBucket(
  bucket: string,
  prefix: string,
  file: File,
  cek: (f: { name: string; size: number; type: string }) => string | null,
  ekstensi: (f: { name: string; type: string }) => string,
): Promise<string> {
  if (cek(file)) throw new Error("FILE_TIDAK_VALID");
  const path = `${prefix}/${crypto.randomUUID()}.${ekstensi(file)}`;
  if (pakaiMock) return path;
  const { error } = await buatClientBrowser()
    .storage.from(bucket)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error("FILE_TIDAK_VALID");
  return path;
}

/** Bucket privat `bukti-bayar`, path `{booking_id}/{uuid}.{ext}` (maks 2 MB). */
export function unggahBuktiBayar(bookingId: string, file: File): Promise<string> {
  return unggahKeBucket("bukti-bayar", bookingId, file, cekBukti, ekstensiBukti);
}

/** Bucket publik `foto-pengajar`, path `{penggunaId}/{uuid}.{ext}` (maks 1 MB). */
export function unggahFotoPengajar(penggunaId: string, file: File): Promise<string> {
  return unggahKeBucket("foto-pengajar", penggunaId, file, cekFotoPengajar, ekstensiFilePengajar);
}

/** Bucket privat `dokumen-pengajar`, path `{penggunaId}/{uuid}.{ext}` (maks 2 MB). */
export function unggahDokumenPengajar(penggunaId: string, file: File): Promise<string> {
  return unggahKeBucket("dokumen-pengajar", penggunaId, file, cekDokumenPengajar, ekstensiFilePengajar);
}

/** Bucket privat `pengaturan`, path `qris-{uuid}.{ext}` (maks 1 MB, SERAH-TERIMA-FE.md). */
export async function unggahGambarQris(file: File): Promise<string> {
  if (cekFileQris(file)) throw new Error("FILE_TIDAK_VALID");
  const path = `qris-${crypto.randomUUID()}.${ekstensiQris(file)}`;
  if (pakaiMock) return path;
  const { error } = await buatClientBrowser()
    .storage.from("pengaturan")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error("FILE_TIDAK_VALID");
  return path;
}
