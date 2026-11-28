import { buatClientBrowser } from "@/lib/supabase/browser";
import { buatUuid } from "@/lib/uuid";
import { uraiQrisStatis } from "@/lib/qris";
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
  const path = `${prefix}/${buatUuid()}.${ekstensi(file)}`;
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
  const path = `qris-${buatUuid()}.${ekstensiQris(file)}`;
  if (pakaiMock) return path;
  const { error } = await buatClientBrowser()
    .storage.from("pengaturan")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error("FILE_TIDAK_VALID");
  return path;
}

/**
 * Membaca payload string EMVCo QRIS dari file gambar yang diunggah admin di browser.
 * Mengembalikan null bila gambar tidak memuat kode QR EMVCo QRIS IDR yang valid.
 */
export async function ekstrakPayloadGambarQris(file: File): Promise<string | null> {
  if (typeof window === "undefined" || typeof createImageBitmap !== "function") return null;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const { default: jsQR } = await import("jsqr");

    const pindaiSkala = (batasSisi: number): string | null => {
      if (!bitmap) return null;
      const faktor = Math.min(1, batasSisi / Math.max(bitmap.width, bitmap.height, 1));
      const lebar = Math.max(1, Math.round(bitmap.width * faktor));
      const tinggi = Math.max(1, Math.round(bitmap.height * faktor));
      const kanvas = document.createElement("canvas");
      kanvas.width = lebar;
      kanvas.height = tinggi;
      const ctx = kanvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, lebar, tinggi);
      ctx.drawImage(bitmap, 0, 0, lebar, tinggi);
      const data = ctx.getImageData(0, 0, lebar, tinggi);
      const hasil = jsQR(data.data, lebar, tinggi);
      if (!hasil?.data) return null;
      const kandidat = hasil.data.trim();
      return uraiQrisStatis(kandidat).valid ? kandidat : null;
    };

    return pindaiSkala(1200) ?? pindaiSkala(600);
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}
