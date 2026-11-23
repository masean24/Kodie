import { connection } from "next/server";
import type {
  AdminRingkasan,
  Booking,
  Honor,
  KelasKatalog,
  LaporanMasalah,
  LogAdmin,
  Pembayaran,
  PengajarProgram,
  Pengguna,
  ProfilPengajar,
  Program,
  SesiAdmin,
  StatusHonor,
  StatusKelas,
  StatusMasalah,
  StatusPengguna,
} from "@/types/database";
import { bolehSetujuiPengajar, urutkanAntreanWaktu, urutkanLaporanMasalah, type UrutanAntrean } from "@/lib/admin";
import { STATUS_AKTIF } from "@/lib/booking";
import { buatKelasMock, programMock } from "@/lib/mock/data";
import { storeMock } from "@/lib/mock/store";
import { clientPublik } from "@/lib/supabase/publik";
import { buatClientServer } from "@/lib/supabase/server";
import type {
  InputPengaturanRekening,
  InputUbahKelasAdmin,
  InputUbahProgram,
} from "@/lib/validasi/admin";
import { ambilPenggunaSaya, daftarPenggunaMock } from "./auth";
import type { SiswaRingkas } from "./booking";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Area Admin (PRD F5–F8, F12–F14). Hanya untuk server (memakai sesi di cookie). */

async function wajibAdmin(): Promise<Pengguna> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p || p.peran !== "admin") throw new Error("TIDAK_BERHAK");
  return p;
}

function catatLogMock(adminId: string, aksi: string, targetTipe: string, targetId: string, detail?: Record<string, unknown>) {
  storeMock().logAdmin.unshift({
    id: crypto.randomUUID(),
    admin_id: adminId,
    aksi,
    target_tipe: targetTipe,
    target_id: targetId,
    detail: detail ?? null,
    dibuat_pada: new Date().toISOString(),
  });
}

export async function ambilRingkasanAdmin(): Promise<AdminRingkasan> {
  await wajibAdmin();
  const sekarang = new Date();
  if (pakaiMock) {
    const store = storeMock();
    const pengguna = daftarPenggunaMock();
    const kelas = buatKelasMock(sekarang);
    return {
      siswa_aktif: store.siswa.length,
      kelas_berjalan: kelas.filter((k) => k.status === "berjalan" || k.status === "terbuka").length,
      booking_menunggu_verifikasi: store.pembayaran.filter((p) => p.status === "menunggu").length,
      pengajar_menunggu_verifikasi: pengguna.filter(
        (u) => u.peran === "pengajar" && u.status === "menunggu_verifikasi",
      ).length,
      laporan_masalah_baru: store.laporanMasalah.filter((l) => l.status === "baru").length,
      honor_belum_dibayar: store.honor.filter((h) => h.status === "belum_dibayar").length,
      sesi_tanpa_meet: store.sesiTanpaMeetIds.length,
    };
  }

  const supabase = await buatClientServer();
  const [ringRes, honorRes, sesiRes] = await Promise.all([
    supabase.from("admin_ringkasan").select("*").maybeSingle(),
    supabase.from("honor").select("id", { count: "exact", head: true }).eq("status", "belum_dibayar"),
    supabase.from("sesi").select("id", { count: "exact", head: true }).is("meet_uri", null).neq("status", "dibatalkan"),
  ]);
  lemparJikaError(ringRes.error);
  const r = (ringRes.data as AdminRingkasan | null) ?? {
    siswa_aktif: 0,
    kelas_berjalan: 0,
    booking_menunggu_verifikasi: 0,
    pengajar_menunggu_verifikasi: 0,
    laporan_masalah_baru: 0,
  };
  return {
    ...r,
    honor_belum_dibayar: honorRes.count ?? 0,
    sesi_tanpa_meet: sesiRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Pembayaran (F6)
// ---------------------------------------------------------------------------

export interface AntreanPembayaranItem {
  pembayaran: Pembayaran;
  booking: Booking;
  siswa: SiswaRingkas | null;
  kelas: KelasKatalog | null;
}

export async function ambilAntreanPembayaran(
  filterStatus: "menunggu" | "disetujui" | "ditolak" | "semua" = "menunggu",
  urutan: UrutanAntrean = "terlama",
): Promise<AntreanPembayaranItem[]> {
  await wajibAdmin();
  const sekarang = new Date();

  let pembayaran: Pembayaran[];
  let booking: Booking[];
  let siswa: SiswaRingkas[];
  let kelas: KelasKatalog[];

  if (pakaiMock) {
    const store = storeMock();
    pembayaran =
      filterStatus === "semua" ? store.pembayaran : store.pembayaran.filter((p) => p.status === filterStatus);
    booking = store.booking;
    siswa = store.siswa;
    kelas = buatKelasMock(sekarang);
  } else {
    const supabase = await buatClientServer();
    let q = supabase.from("pembayaran").select("*");
    if (filterStatus !== "semua") q = q.eq("status", filterStatus);
    const { data: pemData, error: pemErr } = await q;
    lemparJikaError(pemErr);
    pembayaran = (pemData ?? []) as Pembayaran[];
    if (pembayaran.length === 0) return [];

    const bookingIds = [...new Set(pembayaran.map((p) => p.booking_id))];
    const { data: bData, error: bErr } = await supabase.from("booking").select("*").in("id", bookingIds);
    lemparJikaError(bErr);
    booking = (bData ?? []) as Booking[];

    const siswaIds = [...new Set(booking.map((b) => b.siswa_id))];
    const kelasIds = [...new Set(booking.map((b) => b.kelas_id))];

    const [sRes, kRes] = await Promise.all([
      siswaIds.length ? supabase.from("siswa").select("id, nama, jenjang, kelas").in("id", siswaIds) : Promise.resolve({ data: [], error: null }),
      kelasIds.length ? clientPublik().from("kelas_katalog").select("*").in("id", kelasIds) : Promise.resolve({ data: [], error: null }),
    ]);
    lemparJikaError(sRes.error);
    lemparJikaError(kRes.error);
    siswa = (sRes.data ?? []) as SiswaRingkas[];
    kelas = (kRes.data ?? []) as KelasKatalog[];
  }

  const hasil: AntreanPembayaranItem[] = [];
  for (const pem of pembayaran) {
    const b = booking.find((x) => x.id === pem.booking_id);
    if (!b) continue;
    hasil.push({
      pembayaran: pem,
      booking: b,
      siswa: siswa.find((s) => s.id === b.siswa_id) ?? null,
      kelas: kelas.find((k) => k.id === b.kelas_id) ?? null,
    });
  }

  return urutkanAntreanWaktu(hasil, (x) => x.pembayaran.diunggah_pada, urutan);
}

export async function ambilDetailPembayaranAdmin(
  pembayaranId: string,
): Promise<(AntreanPembayaranItem & { buktiSignedUrl: string | null }) | null> {
  await wajibAdmin();
  const semua = await ambilAntreanPembayaran("semua", "terlama");
  const item = semua.find((x) => x.pembayaran.id === pembayaranId);
  if (!item) return null;

  if (pakaiMock) {
    return { ...item, buktiSignedUrl: null };
  }
  const supabase = await buatClientServer();
  const { data } = await supabase.storage.from("bukti-bayar").createSignedUrl(item.pembayaran.bukti_path, 300);
  return { ...item, buktiSignedUrl: data?.signedUrl ?? null };
}

export async function adminSetujuiPembayaran(pembayaranId: string): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const pem = store.pembayaran.find((x) => x.id === pembayaranId);
    if (!pem) throw new Error("VALIDASI_GAGAL");
    const b = store.booking.find((x) => x.id === pem.booking_id);
    if (!b) throw new Error("VALIDASI_GAGAL");

    const sekarang = new Date().toISOString();
    pem.status = "disetujui";
    pem.diverifikasi_oleh = admin.id;
    pem.diverifikasi_pada = sekarang;
    b.status = "terkonfirmasi";

    const st = store.siswa.find((s) => s.id === b.siswa_id);
    const prefix = st?.pengguna_id === b.dibuat_oleh ? "/siswa" : "/orang-tua";
    store.notifikasi.push({
      id: crypto.randomUUID(),
      pengguna_id: b.dibuat_oleh,
      tipe: "booking_status",
      judul: `Pembayaran ${b.kode} disetujui`,
      isi: "Booking Anda telah terkonfirmasi. Tombol Masuk kelas aktif 15 menit sebelum sesi.",
      tautan: `${prefix}/booking/${b.id}`,
      dibaca_pada: null,
      dibuat_pada: sekarang,
    });
    catatLogMock(admin.id, "setujui_pembayaran", "pembayaran", pem.id, { kode_booking: b.kode });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_setujui_pembayaran", { p_pembayaran_id: pembayaranId });
  lemparJikaError(error);
}

export async function adminTolakPembayaran(pembayaranId: string, alasan: string): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const pem = store.pembayaran.find((x) => x.id === pembayaranId);
    if (!pem) throw new Error("VALIDASI_GAGAL");
    const b = store.booking.find((x) => x.id === pem.booking_id);
    if (!b) throw new Error("VALIDASI_GAGAL");

    const sekarang = Date.now();
    pem.status = "ditolak";
    pem.alasan_penolakan = alasan.trim();
    pem.diverifikasi_oleh = admin.id;
    pem.diverifikasi_pada = new Date(sekarang).toISOString();
    b.status = "menunggu_pembayaran";
    b.batas_bayar_pada = new Date(sekarang + 24 * 3_600_000).toISOString();

    const st = store.siswa.find((s) => s.id === b.siswa_id);
    const prefix = st?.pengguna_id === b.dibuat_oleh ? "/siswa" : "/orang-tua";
    store.notifikasi.push({
      id: crypto.randomUUID(),
      pengguna_id: b.dibuat_oleh,
      tipe: "booking_status",
      judul: `Bukti bayar ${b.kode} ditolak`,
      isi: alasan.trim(),
      tautan: `${prefix}/booking/${b.id}`,
      dibaca_pada: null,
      dibuat_pada: new Date(sekarang).toISOString(),
    });
    catatLogMock(admin.id, "tolak_pembayaran", "pembayaran", pem.id, { kode_booking: b.kode, alasan: alasan.trim() });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_tolak_pembayaran", {
    p_pembayaran_id: pembayaranId,
    p_alasan: alasan.trim(),
  });
  lemparJikaError(error);
}

// ---------------------------------------------------------------------------
// Pengajar & Pengguna (F7, F14)
// ---------------------------------------------------------------------------

export interface AntreanPengajarItem {
  pengguna: Pengguna;
  profil: ProfilPengajar | null;
  programDipilih: PengajarProgram[];
}

export async function ambilAntreanPengajarAdmin(
  filterStatus: "menunggu_verifikasi" | "terverifikasi" | "ditolak" | "nonaktif" | "semua" = "menunggu_verifikasi",
  urutan: UrutanAntrean = "terlama",
): Promise<AntreanPengajarItem[]> {
  await wajibAdmin();

  let pengguna: Pengguna[];
  let profil: ProfilPengajar[];
  let program: PengajarProgram[];

  if (pakaiMock) {
    const store = storeMock();
    pengguna = daftarPenggunaMock().filter((u) => u.peran === "pengajar");
    if (filterStatus !== "semua") pengguna = pengguna.filter((u) => u.status === filterStatus);
    profil = store.profilPengajar;
    program = store.pengajarProgram;
  } else {
    const supabase = await buatClientServer();
    let q = supabase.from("pengguna").select("*").eq("peran", "pengajar");
    if (filterStatus !== "semua") q = q.eq("status", filterStatus);
    const { data: uData, error: uErr } = await q;
    lemparJikaError(uErr);
    pengguna = (uData ?? []) as Pengguna[];
    if (pengguna.length === 0) return [];

    const ids = pengguna.map((u) => u.id);
    const [pRes, ppRes] = await Promise.all([
      supabase.from("profil_pengajar").select("*").in("pengguna_id", ids),
      supabase.from("pengajar_program").select("*").in("pengajar_id", ids),
    ]);
    lemparJikaError(pRes.error);
    lemparJikaError(ppRes.error);
    profil = (pRes.data ?? []) as ProfilPengajar[];
    program = (ppRes.data ?? []) as PengajarProgram[];
  }

  const hasil: AntreanPengajarItem[] = pengguna.map((u) => ({
    pengguna: u,
    profil: profil.find((p) => p.pengguna_id === u.id) ?? null,
    programDipilih: program.filter((pp) => pp.pengajar_id === u.id),
  }));

  return urutkanAntreanWaktu(hasil, (x) => x.pengguna.dibuat_pada, urutan);
}

export async function ambilDetailPengajarAdmin(pengajarId: string): Promise<
  | (AntreanPengajarItem & {
      semuaProgram: Program[];
      fotoUrl: string | null;
      identitasSignedUrl: string | null;
      skckSignedUrl: string | null;
    })
  | null
> {
  await wajibAdmin();
  const [daftar, semuaProgram] = await Promise.all([
    ambilAntreanPengajarAdmin("semua", "terlama"),
    ambilDaftarProgramAdmin(),
  ]);
  const item = daftar.find((x) => x.pengguna.id === pengajarId);
  if (!item) return null;

  if (pakaiMock) {
    return { ...item, semuaProgram, fotoUrl: null, identitasSignedUrl: null, skckSignedUrl: null };
  }

  const supabase = await buatClientServer();
  const fotoUrl = item.profil?.foto_path
    ? supabase.storage.from("foto-pengajar").getPublicUrl(item.profil.foto_path).data.publicUrl
    : null;
  const [idUrlRes, skckUrlRes] = await Promise.all([
    item.profil?.identitas_path
      ? supabase.storage.from("dokumen-pengajar").createSignedUrl(item.profil.identitas_path, 300)
      : Promise.resolve({ data: null }),
    item.profil?.skck_path
      ? supabase.storage.from("dokumen-pengajar").createSignedUrl(item.profil.skck_path, 300)
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...item,
    semuaProgram,
    fotoUrl,
    identitasSignedUrl: idUrlRes.data?.signedUrl ?? null,
    skckSignedUrl: skckUrlRes.data?.signedUrl ?? null,
  };
}

export async function adminSetWawancara(pengajarId: string, selesai: boolean): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const profil = store.profilPengajar.find((p) => p.pengguna_id === pengajarId);
    if (!profil) throw new Error("VALIDASI_GAGAL");
    profil.wawancara_selesai = selesai;
    catatLogMock(admin.id, "wawancara_pengajar", "pengajar", pengajarId, { selesai });
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_wawancara_selesai", {
    p_pengajar_id: pengajarId,
    p_selesai: selesai,
  });
  lemparJikaError(error);
}

export async function adminSetujuiPengajar(pengajarId: string, programIds: string[]): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const profil = store.profilPengajar.find((p) => p.pengguna_id === pengajarId) ?? null;
    if (!bolehSetujuiPengajar(profil, programIds.length)) throw new Error("VALIDASI_GAGAL");

    const sekarang = new Date().toISOString();
    store.status[pengajarId] = "terverifikasi";
    profil!.alasan_penolakan = null;
    profil!.diverifikasi_pada = sekarang;
    profil!.diverifikasi_oleh = admin.id;

    const pilihanSet = new Set(programIds);
    store.pengajarProgram = [
      ...store.pengajarProgram.filter((pp) => pp.pengajar_id !== pengajarId),
      ...Array.from(pilihanSet).map((program_id) => ({
        pengajar_id: pengajarId,
        program_id,
        disetujui: true,
      })),
    ];

    store.notifikasi.push({
      id: crypto.randomUUID(),
      pengguna_id: pengajarId,
      tipe: "pengajar_status",
      judul: "Akun pengajar disetujui",
      isi: "Selamat! Akun Anda sudah terverifikasi dan siap membuka kelas.",
      tautan: "/mengajar",
      dibaca_pada: null,
      dibuat_pada: sekarang,
    });
    catatLogMock(admin.id, "setujui_pengajar", "pengajar", pengajarId, { program_ids: programIds });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_setujui_pengajar", {
    p_pengajar_id: pengajarId,
    p_program_ids: programIds,
  });
  lemparJikaError(error);
}

export async function adminTolakPengajar(pengajarId: string, alasan: string): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const profil = store.profilPengajar.find((p) => p.pengguna_id === pengajarId);
    if (!profil) throw new Error("VALIDASI_GAGAL");
    const sekarang = new Date().toISOString();
    store.status[pengajarId] = "ditolak";
    profil.alasan_penolakan = alasan.trim();

    store.notifikasi.push({
      id: crypto.randomUUID(),
      pengguna_id: pengajarId,
      tipe: "pengajar_status",
      judul: "Pendaftaran pengajar ditolak",
      isi: alasan.trim(),
      tautan: "/mengajar/profil",
      dibaca_pada: null,
      dibuat_pada: sekarang,
    });
    catatLogMock(admin.id, "tolak_pengajar", "pengajar", pengajarId, { alasan: alasan.trim() });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_tolak_pengajar", {
    p_pengajar_id: pengajarId,
    p_alasan: alasan.trim(),
  });
  lemparJikaError(error);
}

export async function adminNonaktifkanPengguna(
  penggunaId: string,
  alasan: string,
): Promise<{ pengguna_id: string; status: StatusPengguna; booking_terdampak: unknown[] }> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const sekarang = new Date().toISOString();
    store.status[penggunaId] = "nonaktif";
    const profil = store.profilPengajar.find((p) => p.pengguna_id === penggunaId);
    if (profil) profil.alasan_penolakan = alasan.trim();

    const kelasTerpengaruh = buatKelasMock(new Date())
      .filter((k) => k.pengajar_id === penggunaId)
      .map((k) => k.id);
    const terdampak = store.booking.filter(
      (b) => kelasTerpengaruh.includes(b.kelas_id) && STATUS_AKTIF.includes(b.status),
    );
    store.notifikasi.push({
      id: crypto.randomUUID(),
      pengguna_id: penggunaId,
      tipe: "pengajar_status",
      judul: "Akun dinonaktifkan",
      isi: alasan.trim(),
      tautan: "/mengajar/profil",
      dibaca_pada: null,
      dibuat_pada: sekarang,
    });
    catatLogMock(admin.id, "nonaktifkan_pengguna", "pengguna", penggunaId, {
      alasan: alasan.trim(),
      booking_terdampak: terdampak.length,
    });
    return {
      pengguna_id: penggunaId,
      status: "nonaktif",
      booking_terdampak: terdampak.map((b) => ({ id: b.id, kode: b.kode, status: b.status })),
    };
  }

  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("admin_nonaktifkan_pengguna", {
    p_pengguna_id: penggunaId,
    p_alasan: alasan.trim(),
  });
  lemparJikaError(error);
  return data as { pengguna_id: string; status: StatusPengguna; booking_terdampak: unknown[] };
}

// ---------------------------------------------------------------------------
// Laporan Masalah (F12)
// ---------------------------------------------------------------------------

export interface LaporanMasalahAdminItem {
  laporan: LaporanMasalah;
  pelaporNama: string;
  pengajarNama: string;
}

export async function ambilDaftarLaporanMasalahAdmin(
  filterStatus: StatusMasalah | "semua" = "baru",
  urutan: UrutanAntrean = "terlama",
): Promise<LaporanMasalahAdminItem[]> {
  await wajibAdmin();

  let laporan: LaporanMasalah[];
  let penggunaMap: Map<string, string>;

  if (pakaiMock) {
    const store = storeMock();
    laporan =
      filterStatus === "semua" ? store.laporanMasalah : store.laporanMasalah.filter((l) => l.status === filterStatus);
    penggunaMap = new Map(daftarPenggunaMock().map((u) => [u.id, u.nama]));
  } else {
    const supabase = await buatClientServer();
    let q = supabase.from("laporan_masalah").select("*");
    if (filterStatus !== "semua") q = q.eq("status", filterStatus);
    const { data, error } = await q;
    lemparJikaError(error);
    laporan = (data ?? []) as LaporanMasalah[];
    if (laporan.length === 0) return [];

    const userIds = [...new Set(laporan.flatMap((l) => [l.pelapor_id, l.pengajar_id]))];
    const { data: uData, error: uErr } = await supabase.from("pengguna").select("id, nama").in("id", userIds);
    lemparJikaError(uErr);
    penggunaMap = new Map(((uData ?? []) as Pick<Pengguna, "id" | "nama">[]).map((u) => [u.id, u.nama]));
  }

  const terurut = urutkanLaporanMasalah(laporan, urutan);
  return terurut.map((l) => ({
    laporan: l,
    pelaporNama: penggunaMap.get(l.pelapor_id) ?? "Pengguna",
    pengajarNama: penggunaMap.get(l.pengajar_id) ?? "Pengajar",
  }));
}

export async function adminUbahStatusLaporanMasalah(id: string, status: StatusMasalah): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const l = storeMock().laporanMasalah.find((x) => x.id === id);
    if (!l) throw new Error("VALIDASI_GAGAL");
    l.status = status;
    catatLogMock(admin.id, "ubah_laporan_masalah", "laporan_masalah", id, { status });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_ubah_laporan_masalah", { p_id: id, p_status: status });
  lemparJikaError(error);
}

// ---------------------------------------------------------------------------
// Honor (F13)
// ---------------------------------------------------------------------------

export interface HonorAdminItem {
  honor: Honor;
  pengajarNama: string;
  programNama: string;
  programSlug: string;
  nomorSesi: number | null;
  mulaiPada: string | null;
}

export async function ambilDaftarHonorAdmin(
  filterStatus: StatusHonor | "semua" = "belum_dibayar",
  urutan: UrutanAntrean = "terlama",
): Promise<HonorAdminItem[]> {
  await wajibAdmin();

  if (pakaiMock) {
    const store = storeMock();
    const penggunaMap = new Map(daftarPenggunaMock().map((u) => [u.id, u.nama]));
    const kelasMap = new Map(buatKelasMock(new Date()).map((k) => [k.id, k]));
    const sesiMap = new Map(store.sesi.map((s) => [s.id, s]));

    const daftar =
      filterStatus === "semua" ? store.honor : store.honor.filter((h) => h.status === filterStatus);

    const items: HonorAdminItem[] = daftar.map((h) => {
      const s = sesiMap.get(h.sesi_id);
      const k = s ? kelasMap.get(s.kelas_id) : undefined;
      return {
        honor: h,
        pengajarNama: penggunaMap.get(h.pengajar_id) ?? "Pengajar",
        programNama: k?.program_nama ?? "Program",
        programSlug: k?.program_slug ?? "kelas-reguler-teknologi",
        nomorSesi: s?.nomor ?? null,
        mulaiPada: s?.mulai_pada ?? null,
      };
    });
    return urutkanAntreanWaktu(items, (x) => x.mulaiPada ?? "", urutan);
  }

  const supabase = await buatClientServer();
  let q = supabase.from("honor").select("*");
  if (filterStatus !== "semua") q = q.eq("status", filterStatus);
  const { data: honorData, error: hErr } = await q;
  lemparJikaError(hErr);
  const honorList = (honorData ?? []) as Honor[];
  if (honorList.length === 0) return [];

  const pengajarIds = [...new Set(honorList.map((h) => h.pengajar_id))];
  const sesiIds = [...new Set(honorList.map((h) => h.sesi_id))];

  const [uRes, sRes] = await Promise.all([
    supabase.from("pengguna").select("id, nama").in("id", pengajarIds),
    supabase.from("sesi").select("id, kelas_id, nomor, mulai_pada").in("id", sesiIds),
  ]);
  lemparJikaError(uRes.error);
  lemparJikaError(sRes.error);
  const sesiRows = (sRes.data ?? []) as Pick<SesiAdmin, "id" | "kelas_id" | "nomor" | "mulai_pada">[];
  const kelasIds = [...new Set(sesiRows.map((s) => s.kelas_id))];

  const { data: kData, error: kErr } = kelasIds.length
    ? await supabase.from("kelas").select("id, program:program_id(nama, slug)").in("id", kelasIds)
    : { data: [], error: null };
  lemparJikaError(kErr);

  const uMap = new Map(((uRes.data ?? []) as Pick<Pengguna, "id" | "nama">[]).map((u) => [u.id, u.nama]));
  const sMap = new Map(sesiRows.map((s) => [s.id, s]));
  const kMap = new Map(
    ((kData ?? []) as unknown as { id: string; program: { nama: string; slug: string } | { nama: string; slug: string }[] | null }[]).map(
      (k) => [k.id, Array.isArray(k.program) ? (k.program[0] ?? null) : k.program],
    ),
  );

  const items: HonorAdminItem[] = honorList.map((h) => {
    const s = sMap.get(h.sesi_id);
    const pr = s ? kMap.get(s.kelas_id) : undefined;
    return {
      honor: h,
      pengajarNama: uMap.get(h.pengajar_id) ?? "Pengajar",
      programNama: pr?.nama ?? "Program",
      programSlug: pr?.slug ?? "kelas-reguler-teknologi",
      nomorSesi: s?.nomor ?? null,
      mulaiPada: s?.mulai_pada ?? null,
    };
  });
  return urutkanAntreanWaktu(items, (x) => x.mulaiPada ?? "", urutan);
}

export async function adminTandaiHonorDibayar(id: string): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const h = storeMock().honor.find((x) => x.id === id);
    if (!h) throw new Error("VALIDASI_GAGAL");
    h.status = "dibayar";
    h.dibayar_pada = new Date().toISOString();
    h.dibayar_oleh = admin.id;
    catatLogMock(admin.id, "tandai_honor_dibayar", "honor", id, { jumlah: h.jumlah });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_tandai_honor_dibayar", { p_id: id });
  lemparJikaError(error);
}

// ---------------------------------------------------------------------------
// Kelas & Sesi Tanpa Link Meet (F8, F14)
// ---------------------------------------------------------------------------

export interface KelasAdminItem {
  id: string;
  programNama: string;
  programSlug: string;
  pengajarNama: string;
  level: number;
  kapasitas: number;
  status: StatusKelas;
  mulaiPada: string | null;
}

export interface SesiTanpaMeetItem {
  sesi: Pick<SesiAdmin, "id" | "kelas_id" | "nomor" | "mulai_pada" | "meet_gagal_terakhir">;
  programNama: string;
  pengajarNama: string;
}

export async function ambilDaftarKelasAdmin(): Promise<{
  kelas: KelasAdminItem[];
  sesiTanpaMeet: SesiTanpaMeetItem[];
}> {
  await wajibAdmin();

  if (pakaiMock) {
    const store = storeMock();
    const semua = buatKelasMock(new Date());
    const kelas: KelasAdminItem[] = semua.map((k) => ({
      id: k.id,
      programNama: k.program_nama,
      programSlug: k.program_slug,
      pengajarNama: k.pengajar_nama,
      level: k.level,
      kapasitas: k.kapasitas,
      status: k.status,
      mulaiPada: k.mulai_pada,
    }));

    const sesiTanpaMeet: SesiTanpaMeetItem[] = [];
    for (const sId of store.sesiTanpaMeetIds) {
      const s = store.sesi.find((x) => x.id === sId);
      const k = s ? semua.find((x) => x.id === s.kelas_id) : undefined;
      if (!s || !k) continue;
      sesiTanpaMeet.push({
        sesi: {
          id: s.id,
          kelas_id: s.kelas_id,
          nomor: s.nomor,
          mulai_pada: s.mulai_pada,
          meet_gagal_terakhir: "Kuota sementara tercapai (contoh)",
        },
        programNama: k.program_nama,
        pengajarNama: k.pengajar_nama,
      });
    }
    return { kelas, sesiTanpaMeet };
  }

  const supabase = await buatClientServer();
  const [kRes, sRes] = await Promise.all([
    supabase.from("kelas").select("*, program(nama, slug), pengguna:pengajar_id(nama)").order("dibuat_pada", { ascending: false }),
    supabase.from("sesi").select("id, kelas_id, nomor, mulai_pada, meet_gagal_terakhir").is("meet_uri", null).neq("status", "dibatalkan").order("mulai_pada"),
  ]);
  lemparJikaError(kRes.error);
  lemparJikaError(sRes.error);

  type BarisK = {
    id: string;
    level: number;
    kapasitas: number;
    status: StatusKelas;
    dibuat_pada: string;
    program: { nama: string; slug: string } | null;
    pengguna: { nama: string } | null;
  };
  const barisKelas = (kRes.data ?? []) as BarisK[];
  const kMap = new Map(barisKelas.map((k) => [k.id, k]));

  const kelas: KelasAdminItem[] = barisKelas.map((k) => ({
    id: k.id,
    programNama: k.program?.nama ?? "Program",
    programSlug: k.program?.slug ?? "kelas-reguler-teknologi",
    pengajarNama: k.pengguna?.nama ?? "Pengajar",
    level: k.level ?? 1,
    kapasitas: k.kapasitas,
    status: k.status,
    mulaiPada: k.dibuat_pada,
  }));

  const sesiTanpaMeet: SesiTanpaMeetItem[] = (
    (sRes.data ?? []) as Pick<SesiAdmin, "id" | "kelas_id" | "nomor" | "mulai_pada" | "meet_gagal_terakhir">[]
  ).map((s) => {
    const k = kMap.get(s.kelas_id);
    return {
      sesi: s,
      programNama: k?.program?.nama ?? "Program",
      pengajarNama: k?.pengguna?.nama ?? "Pengajar",
    };
  });

  return { kelas, sesiTanpaMeet };
}

export async function adminUbahKelas(kelasId: string, input: InputUbahKelasAdmin): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const k = storeMock().kelasTambahan.find((x) => x.id === kelasId);
    if (k) {
      k.status = input.status;
      k.kapasitas = input.kapasitas;
    }
    catatLogMock(admin.id, "ubah_kelas", "kelas", kelasId, input);
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase
    .from("kelas")
    .update({ status: input.status, kapasitas: input.kapasitas })
    .eq("id", kelasId);
  lemparJikaError(error);
}

export async function adminCobaBuatMeet(kelasId: string): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const sesiIdsKelas = new Set(store.sesi.filter((s) => s.kelas_id === kelasId).map((s) => s.id));
    store.sesiTanpaMeetIds = store.sesiTanpaMeetIds.filter((id) => !sesiIdsKelas.has(id));
    catatLogMock(admin.id, "buat_meet_ulang", "kelas", kelasId);
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.functions.invoke("buat-meet", { body: { kelas_id: kelasId } });
  if (error) throw new Error("LINK_MEET_BELUM_ADA");
}

// ---------------------------------------------------------------------------
// Program, Pengaturan, & Log Admin (F5, F6, F13, F14)
// ---------------------------------------------------------------------------

export async function ambilDaftarProgramAdmin(): Promise<Program[]> {
  await wajibAdmin();
  if (pakaiMock) {
    const ov = storeMock().programOverride;
    return programMock.map((p) => ({ ...p, ...(ov[p.id] ?? {}) }));
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.from("program").select("*").order("kelas_min");
  lemparJikaError(error);
  return (data ?? []) as Program[];
}

export async function adminUbahProgram(programId: string, input: InputUbahProgram): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    storeMock().programOverride[programId] = input;
    catatLogMock(admin.id, "ubah_program", "program", programId, input);
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.from("program").update(input).eq("id", programId);
  lemparJikaError(error);
}

export async function ambilPengaturanAdmin(): Promise<{
  nama_bank: string;
  nomor_rekening: string;
  nama_pemilik_rekening: string;
  qris_path: string | null;
  qris_url: string | null;
}> {
  await wajibAdmin();
  if (pakaiMock) {
    const p = storeMock().pengaturan;
    return { ...p, qris_url: "/qris-contoh.svg" };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.from("pengaturan").select("kunci, nilai");
  lemparJikaError(error);
  const nilai = Object.fromEntries(((data ?? []) as { kunci: string; nilai: string }[]).map((r) => [r.kunci, r.nilai]));
  let qris_url: string | null = null;
  if (nilai.qris_path) {
    const { data: url } = await supabase.storage.from("pengaturan").createSignedUrl(nilai.qris_path, 300);
    qris_url = url?.signedUrl ?? null;
  }
  return {
    nama_bank: nilai.nama_bank ?? "",
    nomor_rekening: nilai.nomor_rekening ?? "",
    nama_pemilik_rekening: nilai.nama_pemilik_rekening ?? "",
    qris_path: nilai.qris_path ?? null,
    qris_url,
  };
}

export async function adminSimpanPengaturan(input: InputPengaturanRekening): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    store.pengaturan = {
      nama_bank: input.nama_bank.trim(),
      nomor_rekening: input.nomor_rekening.trim(),
      nama_pemilik_rekening: input.nama_pemilik_rekening.trim(),
      qris_path: input.qris_path ?? store.pengaturan.qris_path,
    };
    catatLogMock(admin.id, "ubah_pengaturan", "pengaturan", "rekening");
    return;
  }
  const supabase = await buatClientServer();
  const entri: { kunci: string; nilai: string }[] = [
    { kunci: "nama_bank", nilai: input.nama_bank.trim() },
    { kunci: "nomor_rekening", nilai: input.nomor_rekening.trim() },
    { kunci: "nama_pemilik_rekening", nilai: input.nama_pemilik_rekening.trim() },
  ];
  if (input.qris_path) entri.push({ kunci: "qris_path", nilai: input.qris_path });
  const { error } = await supabase.from("pengaturan").upsert(entri, { onConflict: "kunci" });
  lemparJikaError(error);
}

export interface LogAdminItem {
  log: LogAdmin;
  adminNama: string;
}

export async function ambilLogAdmin(batas = 50): Promise<LogAdminItem[]> {
  await wajibAdmin();
  if (pakaiMock) {
    const uMap = new Map(daftarPenggunaMock().map((u) => [u.id, u.nama]));
    return storeMock().logAdmin.slice(0, batas).map((log) => ({
      log,
      adminNama: uMap.get(log.admin_id) ?? "Admin",
    }));
  }

  const supabase = await buatClientServer();
  const { data, error } = await supabase
    .from("log_admin")
    .select("*")
    .order("dibuat_pada", { ascending: false })
    .limit(batas);
  lemparJikaError(error);
  const logs = (data ?? []) as LogAdmin[];
  if (logs.length === 0) return [];

  const adminIds = [...new Set(logs.map((l) => l.admin_id))];
  const { data: uData } = await supabase.from("pengguna").select("id, nama").in("id", adminIds);
  const uMap = new Map(((uData ?? []) as Pick<Pengguna, "id" | "nama">[]).map((u) => [u.id, u.nama]));

  return logs.map((log) => ({
    log,
    adminNama: uMap.get(log.admin_id) ?? "Admin",
  }));
}
