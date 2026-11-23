import { connection } from "next/server";
import type {
  Booking,
  HasilMinat,
  KelasKatalog,
  LaporanSaya,
  Pengguna,
  RaporSaya,
  Rating,
  SesiSaya,
  Siswa,
} from "@/types/database";
import { buatJadwal4Sesi, bisaMasukKelas } from "@/lib/mengajar";
import { apakahLaporanBaru, prioritasMasalah } from "@/lib/sesi";
import { buatKelasMock } from "@/lib/mock/data";
import { storeMock } from "@/lib/mock/store";
import { clientPublik } from "@/lib/supabase/publik";
import { buatClientServer } from "@/lib/supabase/server";
import type { InputLaporanMasalah, InputRating } from "@/lib/validasi/sesi";
import { ambilPenggunaSaya } from "./auth";
import type { SiswaRingkas } from "./booking";
import { ambilHasilMinatTerbaru } from "./siswa";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Halaman sesi, laporan, rating, laporan masalah, dan rapor (PRD F8, F10–F12). Hanya untuk server. */

async function wajibSiswaAtauOrtu(): Promise<Pengguna> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p || (p.peran !== "orang_tua" && p.peran !== "siswa")) throw new Error("TIDAK_BERHAK");
  return p;
}

function siswaMilikMock(penggunaId: string): Siswa[] {
  return storeMock().siswa.filter((s) => s.pengguna_id === penggunaId || s.orang_tua_id === penggunaId);
}

/** Ambil sesi untuk kelas di mode mock; buat jadwal turunan bila kelas belum punya baris sesi eksplisit. */
function sesiKelasMock(k: KelasKatalog, sekarang: Date): SesiSaya[] {
  const ada = storeMock().sesi.filter((s) => s.kelas_id === k.id);
  const sumber: SesiSaya[] =
    ada.length > 0
      ? ada
      : buatJadwal4Sesi(
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(k.mulai_pada)),
          k.jam_mulai,
          k.durasi_menit,
        ).map((j) => ({
          id: `${k.id}-s${j.nomor}`,
          kelas_id: k.id,
          nomor: j.nomor,
          mulai_pada: j.mulai_pada,
          selesai_pada: j.selesai_pada,
          status: "terjadwal" as const,
          bisa_masuk_kelas: false,
        }));
  return sumber
    .map((s) => ({ ...s, bisa_masuk_kelas: bisaMasukKelas(s.mulai_pada, s.selesai_pada, s.status, sekarang) }))
    .sort((a, b) => a.nomor - b.nomor);
}

export interface ItemSesiDashboard {
  sesi: SesiSaya;
  kelas: KelasKatalog;
  siswa: SiswaRingkas;
  booking: Booking;
  bisaMasuk: boolean;
}

export interface ItemLaporanDashboard {
  laporan: LaporanSaya;
  sesi: SesiSaya;
  kelas: KelasKatalog;
  siswa: SiswaRingkas;
  baru: boolean;
}

export interface RaporRinci {
  rapor: RaporSaya;
  siswa: SiswaRingkas;
  kelas: KelasKatalog | null;
  sesi: SesiSaya | null;
  hasilMinat: HasilMinat | null;
}

export interface RingkasanSesiLaporan {
  sesiTerdekat: ItemSesiDashboard[];
  laporanTerbaru: ItemLaporanDashboard[];
  raporDaftar: RaporRinci[];
}

export async function ambilRingkasanSesiDanLaporan(): Promise<RingkasanSesiLaporan> {
  const p = await wajibSiswaAtauOrtu();
  const sekarang = new Date();

  if (pakaiMock) {
    const store = storeMock();
    const siswaList = siswaMilikMock(p.id);
    const siswaIds = new Set(siswaList.map((s) => s.id));
    const bookings = store.booking.filter(
      (b) => siswaIds.has(b.siswa_id) && (b.status === "terkonfirmasi" || b.status === "selesai"),
    );
    if (bookings.length === 0) return { sesiTerdekat: [], laporanTerbaru: [], raporDaftar: [] };

    const kelasSemua = buatKelasMock(sekarang);
    const sesiTerdekat: ItemSesiDashboard[] = [];
    const laporanTerbaru: ItemLaporanDashboard[] = [];
    const sesiById = new Map<string, { sesi: SesiSaya; kelas: KelasKatalog }>();

    for (const b of bookings) {
      const k = kelasSemua.find((x) => x.id === b.kelas_id);
      const st = siswaList.find((x) => x.id === b.siswa_id);
      if (!k || !st) continue;
      const siswaRingkas: SiswaRingkas = { id: st.id, nama: st.nama, jenjang: st.jenjang, kelas: st.kelas };
      const daftarSesi = sesiKelasMock(k, sekarang);

      for (const s of daftarSesi) {
        sesiById.set(s.id, { sesi: s, kelas: k });
        if (s.status !== "dibatalkan" && s.status !== "selesai" && new Date(s.selesai_pada) >= sekarang) {
          sesiTerdekat.push({
            sesi: s,
            kelas: k,
            siswa: siswaRingkas,
            booking: b,
            bisaMasuk: b.status === "terkonfirmasi" && s.bisa_masuk_kelas,
          });
        }
        const lapSesi = store.laporanSesi.find((l) => l.sesi_id === s.id);
        const lapSiswa = lapSesi
          ? store.laporanSiswa.find((ls) => ls.laporan_sesi_id === lapSesi.id && ls.siswa_id === st.id)
          : undefined;
        if (lapSesi && lapSiswa) {
          laporanTerbaru.push({
            laporan: {
              id: lapSesi.id,
              sesi_id: s.id,
              siswa_id: st.id,
              ringkasan: lapSesi.ringkasan,
              rekaman_url: null,
              kendala: lapSesi.kendala,
              hadir: lapSiswa.hadir,
              catatan: lapSiswa.catatan,
              karya_url: lapSiswa.karya_url,
              dikirim_pada: lapSesi.dikirim_pada,
              diubah_pada: lapSesi.diubah_pada,
            },
            sesi: s,
            kelas: k,
            siswa: siswaRingkas,
            baru: apakahLaporanBaru(lapSesi.dikirim_pada, sekarang),
          });
        }
      }
    }

    const hasilMinatMap = await ambilHasilMinatTerbaru([...siswaIds]);
    const raporDaftar: RaporRinci[] = store.raporJurusan
      .filter((r) => siswaIds.has(r.siswa_id))
      .map((r) => {
        const st = siswaList.find((x) => x.id === r.siswa_id)!;
        const info = sesiById.get(r.sesi_id);
        const minat = hasilMinatMap[r.siswa_id] ?? null;
        return {
          rapor: {
            ...r,
            minat_skor: minat?.skor ?? null,
            minat_bidang_teratas: minat?.bidang_teratas ?? null,
            minat_dibuat_pada: minat?.dibuat_pada ?? null,
          },
          siswa: { id: st.id, nama: st.nama, jenjang: st.jenjang, kelas: st.kelas },
          kelas: info?.kelas ?? null,
          sesi: info?.sesi ?? null,
          hasilMinat: minat,
        };
      })
      .sort((a, b) => b.rapor.dibuat_pada.localeCompare(a.rapor.dibuat_pada));

    sesiTerdekat.sort((a, b) => a.sesi.mulai_pada.localeCompare(b.sesi.mulai_pada));
    laporanTerbaru.sort((a, b) => b.laporan.dikirim_pada.localeCompare(a.laporan.dikirim_pada));

    return { sesiTerdekat, laporanTerbaru, raporDaftar };
  }

  const supabase = await buatClientServer();
  const [bookingRes, sesiRes, lapRes, raporRes] = await Promise.all([
    supabase.from("booking").select("*").in("status", ["terkonfirmasi", "selesai"]),
    supabase.from("sesi_saya").select("*").order("mulai_pada"),
    supabase.from("laporan_saya").select("*").order("dikirim_pada", { ascending: false }),
    supabase.from("rapor_saya").select("*").order("dibuat_pada", { ascending: false }),
  ]);
  lemparJikaError(bookingRes.error);
  lemparJikaError(sesiRes.error);
  lemparJikaError(lapRes.error);
  lemparJikaError(raporRes.error);

  const bookings = (bookingRes.data ?? []) as Booking[];
  const sesiList = (sesiRes.data ?? []) as SesiSaya[];
  const lapList = (lapRes.data ?? []) as LaporanSaya[];
  const raporList = (raporRes.data ?? []) as RaporSaya[];

  const kelasIds = [...new Set(bookings.map((b) => b.kelas_id))];
  const siswaIds = [...new Set([...bookings.map((b) => b.siswa_id), ...raporList.map((r) => r.siswa_id)])];
  if (kelasIds.length === 0 && raporList.length === 0) {
    return { sesiTerdekat: [], laporanTerbaru: [], raporDaftar: [] };
  }

  const [kelasRes, siswaRes, hasilMinatMap] = await Promise.all([
    kelasIds.length ? clientPublik().from("kelas_katalog").select("*").in("id", kelasIds) : Promise.resolve({ data: [], error: null }),
    siswaIds.length ? supabase.from("siswa").select("id, nama, jenjang, kelas").in("id", siswaIds) : Promise.resolve({ data: [], error: null }),
    ambilHasilMinatTerbaru(siswaIds),
  ]);
  lemparJikaError(kelasRes.error);
  lemparJikaError(siswaRes.error);

  const kelasMap = new Map(((kelasRes.data ?? []) as KelasKatalog[]).map((k) => [k.id, k]));
  const siswaMap = new Map(((siswaRes.data ?? []) as SiswaRingkas[]).map((s) => [s.id, s]));
  const sesiMap = new Map(sesiList.map((s) => [s.id, s]));

  const sesiTerdekat: ItemSesiDashboard[] = [];
  for (const b of bookings) {
    const k = kelasMap.get(b.kelas_id);
    const st = siswaMap.get(b.siswa_id);
    if (!k || !st) continue;
    for (const s of sesiList.filter((x) => x.kelas_id === b.kelas_id)) {
      if (s.status !== "dibatalkan" && s.status !== "selesai" && new Date(s.selesai_pada) >= sekarang) {
        sesiTerdekat.push({
          sesi: s,
          kelas: k,
          siswa: st,
          booking: b,
          bisaMasuk: b.status === "terkonfirmasi" && s.bisa_masuk_kelas,
        });
      }
    }
  }

  const laporanTerbaru: ItemLaporanDashboard[] = [];
  for (const lap of lapList) {
    const s = sesiMap.get(lap.sesi_id);
    const st = siswaMap.get(lap.siswa_id);
    const k = s ? kelasMap.get(s.kelas_id) : undefined;
    if (!s || !st || !k) continue;
    laporanTerbaru.push({
      laporan: lap,
      sesi: s,
      kelas: k,
      siswa: st,
      baru: apakahLaporanBaru(lap.dikirim_pada, sekarang),
    });
  }

  const raporDaftar: RaporRinci[] = raporList
    .map((r): RaporRinci | null => {
      const st = siswaMap.get(r.siswa_id);
      if (!st) return null;
      const s = sesiMap.get(r.sesi_id) ?? null;
      const k = s ? kelasMap.get(s.kelas_id) ?? null : null;
      return {
        rapor: r,
        siswa: st,
        kelas: k,
        sesi: s,
        hasilMinat: hasilMinatMap[r.siswa_id] ?? null,
      };
    })
    .filter((x): x is RaporRinci => Boolean(x));

  sesiTerdekat.sort((a, b) => a.sesi.mulai_pada.localeCompare(b.sesi.mulai_pada));
  return { sesiTerdekat, laporanTerbaru, raporDaftar };
}

export interface PesertaSesiPengguna {
  siswa: SiswaRingkas;
  booking: Booking;
  laporan: LaporanSaya | null;
  rating: Rating | null;
  raporId: string | null;
}

export interface DetailSesiPengguna {
  sesi: SesiSaya;
  kelas: KelasKatalog;
  peserta: PesertaSesiPengguna[];
  bisaMasuk: boolean;
}

export async function ambilDetailSesiPengguna(sesiId: string): Promise<DetailSesiPengguna | null> {
  const p = await wajibSiswaAtauOrtu();
  const sekarang = new Date();

  if (pakaiMock) {
    const store = storeMock();
    const siswaList = siswaMilikMock(p.id);
    const siswaIds = new Set(siswaList.map((s) => s.id));
    const kelasSemua = buatKelasMock(sekarang);

    let ditemukan: { sesi: SesiSaya; kelas: KelasKatalog } | null = null;
    for (const k of kelasSemua) {
      const match = sesiKelasMock(k, sekarang).find((s) => s.id === sesiId);
      if (match) {
        ditemukan = { sesi: match, kelas: k };
        break;
      }
    }
    if (!ditemukan) return null;

    const bookings = store.booking.filter(
      (b) =>
        b.kelas_id === ditemukan.kelas.id &&
        siswaIds.has(b.siswa_id) &&
        (b.status === "terkonfirmasi" || b.status === "selesai"),
    );
    if (bookings.length === 0) return null;

    const lapSesi = store.laporanSesi.find((l) => l.sesi_id === sesiId);
    const peserta: PesertaSesiPengguna[] = bookings.map((b) => {
      const st = siswaList.find((x) => x.id === b.siswa_id)!;
      const lapSiswa = lapSesi
        ? store.laporanSiswa.find((ls) => ls.laporan_sesi_id === lapSesi.id && ls.siswa_id === st.id)
        : undefined;
      const rating = store.rating.find((r) => r.sesi_id === sesiId && r.siswa_id === st.id) ?? null;
      const rapor = store.raporJurusan.find((r) => r.sesi_id === sesiId && r.siswa_id === st.id) ?? null;
      return {
        siswa: { id: st.id, nama: st.nama, jenjang: st.jenjang, kelas: st.kelas },
        booking: b,
        laporan:
          lapSesi && lapSiswa
            ? {
                id: lapSesi.id,
                sesi_id: sesiId,
                siswa_id: st.id,
                ringkasan: lapSesi.ringkasan,
                rekaman_url: null,
                kendala: lapSesi.kendala,
                hadir: lapSiswa.hadir,
                catatan: lapSiswa.catatan,
                karya_url: lapSiswa.karya_url,
                dikirim_pada: lapSesi.dikirim_pada,
                diubah_pada: lapSesi.diubah_pada,
              }
            : null,
        rating,
        raporId: rapor?.id ?? null,
      };
    });

    return {
      sesi: ditemukan.sesi,
      kelas: ditemukan.kelas,
      peserta,
      bisaMasuk: ditemukan.sesi.bisa_masuk_kelas && bookings.some((b) => b.status === "terkonfirmasi"),
    };
  }

  const supabase = await buatClientServer();
  const { data: sesiData, error: sesiErr } = await supabase.from("sesi_saya").select("*").eq("id", sesiId).maybeSingle();
  lemparJikaError(sesiErr);
  if (!sesiData) return null;
  const sesi = sesiData as SesiSaya;

  const [kelasRes, bookingRes, lapRes, ratingRes, raporRes] = await Promise.all([
    clientPublik().from("kelas_katalog").select("*").eq("id", sesi.kelas_id).maybeSingle(),
    supabase.from("booking").select("*").eq("kelas_id", sesi.kelas_id).in("status", ["terkonfirmasi", "selesai"]),
    supabase.from("laporan_saya").select("*").eq("sesi_id", sesiId),
    supabase.from("rating").select("*").eq("sesi_id", sesiId),
    supabase.from("rapor_saya").select("id, siswa_id").eq("sesi_id", sesiId),
  ]);
  lemparJikaError(kelasRes.error);
  lemparJikaError(bookingRes.error);
  lemparJikaError(lapRes.error);
  lemparJikaError(ratingRes.error);
  lemparJikaError(raporRes.error);

  const kelas = kelasRes.data as KelasKatalog | null;
  const bookings = (bookingRes.data ?? []) as Booking[];
  if (!kelas || bookings.length === 0) return null;

  const siswaIds = [...new Set(bookings.map((b) => b.siswa_id))];
  const { data: siswaData, error: siswaErr } = await supabase.from("siswa").select("id, nama, jenjang, kelas").in("id", siswaIds);
  lemparJikaError(siswaErr);
  const siswaList = (siswaData ?? []) as SiswaRingkas[];
  const lapList = (lapRes.data ?? []) as LaporanSaya[];
  const ratingList = (ratingRes.data ?? []) as Rating[];
  const raporList = (raporRes.data ?? []) as { id: string; siswa_id: string }[];

  const peserta: PesertaSesiPengguna[] = bookings
    .map((b) => {
      const st = siswaList.find((s) => s.id === b.siswa_id);
      if (!st) return null;
      return {
        siswa: st,
        booking: b,
        laporan: lapList.find((l) => l.siswa_id === st.id) ?? null,
        rating: ratingList.find((r) => r.siswa_id === st.id) ?? null,
        raporId: raporList.find((r) => r.siswa_id === st.id)?.id ?? null,
      };
    })
    .filter((x): x is PesertaSesiPengguna => Boolean(x));

  return {
    sesi,
    kelas,
    peserta,
    bisaMasuk: sesi.bisa_masuk_kelas && bookings.some((b) => b.status === "terkonfirmasi"),
  };
}

export async function ambilLinkMasukSesiPengguna(sesiId: string): Promise<{ meet_uri: string }> {
  const p = await wajibSiswaAtauOrtu();
  if (pakaiMock) {
    const detail = await ambilDetailSesiPengguna(sesiId);
    if (!detail) throw new Error("TIDAK_BERHAK");
    if (!detail.bisaMasuk) throw new Error("SESI_BELUM_DIBUKA");
    return { meet_uri: "https://meet.google.com/kodie-contoh-sesi" };
  }
  void p;
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("link_masuk_sesi", { p_sesi_id: sesiId });
  lemparJikaError(error);
  return data as { meet_uri: string };
}

export async function simpanRatingSesi(input: InputRating): Promise<void> {
  const p = await wajibSiswaAtauOrtu();
  if (pakaiMock) {
    const detail = await ambilDetailSesiPengguna(input.sesi_id);
    const peserta = detail?.peserta.find((x) => x.siswa.id === input.siswa_id);
    if (!peserta) throw new Error("TIDAK_BERHAK");
    if (!peserta.laporan || peserta.rating) throw new Error("VALIDASI_GAGAL");
    storeMock().rating.push({
      id: crypto.randomUUID(),
      sesi_id: input.sesi_id,
      siswa_id: input.siswa_id,
      pemberi_id: p.id,
      bintang: input.bintang,
      komentar: input.komentar?.trim() || null,
      dibuat_pada: new Date().toISOString(),
    });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("beri_rating", {
    p_sesi_id: input.sesi_id,
    p_siswa_id: input.siswa_id,
    p_bintang: input.bintang,
    p_komentar: input.komentar?.trim() || null,
  });
  lemparJikaError(error);
}

export async function simpanLaporanMasalah(input: InputLaporanMasalah): Promise<void> {
  const p = await wajibSiswaAtauOrtu();
  if (pakaiMock) {
    storeMock().laporanMasalah.push({
      id: crypto.randomUUID(),
      pelapor_id: p.id,
      sesi_id: input.sesi_id ?? null,
      pengajar_id: input.pengajar_id,
      kategori: input.kategori,
      deskripsi: input.deskripsi.trim(),
      prioritas: prioritasMasalah(input.kategori),
      status: "baru",
      dibuat_pada: new Date().toISOString(),
    });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.from("laporan_masalah").insert({
    pelapor_id: p.id,
    sesi_id: input.sesi_id ?? null,
    pengajar_id: input.pengajar_id,
    kategori: input.kategori,
    deskripsi: input.deskripsi.trim(),
  });
  lemparJikaError(error);
}

export async function ambilDaftarRaporPengguna(): Promise<RaporRinci[]> {
  const ringkasan = await ambilRingkasanSesiDanLaporan();
  return ringkasan.raporDaftar;
}

export async function ambilDetailRaporPengguna(raporId: string): Promise<RaporRinci | null> {
  const daftar = await ambilDaftarRaporPengguna();
  return daftar.find((r) => r.rapor.id === raporId) ?? null;
}
