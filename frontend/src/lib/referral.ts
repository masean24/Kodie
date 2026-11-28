/**
 * Aturan kode referral & bagi hasil pengajar (keputusan 2026-11-28, docs/KEPUTUSAN.md):
 * - Bagian pengajar 30% dari pembayaran tiap siswa terkonfirmasi, dibagi rata ke 4 sesi.
 * - Siswa yang memesan dengan kode referral pengajar kelas itu: bagian pengajar 40% (30% + 10%),
 *   dan orang tua mendapat potongan 5% dari harga paket.
 * - Trial gratis bernilai Rp0, jadi tidak menambah honor.
 */
export const PERSEN_BAGI_HASIL = 30;
export const PERSEN_BONUS_REFERRAL = 10;
export const PERSEN_POTONGAN_REFERRAL = 5;

/** Format kode: huruf besar, angka, dan tanda hubung, 4–20 karakter. */
const POLA_KODE = /^[A-Z0-9-]{4,20}$/;

export function normalisasiKode(kode: string): string {
  return kode.trim().toUpperCase().replace(/\s+/g, "");
}

export function kodeValid(kode: string): boolean {
  return POLA_KODE.test(normalisasiKode(kode));
}

/** Potongan rupiah untuk pemakai kode referral (dibulatkan ke bawah ke rupiah penuh). */
export function hitungPotongan(hargaPaket: number): number {
  return Math.floor((hargaPaket * PERSEN_POTONGAN_REFERRAL) / 100);
}

/**
 * Honor pengajar per sesi untuk satu kelas: Σ (total bayar siswa × persentase) ÷ jumlah sesi.
 * `peserta` hanya berisi siswa terkonfirmasi/selesai; `total` sudah dikurangi potongan referral.
 */
export function hitungHonorPerSesi(
  peserta: { total: number; pakaiReferral: boolean }[],
  jumlahSesi: number,
): number {
  if (jumlahSesi <= 0) return 0;
  const bagian = peserta.reduce(
    (n, p) => n + (p.total * (PERSEN_BAGI_HASIL + (p.pakaiReferral ? PERSEN_BONUS_REFERRAL : 0))) / 100,
    0,
  );
  return Math.round(bagian / jumlahSesi);
}

/** Kode referral acak untuk pengajar: 5 huruf pertama nama + 4 karakter acak, mis. "NADIA-K7Q2". */
export function buatKodeAcak(nama: string, acak: () => number = Math.random): string {
  const awalan = nama
    .normalize("NFD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 5) || "KODIE";
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let akhir = "";
  for (let i = 0; i < 4; i++) akhir += huruf[Math.floor(acak() * huruf.length)];
  return `${awalan}-${akhir}`;
}

const KUNCI_SIMPAN = "kodie:kode-referral";

/**
 * Simpan kode dari tautan bagikan (sisi klien) beserta pengajar pemiliknya, supaya kode hanya diisi otomatis
 * saat memesan kelas pengajar itu. Gagal diam-diam bila penyimpanan diblokir.
 */
export function simpanKodeReferral(kode: string, pengajarId: string): void {
  if (!kodeValid(kode)) return;
  try {
    window.localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ kode: normalisasiKode(kode), pengajarId }));
  } catch {
    // Penyimpanan diblokir (mode privat): kode tetap bisa diketik manual.
  }
}

/** Kode tersimpan untuk pengajar kelas yang sedang dipesan; kosong bila milik pengajar lain. */
export function bacaKodeReferral(pengajarId: string): string {
  try {
    const isi = JSON.parse(window.localStorage.getItem(KUNCI_SIMPAN) ?? "null") as { kode?: unknown; pengajarId?: unknown } | null;
    return isi && isi.pengajarId === pengajarId && typeof isi.kode === "string" && kodeValid(isi.kode) ? isi.kode : "";
  } catch {
    return "";
  }
}
