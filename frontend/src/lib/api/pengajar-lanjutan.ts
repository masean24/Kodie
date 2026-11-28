import { connection } from "next/server";
import type { DetailProfilPengajar, KelasKatalog, KodeReferral, Pengguna } from "@/types/database";
import { STATUS_AKTIF } from "@/lib/booking";
import { buatKelasMock } from "@/lib/mock/data";
import { storeMock } from "@/lib/mock/store";
import { buatClientServer } from "@/lib/supabase/server";
import { buatKodeAcak, hitungHonorPerSesi } from "@/lib/referral";
import type { InputDetailProfil } from "@/lib/validasi/pengajar-lanjutan";
import { ambilPenggunaSaya } from "./auth";
import { ambilDetailProfilPengajar } from "./pengajar";
import { fiturLanjutan, lemparJikaError, pakaiMock } from "./sumber";

/**
 * Fitur pengajar dari saran pembimbing (2026-11-28): kode referral, pengalaman, dan sertifikat.
 * Kontrak backend yang dipakai mode Supabase ada di docs/KEPUTUSAN.md (tabel `kode_referral`,
 * `pengalaman_pengajar`, `sertifikat_pengajar`, RPC `buat_kode_referral`, `simpan_detail_profil_pengajar`).
 */

async function wajibPengajar(): Promise<Pengguna> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p || p.peran !== "pengajar") throw new Error("TIDAK_BERHAK");
  return p;
}

export async function ambilKodeReferralSaya(): Promise<KodeReferral | null> {
  const p = await wajibPengajar();
  if (pakaiMock) return storeMock().kodeReferral.find((k) => k.pengajar_id === p.id) ?? null;
  if (!fiturLanjutan) return null;
  const supabase = await buatClientServer();
  const { data, error } = await supabase
    .from("kode_referral" as never)
    .select("pengajar_id, kode, dibuat_pada")
    .eq("pengajar_id", p.id)
    .maybeSingle();
  lemparJikaError(error);
  return (data as unknown as KodeReferral | null) ?? null;
}

/** Buat kode referral bila belum ada. Satu kode aktif per pengajar; pemanggilan ulang mengembalikan kode yang sama. */
export async function buatKodeReferralSaya(): Promise<KodeReferral> {
  const p = await wajibPengajar();
  if (p.status !== "terverifikasi") throw new Error("PENGAJAR_BELUM_TERVERIFIKASI");
  if (pakaiMock) {
    const store = storeMock();
    const ada = store.kodeReferral.find((k) => k.pengajar_id === p.id);
    if (ada) return ada;
    let kode = buatKodeAcak(p.nama);
    while (store.kodeReferral.some((k) => k.kode === kode)) kode = buatKodeAcak(p.nama);
    const baru: KodeReferral = { pengajar_id: p.id, kode, dibuat_pada: new Date().toISOString() };
    store.kodeReferral.push(baru);
    return baru;
  }
  if (!fiturLanjutan) throw new Error("FITUR_BELUM_TERSEDIA");
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("buat_kode_referral" as never);
  lemparJikaError(error);
  return data as unknown as KodeReferral;
}

/**
 * Peserta berbayar sebuah kelas di mode mock, untuk bagi hasil. Booking nyata di store memakai `total`
 * (sudah dipotong referral) dan statusnya; kursi contoh bawaan data mock (tanpa baris booking) dianggap lunas
 * di harga paket tanpa referral. Trial (Rp0) tidak dihitung.
 */
export function pesertaBerbayarMock(kelas: KelasKatalog, hanyaTerkonfirmasi: boolean): { total: number; pakaiReferral: boolean }[] {
  const milik = storeMock().booking.filter((b) => b.kelas_id === kelas.id);
  const nyata = milik
    .filter((b) => (b.jenis ?? "paket") === "paket")
    .filter((b) => (hanyaTerkonfirmasi ? b.status === "terkonfirmasi" || b.status === "selesai" : STATUS_AKTIF.includes(b.status) || b.status === "selesai"))
    .map((b) => ({ total: b.total, pakaiReferral: Boolean(b.kode_referral) }));
  const aktifDiStore = milik.filter((b) => STATUS_AKTIF.includes(b.status)).length;
  const kursiContoh = Math.max(0, kelas.kursi_terpakai - aktifDiStore);
  return [...nyata, ...Array.from({ length: kursiContoh }, () => ({ total: kelas.harga_paket, pakaiReferral: false }))];
}

export interface PerkiraanBagiHasil {
  kelasId: string;
  programNama: string;
  programSlug: string;
  level: number;
  status: KelasKatalog["status"];
  jumlahSiswa: number;
  siswaReferral: number;
  honorPerSesi: number;
  jumlahSesi: number;
}

/** Perkiraan honor per sesi untuk kelas pengajar yang belum selesai, dihitung dari kursi yang sudah terisi. */
export async function ambilPerkiraanBagiHasil(): Promise<PerkiraanBagiHasil[]> {
  const p = await wajibPengajar();
  if (!pakaiMock) {
    if (!fiturLanjutan) return [];
    const supabase = await buatClientServer();
    const { data, error } = await supabase
      .from("perkiraan_bagi_hasil_saya" as never)
      .select("kelas_id, program_nama, program_slug, level, status, jumlah_siswa, siswa_referral, honor_per_sesi, jumlah_sesi");
    lemparJikaError(error);
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      kelasId: String(r.kelas_id),
      programNama: String(r.program_nama),
      programSlug: String(r.program_slug),
      level: Number(r.level),
      status: r.status as KelasKatalog["status"],
      jumlahSiswa: Number(r.jumlah_siswa),
      siswaReferral: Number(r.siswa_referral),
      honorPerSesi: Number(r.honor_per_sesi),
      jumlahSesi: Number(r.jumlah_sesi),
    }));
  }
  return buatKelasMock(new Date())
    .filter((k) => k.pengajar_id === p.id && k.status !== "selesai" && k.status !== "disembunyikan")
    .map((k) => {
      const peserta = pesertaBerbayarMock(k, false);
      return {
        kelasId: k.id,
        programNama: k.program_nama,
        programSlug: k.program_slug,
        level: k.level,
        status: k.status,
        jumlahSiswa: peserta.length,
        siswaReferral: peserta.filter((x) => x.pakaiReferral).length,
        honorPerSesi: hitungHonorPerSesi(peserta, k.jumlah_sesi),
        jumlahSesi: k.jumlah_sesi,
      };
    });
}

export async function ambilDetailProfilSaya(): Promise<DetailProfilPengajar> {
  const p = await wajibPengajar();
  return ambilDetailProfilPengajar(p.id);
}

/** Ganti seluruh daftar pengalaman dan sertifikat milik pengajar yang login. */
export async function simpanDetailProfilSaya(input: InputDetailProfil): Promise<void> {
  const p = await wajibPengajar();
  if (pakaiMock) {
    storeMock().detailPengajar[p.id] = {
      pengalaman: input.pengalaman.map((x) => ({ ...x, id: x.id || crypto.randomUUID(), deskripsi: x.deskripsi || null })),
      sertifikat: input.sertifikat.map((x) => ({ ...x, id: x.id || crypto.randomUUID(), tautan: x.tautan || null })),
    };
    return;
  }
  if (!fiturLanjutan) throw new Error("FITUR_BELUM_TERSEDIA");
  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("simpan_detail_profil_pengajar" as never, {
    p_pengalaman: input.pengalaman.map((x, i) => ({
      peran: x.peran,
      tempat: x.tempat,
      periode: x.periode,
      deskripsi: x.deskripsi || null,
      urutan: i + 1,
    })),
    p_sertifikat: input.sertifikat.map((x) => ({ nama: x.nama, penerbit: x.penerbit, tahun: x.tahun, tautan: x.tautan || null })),
  } as never);
  lemparJikaError(error);
}
