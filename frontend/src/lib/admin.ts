import type {
  Booking,
  Honor,
  ItemPendaftarTrialAdmin,
  KelasKatalog,
  KodeReferral,
  LaporanMasalah,
  Pengguna,
  ProfilPengajar,
  SesiSaya,
  Siswa,
  StatistikPlatformAdmin,
} from "@/types/database";

export type UrutanAntrean = "terlama" | "terbaru";

/**
 * Tombol Setujui pengajar hanya aktif jika KTP/KTM dan SKCK sudah diunggah,
 * wawancara sudah dicentang, dan minimal 1 program disetujui (PRD F7).
 */
export function bolehSetujuiPengajar(
  profil: Pick<ProfilPengajar, "identitas_path" | "skck_path" | "wawancara_selesai"> | null,
  jumlahProgramDipilih: number,
): boolean {
  if (!profil) return false;
  return Boolean(profil.identitas_path && profil.skck_path && profil.wawancara_selesai && jumlahProgramDipilih > 0);
}

/** Urutkan daftar berdasarkan waktu: "terlama" (paling lama menunggu dulu, PRD F14) atau "terbaru". */
export function urutkanAntreanWaktu<T>(
  daftar: T[],
  ambilWaktu: (item: T) => string,
  urutan: UrutanAntrean = "terlama",
): T[] {
  return [...daftar].sort((a, b) => {
    const wa = ambilWaktu(a);
    const wb = ambilWaktu(b);
    return urutan === "terlama" ? wa.localeCompare(wb) : wb.localeCompare(wa);
  });
}

/**
 * Laporan kategori `perilaku_tidak_pantas` (prioritas tinggi) selalu tampil paling atas (PRD F12),
 * lalu diurutkan menurut waktu menunggu.
 */
export function urutkanLaporanMasalah<
  T extends Pick<LaporanMasalah, "kategori" | "prioritas" | "dibuat_pada">,
>(daftar: T[], urutan: UrutanAntrean = "terlama"): T[] {
  return [...daftar].sort((a, b) => {
    const pa = a.kategori === "perilaku_tidak_pantas" || a.prioritas === "tinggi" ? 0 : 1;
    const pb = b.kategori === "perilaku_tidak_pantas" || b.prioritas === "tinggi" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return urutan === "terlama"
      ? a.dibuat_pada.localeCompare(b.dibuat_pada)
      : b.dibuat_pada.localeCompare(a.dibuat_pada);
  });
}

/** Teks lama menunggu untuk baris antrean admin (Figma 11: "Menunggu 3 jam", "Menunggu 40 menit"). */
export function formatLamaMenunggu(iso: string, sekarang: Date): string {
  const selisihMenit = Math.max(1, Math.floor((sekarang.getTime() - new Date(iso).getTime()) / 60_000));
  if (selisihMenit < 60) return `Menunggu ${selisihMenit} menit`;
  const selisihJam = Math.floor(selisihMenit / 60);
  if (selisihJam < 24) return `Menunggu ${selisihJam} jam`;
  const selisihHari = Math.floor(selisihJam / 24);
  return `Menunggu ${selisihHari} hari`;
}

export const LABEL_STATUS_PEMBAYARAN = {
  menunggu: "Menunggu verifikasi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
} as const;

export const LABEL_STATUS_MASALAH = {
  baru: "Baru",
  ditinjau: "Ditinjau",
  selesai: "Selesai",
} as const;

export function persenKonversiTrial(konversi: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((konversi / total) * 100);
}

/**
 * Menghitung ringkasan statistik platform (pengguna per peran, omzet & bagi hasil 30%/40%,
 * serta pendaftar trial gratis Sesi 1 beserta konversi paket) dari data domain.
 */
export function hitungStatistikPlatform(input: {
  pengguna: Pick<Pengguna, "id" | "peran" | "status" | "nama">[];
  siswa: Pick<Siswa, "id" | "nama" | "jenjang" | "kelas" | "pengguna_id">[];
  booking: Pick<
    Booking,
    "id" | "kode" | "kelas_id" | "siswa_id" | "dibuat_oleh" | "status" | "total" | "dibuat_pada" | "jenis" | "kode_referral" | "potongan"
  >[];
  kelas: Pick<KelasKatalog, "id" | "pengajar_id" | "pengajar_nama" | "program_nama" | "program_slug" | "level">[];
  sesi: Pick<SesiSaya, "kelas_id" | "nomor" | "mulai_pada" | "status">[];
  honor: Pick<Honor, "jumlah" | "status">[];
  kodeReferral: Pick<KodeReferral, "pengajar_id" | "kode">[];
}): StatistikPlatformAdmin {
  const penggunaMap = new Map(input.pengguna.map((p) => [p.id, p]));
  const siswaMap = new Map(input.siswa.map((s) => [s.id, s]));
  const kelasMap = new Map(input.kelas.map((k) => [k.id, k]));

  const kodePerPengajar = new Map<string, Set<string>>();
  for (const r of input.kodeReferral) {
    const set = kodePerPengajar.get(r.pengajar_id) ?? new Set<string>();
    set.add(r.kode);
    kodePerPengajar.set(r.pengajar_id, set);
  }

  const orangTua = input.pengguna.filter((u) => u.peran === "orang_tua" && u.status !== "nonaktif").length;
  const siswaMandiri = input.pengguna.filter((u) => u.peran === "siswa" && u.status !== "nonaktif").length;
  const pengajarTerverifikasi = input.pengguna.filter(
    (u) => u.peran === "pengajar" && u.status === "terverifikasi",
  ).length;
  const pengajarMenunggu = input.pengguna.filter(
    (u) => u.peran === "pengajar" && u.status === "menunggu_verifikasi",
  ).length;
  const profilSiswa = input.siswa.filter(
    (s) => !s.pengguna_id || penggunaMap.get(s.pengguna_id)?.status === "aktif",
  ).length;

  const isStatusLunas = (status: Booking["status"]) => status === "terkonfirmasi" || status === "selesai";
  const paketLunas = input.booking.filter((b) => (b.jenis ?? "paket") === "paket" && isStatusLunas(b.status));

  let omzetKotor = 0;
  let bagianPengajar = 0;
  let bookingReferral = 0;
  let totalPotonganReferral = 0;

  for (const b of paketLunas) {
    omzetKotor += b.total;
    const k = kelasMap.get(b.kelas_id);
    const pakaiRefPengajar = Boolean(
      b.kode_referral && k && kodePerPengajar.get(k.pengajar_id)?.has(b.kode_referral),
    );
    bagianPengajar += Math.round(b.total * (pakaiRefPengajar ? 0.4 : 0.3));
    if (b.kode_referral) bookingReferral += 1;
    totalPotonganReferral += b.potongan ?? 0;
  }

  const honorTercatat = input.honor.reduce((acc, h) => acc + h.jumlah, 0);
  const honorDibayar = input.honor
    .filter((h) => h.status === "dibayar")
    .reduce((acc, h) => acc + h.jumlah, 0);

  const trialValid = input.booking.filter((b) => b.jenis === "trial" && isStatusLunas(b.status));
  const waktuMs = (iso: string) => new Date(iso).getTime();
  const sudahKonversi = (bTrial: (typeof trialValid)[number]) =>
    paketLunas.some((bp) => bp.siswa_id === bTrial.siswa_id && waktuMs(bp.dibuat_pada) >= waktuMs(bTrial.dibuat_pada));

  let trialAktif = 0;
  let trialSelesai = 0;
  let trialKonversi = 0;
  for (const t of trialValid) {
    if (t.status === "terkonfirmasi") trialAktif += 1;
    if (t.status === "selesai") trialSelesai += 1;
    if (sudahKonversi(t)) trialKonversi += 1;
  }

  const sesi1ByKelas = new Map(
    input.sesi.filter((s) => s.nomor === 1).map((s) => [s.kelas_id, s]),
  );

  const daftarTerbaru: ItemPendaftarTrialAdmin[] = [...trialValid]
    .sort((a, b) => waktuMs(b.dibuat_pada) - waktuMs(a.dibuat_pada))
    .slice(0, 10)
    .map((b) => {
      const s = siswaMap.get(b.siswa_id);
      const pemesan = penggunaMap.get(b.dibuat_oleh);
      const k = kelasMap.get(b.kelas_id);
      const s1 = sesi1ByKelas.get(b.kelas_id);
      return {
        booking_id: b.id,
        kode: b.kode,
        status: b.status,
        dibuat_pada: b.dibuat_pada,
        siswa_id: b.siswa_id,
        siswa_nama: s?.nama ?? "Siswa",
        siswa_jenjang: s?.jenjang ?? "SD",
        siswa_kelas: s?.kelas ?? 1,
        pemesan_nama: pemesan?.nama ?? "Pengguna",
        pemesan_peran: pemesan?.peran ?? "orang_tua",
        kelas_id: b.kelas_id,
        program_nama: k?.program_nama ?? "Program",
        program_slug: k?.program_slug ?? "coding-dasar",
        kelas_level: k?.level ?? 1,
        pengajar_nama: k?.pengajar_nama ?? "Pengajar",
        sesi_1_mulai_pada: s1?.mulai_pada ?? null,
        sesi_1_status: s1?.status ?? null,
        sudah_lanjut_paket: sudahKonversi(b),
      };
    });

  return {
    pengguna: {
      total: orangTua + siswaMandiri + pengajarTerverifikasi + pengajarMenunggu,
      orang_tua: orangTua,
      siswa_mandiri: siswaMandiri,
      pengajar_terverifikasi: pengajarTerverifikasi,
      pengajar_menunggu: pengajarMenunggu,
      profil_siswa: profilSiswa,
    },
    pendapatan: {
      omzet_kotor: omzetKotor,
      bagian_pengajar: bagianPengajar,
      pendapatan_bersih_platform: omzetKotor - bagianPengajar,
      honor_tercatat: honorTercatat,
      honor_dibayar: honorDibayar,
      booking_lunas: paketLunas.length,
      booking_referral: bookingReferral,
      total_potongan_referral: totalPotonganReferral,
    },
    trial: {
      total: trialValid.length,
      aktif: trialAktif,
      selesai: trialSelesai,
      konversi_paket: trialKonversi,
      daftar_terbaru: daftarTerbaru,
    },
  };
}
