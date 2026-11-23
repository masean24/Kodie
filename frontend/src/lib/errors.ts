/** Kode error RPC (PRD bagian 8) ke pesan bahasa Indonesia. */
export const PESAN_ERROR: Record<string, string> = {
  VALIDASI_GAGAL: "Ada data yang belum lengkap atau formatnya salah. Periksa lagi isian Anda.",
  TIDAK_BERHAK: "Anda tidak punya akses untuk melakukan ini.",
  SISWA_BELUM_DISETUJUI: "Akun siswa belum disetujui orang tua, jadi belum bisa memesan kelas.",
  PENGAJAR_BELUM_TERVERIFIKASI: "Akun pengajar belum diverifikasi admin, jadi belum bisa membuka kelas.",
  KAPASITAS_TIDAK_VALID: "Kapasitas maksimal 10 siswa untuk SD dan 15 siswa untuk SMP dan SMA.",
  TOKEN_TIDAK_BERLAKU: "Link tidak berlaku.",
  KELAS_PENUH: "Maaf, kursi di kelas ini sudah habis.",
  BOOKING_GANDA: "Siswa ini sudah punya pesanan aktif di kelas yang sama.",
  JADWAL_BENTROK: "Jadwal ini bertabrakan dengan sesi lain milik Anda.",
  FILE_TIDAK_VALID: "File tidak valid. Gunakan JPG, PNG, atau PDF dengan ukuran sesuai batas.",
  SESI_BELUM_DIBUKA: "Kelas bisa dimasuki mulai 15 menit sebelum sesi dimulai.",
  LINK_MEET_BELUM_ADA: "Link kelas belum siap. Coba lagi beberapa menit lagi atau hubungi admin.",
  LAPORAN_TERKUNCI: "Laporan sudah terkunci karena lewat 24 jam sejak dikirim.",
};

export const PESAN_UMUM = "Terjadi kesalahan, coba lagi.";

/** Ambil pesan untuk ditampilkan. Pesan mentah dari server tidak pernah ditampilkan. */
export function pesanError(error: unknown): string {
  const kode = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return PESAN_ERROR[kode] ?? PESAN_UMUM;
}
