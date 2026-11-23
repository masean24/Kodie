import type {
  Booking,
  HasilBuatBooking,
  InfoPembayaran,
  KelasKatalog,
  Pembayaran,
  Siswa,
} from "@/types/database";
import { storeMock } from "@/lib/mock/store";
import { buatKelasMock } from "@/lib/mock/data";
import { buatClientServer } from "@/lib/supabase/server";
import { STATUS_AKTIF, kodeBooking, statusEfektif } from "@/lib/booking";
import { ambilPenggunaSaya } from "./auth";
import { ambilKelasByIds } from "./kelas";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Booking dan pembayaran (PRD F6). Hanya untuk server (memakai sesi di cookie). */

export type SiswaRingkas = Pick<Siswa, "id" | "nama" | "jenjang" | "kelas">;

/** Booking beserta data yang dibutuhkan tampilan. */
export interface BookingRinci {
  booking: Booking;
  kelas: KelasKatalog | null;
  siswa: SiswaRingkas | null;
  /** Unggahan bukti terbaru, untuk alasan penolakan dan nama file. */
  pembayaranTerakhir: Pembayaran | null;
}

const JAM = 3_600_000;

async function wajibLogin() {
  const p = await ambilPenggunaSaya();
  if (!p) throw new Error("TIDAK_BERHAK");
  return p;
}

/** Siswa yang boleh dikelola pengguna: akun sendiri atau anak (orang_tua_id). */
function siswaMilikMock(penggunaId: string) {
  return storeMock().siswa.filter((s) => s.pengguna_id === penggunaId || s.orang_tua_id === penggunaId);
}

/** Padanan pengecekan kedaluwarsa backend saat data dibaca (PRD bagian 9). */
function rapikanMock() {
  const sekarang = new Date();
  for (const b of storeMock().booking) b.status = statusEfektif(b, sekarang);
}

export async function buatBooking(kelasId: string, siswaId: string): Promise<HasilBuatBooking> {
  const p = await wajibLogin();
  if (p.peran !== "orang_tua" && p.peran !== "siswa") throw new Error("TIDAK_BERHAK");
  if (pakaiMock) {
    rapikanMock();
    const store = storeMock();
    const siswa = siswaMilikMock(p.id).find((s) => s.id === siswaId);
    if (!siswa) throw new Error("TIDAK_BERHAK");
    if (siswa.pengguna_id && (store.status[siswa.pengguna_id] ?? (siswa.pengguna_id === p.id ? p.status : "aktif")) !== "aktif") {
      throw new Error("SISWA_BELUM_DISETUJUI");
    }
    const kelas = buatKelasMock(new Date()).find((k) => k.id === kelasId);
    if (!kelas) throw new Error("VALIDASI_GAGAL");
    if (store.booking.some((b) => b.kelas_id === kelasId && b.siswa_id === siswaId && STATUS_AKTIF.includes(b.status))) {
      throw new Error("BOOKING_GANDA");
    }
    if (kelas.sisa_kursi <= 0) throw new Error("KELAS_PENUH");
    if (!kelas.bisa_dibooking) throw new Error("VALIDASI_GAGAL");
    const sekarang = new Date();
    const baru: Booking = {
      id: crypto.randomUUID(),
      kode: kodeBooking(sekarang, store.booking.length + 1),
      kelas_id: kelasId,
      siswa_id: siswaId,
      dibuat_oleh: p.id,
      status: "menunggu_pembayaran",
      total: kelas.harga_paket,
      batas_bayar_pada: new Date(sekarang.getTime() + 24 * JAM).toISOString(),
      dibuat_pada: sekarang.toISOString(),
    };
    store.booking.push(baru);
    const { id, kode, status, total, batas_bayar_pada } = baru;
    return { id, kode, status, total, batas_bayar_pada };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("buat_booking", { p_kelas_id: kelasId, p_siswa_id: siswaId });
  lemparJikaError(error);
  return data as HasilBuatBooking;
}

async function lengkapi(daftar: Booking[]): Promise<BookingRinci[]> {
  if (daftar.length === 0) return [];
  const sekarang = new Date();
  const kelasIds = [...new Set(daftar.map((b) => b.kelas_id))];
  const siswaIds = [...new Set(daftar.map((b) => b.siswa_id))];
  const bookingIds = daftar.map((b) => b.id);
  let kelas: KelasKatalog[];
  let siswa: SiswaRingkas[];
  let pembayaran: Pembayaran[];

  if (pakaiMock) {
    kelas = buatKelasMock(sekarang).filter((k) => kelasIds.includes(k.id));
    siswa = storeMock().siswa.filter((s) => siswaIds.includes(s.id));
    pembayaran = storeMock().pembayaran.filter((x) => bookingIds.includes(x.booking_id));
  } else {
    const supabase = await buatClientServer();
    const [k, s, b] = await Promise.all([
      ambilKelasByIds(kelasIds),
      supabase.from("siswa").select("id, nama, jenjang, kelas").in("id", siswaIds),
      supabase.from("pembayaran").select("*").in("booking_id", bookingIds),
    ]);
    lemparJikaError(s.error);
    lemparJikaError(b.error);
    kelas = k;
    siswa = (s.data ?? []) as SiswaRingkas[];
    pembayaran = (b.data ?? []) as Pembayaran[];
  }

  const terbaru = new Map<string, Pembayaran>();
  for (const x of [...pembayaran].sort((a, b) => b.diunggah_pada.localeCompare(a.diunggah_pada))) {
    if (!terbaru.has(x.booking_id)) terbaru.set(x.booking_id, x);
  }
  return daftar
    .map((b) => ({
      booking: { ...b, status: statusEfektif(b, sekarang) },
      kelas: kelas.find((k) => k.id === b.kelas_id) ?? null,
      siswa: siswa.find((s) => s.id === b.siswa_id) ?? null,
      pembayaranTerakhir: terbaru.get(b.id) ?? null,
    }))
    .sort((a, b) => b.booking.dibuat_pada.localeCompare(a.booking.dibuat_pada));
}

/** Booking milik sendiri atau anak, terbaru dulu. */
export async function ambilDaftarBooking(): Promise<BookingRinci[]> {
  const p = await wajibLogin();
  if (pakaiMock) {
    rapikanMock();
    const milik = siswaMilikMock(p.id).map((s) => s.id);
    return lengkapi(storeMock().booking.filter((b) => milik.includes(b.siswa_id)));
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.from("booking").select("*").order("dibuat_pada", { ascending: false });
  lemparJikaError(error);
  return lengkapi((data ?? []) as Booking[]);
}

export async function ambilBooking(id: string): Promise<BookingRinci | null> {
  const p = await wajibLogin();
  if (pakaiMock) {
    rapikanMock();
    const milik = siswaMilikMock(p.id).map((s) => s.id);
    const b = storeMock().booking.find((x) => x.id === id && milik.includes(x.siswa_id));
    return b ? (await lengkapi([b]))[0] : null;
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.from("booking").select("*").eq("id", id).maybeSingle();
  lemparJikaError(error);
  return data ? (await lengkapi([data as Booking]))[0] : null;
}

/** RPC `batalkan_booking`: hanya selama bukti bayar belum diunggah. */
export async function batalkanBooking(id: string): Promise<void> {
  const p = await wajibLogin();
  if (pakaiMock) {
    rapikanMock();
    const milik = siswaMilikMock(p.id).map((s) => s.id);
    const b = storeMock().booking.find((x) => x.id === id && milik.includes(x.siswa_id));
    if (!b) throw new Error("TIDAK_BERHAK");
    if (b.status !== "menunggu_pembayaran") throw new Error("VALIDASI_GAGAL");
    b.status = "dibatalkan";
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("batalkan_booking", { p_booking_id: id });
  lemparJikaError(error);
}

/** RPC `kirim_bukti_bayar` setelah file diunggah ke bucket `bukti-bayar`. */
export async function kirimBuktiBayar(bookingId: string, path: string): Promise<void> {
  const p = await wajibLogin();
  if (!path.startsWith(`${bookingId}/`)) throw new Error("FILE_TIDAK_VALID");
  if (pakaiMock) {
    rapikanMock();
    const milik = siswaMilikMock(p.id).map((s) => s.id);
    const b = storeMock().booking.find((x) => x.id === bookingId && milik.includes(x.siswa_id));
    if (!b) throw new Error("TIDAK_BERHAK");
    if (b.status !== "menunggu_pembayaran") throw new Error("VALIDASI_GAGAL");
    b.status = "menunggu_verifikasi";
    storeMock().pembayaran.push({
      id: crypto.randomUUID(),
      booking_id: bookingId,
      bukti_path: path,
      diunggah_pada: new Date().toISOString(),
      status: "menunggu",
      alasan_penolakan: null,
      diverifikasi_oleh: null,
      diverifikasi_pada: null,
    });
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("kirim_bukti_bayar", { p_booking_id: bookingId, p_path: path });
  lemparJikaError(error);
}

/** Rekening dan QRIS dari tabel `pengaturan`; gambar QRIS lewat signed URL 5 menit. */
export async function ambilInfoPembayaran(): Promise<InfoPembayaran> {
  await wajibLogin();
  if (pakaiMock) {
    const { nama_bank, nomor_rekening, nama_pemilik_rekening, qris_path } = storeMock().pengaturan;
    return {
      nama_bank,
      nomor_rekening,
      nama_pemilik_rekening,
      qris_url: qris_path ? "/qris-contoh.svg" : "/qris-contoh.svg",
    };
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
    qris_url,
  };
}
