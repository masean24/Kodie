/** Kode error RPC (PRD bagian 8) ke pesan bahasa Indonesia. */
export const PESAN_ERROR: Record<string, string> = {
  VALIDASI_GAGAL: "Ada data yang belum lengkap atau formatnya salah. Periksa lagi isian Anda.",
  TIDAK_BERHAK: "Anda tidak punya akses untuk melakukan ini.",
  SISWA_BELUM_DISETUJUI: "Akun siswa belum disetujui orang tua, jadi belum bisa memesan kelas.",
  PENGAJAR_BELUM_TERVERIFIKASI: "Akun pengajar belum diverifikasi admin, jadi belum bisa membuka kelas.",
  KAPASITAS_TIDAK_VALID: "Kapasitas maksimal 10 siswa untuk SD dan 15 siswa untuk SMP dan SMA.",
  TOKEN_TIDAK_BERLAKU: "Link tidak berlaku.",
  KELAS_PENUH: "Maaf, kursi di kelas ini sudah habis.",
  KELAS_MASIH_TERSEDIA: "Kelas ini masih punya kursi kosong. Silakan pesan langsung.",
  SUDAH_TERDAFTAR: "Anda sudah masuk daftar tunggu kelas ini.",
  TAUTAN_KEDALUWARSA: "Tautan atur ulang password sudah tidak berlaku. Minta tautan baru.",
  MOCK_TANPA_EMAIL: "Mode mock tidak mengirim email, jadi password tidak bisa diatur ulang di sini.",
  BOOKING_GANDA: "Siswa ini sudah punya pesanan aktif di kelas yang sama.",
  JADWAL_BENTROK: "Jadwal ini bertabrakan dengan sesi lain milik Anda.",
  FILE_TIDAK_VALID: "File tidak valid. Gunakan JPG, PNG, atau PDF dengan ukuran sesuai batas.",
  SESI_BELUM_DIBUKA: "Kelas bisa dimasuki mulai 15 menit sebelum sesi dimulai.",
  LINK_MEET_BELUM_ADA: "Link kelas belum siap. Coba lagi beberapa menit lagi atau hubungi admin.",
  LAPORAN_TERKUNCI: "Laporan sudah terkunci karena lewat 24 jam sejak dikirim.",
  // Kode baru dari spesifikasi saran pembimbing (2026-11-28, docs/KEPUTUSAN.md)
  KODE_REFERRAL_TIDAK_VALID: "Kode referral tidak dikenal atau bukan milik pengajar kelas ini.",
  TRIAL_SUDAH_DIPAKAI: "Anak ini sudah pernah memakai trial gratis. Silakan pesan paket penuh.",
  TRIAL_TIDAK_TERSEDIA: "Trial hanya bisa diambil sebelum Sesi 1 kelas dimulai.",
  FITUR_BELUM_TERSEDIA: "Fitur ini belum aktif. Coba lagi nanti atau hubungi admin.",
  // Kode frontend untuk error Supabase Auth (PRD bagian 8: dipetakan frontend dari respons Auth)
  EMAIL_SUDAH_DIPAKAI: "Email sudah dipakai.",
  LOGIN_GAGAL: "Email atau password salah.",
  EMAIL_BELUM_DIKONFIRMASI: "Email belum dikonfirmasi. Buka tautan konfirmasi di kotak masuk email Anda.",
  PASSWORD_LEMAH: "Password terlalu lemah. Gunakan minimal 8 karakter yang tidak mudah ditebak.",
  TERLALU_BANYAK_PERCOBAAN: "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.",
  PENDAFTARAN_DITUTUP: "Pendaftaran sedang ditutup. Coba lagi nanti.",
};

/** Petakan kode error Supabase Auth (`error.code`) ke kode frontend di atas. */
export function kodeErrorAuth(error: { code?: string; message?: string; status?: number }): string {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "EMAIL_SUDAH_DIPAKAI";
    case "invalid_credentials":
      return "LOGIN_GAGAL";
    case "email_not_confirmed":
      return "EMAIL_BELUM_DIKONFIRMASI";
    case "weak_password":
      return "PASSWORD_LEMAH";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "TERLALU_BANYAK_PERCOBAAN";
    case "signup_disabled":
      return "PENDAFTARAN_DITUTUP";
  }
  if (error.status === 429) return "TERLALU_BANYAK_PERCOBAAN";
  // Trigger database melempar kode error PRD (mis. VALIDASI_GAGAL) di pesan.
  return error.message && error.message in PESAN_ERROR ? error.message : "UMUM";
}

export const PESAN_UMUM = "Terjadi kesalahan, coba lagi.";

/** Ambil pesan untuk ditampilkan. Pesan mentah dari server tidak pernah ditampilkan. */
export function pesanError(error: unknown): string {
  const kode = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return PESAN_ERROR[kode] ?? PESAN_UMUM;
}
