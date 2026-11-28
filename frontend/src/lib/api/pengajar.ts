import { connection } from "next/server";
import type {
  Bidang,
  DetailProfilPengajar,
  PengajarPublik,
  PengalamanPengajar,
  SertifikatPengajar,
  StatusKerja,
  UlasanPengajarPublik,
} from "@/types/database";
import { pengajarMock } from "@/lib/mock/data";
import { storeMock } from "@/lib/mock/store";
import { clientPublik } from "@/lib/supabase/publik";
import { adalahUuid } from "@/lib/validasi/pengajar-lanjutan";
import { fiturLanjutan, lemparJikaError, pakaiMock } from "./sumber";

interface BarisPengajarPublik {
  id: string;
  slug?: string | null;
  nama: string;
  status_kerja: StatusKerja | null;
  kampus: string | null;
  jurusan: string | null;
  keahlian: Bidang[] | null;
  jumlah_rating: number | null;
  rata_rata_rating: number | string | null;
  foto_path?: string | null;
  foto_url?: string | null;
  cv_url?: string | null;
  diverifikasi_pada?: string | null;
  program_ids?: string[] | null;
  bio?: string | null;
}

/**
 * Mode mock: bio dan ulasan contoh (nama karangan). Mode Supabase membaca `pengajar_publik.bio` dan view
 * `ulasan_pengajar_publik` (migration 12).
 */
const BIO_MOCK: Record<string, string> = {
  "00000000-0000-4000-9000-000000000001":
    "Mahasiswa Informatika yang suka membimbing proyek web dan AI tingkat pemula. Gaya mengajar terstruktur, memakai analogi sehari-hari, dan selalu demo dulu sebelum praktik.",
  "00000000-0000-4000-9000-000000000002":
    "Fokus di jaringan komputer dan Internet of Things. Suka mengajak siswa memecahkan kasus nyata dan debugging bareng dengan sabar.",
};

const ULASAN_MOCK: UlasanPengajarPublik[] = [
  {
    id: "00000000-0000-4000-9600-000000000001",
    pengajar_id: "00000000-0000-4000-9000-000000000001",
    program_slug: "kelas-reguler-teknologi",
    program_nama: "Kelas Reguler Teknologi",
    bintang: 5,
    komentar: "Penjelasannya runtut dan contohnya dekat dengan keseharian. Anak saya jadi berani bertanya.",
    pemberi_label: "S*** · Orang Tua",
    dibuat_pada: "2026-11-10T12:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-9600-000000000002",
    pengajar_id: "00000000-0000-4000-9000-000000000001",
    program_slug: "simulasi-jurusan-it",
    program_nama: "Simulasi Jurusan IT",
    bintang: 5,
    komentar: "Praktik langsungnya seru banget.",
    pemberi_label: "R*** · Siswa",
    dibuat_pada: "2026-11-15T12:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-9600-000000000003",
    pengajar_id: "00000000-0000-4000-9000-000000000001",
    program_slug: "simulasi-jurusan-it",
    program_nama: "Simulasi Jurusan IT",
    bintang: 4,
    komentar: "Rapor rekomendasinya membantu diskusi jurusan kuliah anak saya.",
    pemberi_label: "D*** · Orang Tua",
    dibuat_pada: "2026-11-20T12:00:00.000Z",
  },
];

function normalisasiPengajar(row: BarisPengajarPublik): PengajarPublik {
  const fotoUrl =
    row.foto_url ??
    (row.foto_path ? clientPublik().storage.from("foto-pengajar").getPublicUrl(row.foto_path).data.publicUrl : null);
  return {
    id: row.id,
    slug: row.slug ?? null,
    nama: row.nama,
    status_kerja: row.status_kerja ?? "mahasiswa",
    kampus: row.kampus ?? null,
    jurusan: row.jurusan ?? null,
    keahlian: row.keahlian ?? [],
    jumlah_rating: Number(row.jumlah_rating ?? 0),
    rata_rata_rating:
      row.rata_rata_rating !== null && row.rata_rata_rating !== undefined ? Number(row.rata_rata_rating) : null,
    foto_url: fotoUrl,
    foto_path: row.foto_path ?? null,
    cv_url: row.cv_url ?? null,
    diverifikasi_pada: row.diverifikasi_pada ?? null,
    program_ids: row.program_ids ?? [],
    bio: row.bio ?? null,
  };
}

/** View `pengajar_publik` (hanya terverifikasi), untuk bagian pengajar di beranda. */
export async function ambilDaftarPengajarPublik(batas = 3): Promise<PengajarPublik[]> {
  if (pakaiMock) {
    const profils = storeMock().profilPengajar;
    return pengajarMock.slice(0, batas).map((p) => {
      const pr = profils.find((x) => x.pengguna_id === p.id);
      return pr?.slug ? { ...p, slug: pr.slug } : p;
    });
  }
  await connection();
  const { data, error } = await clientPublik()
    .from("pengajar_publik")
    .select("*")
    .order("jumlah_rating", { ascending: false })
    .limit(batas);
  lemparJikaError(error);
  return ((data ?? []) as BarisPengajarPublik[]).map(normalisasiPengajar);
}

export async function ambilPengajarPublik(idAtauSlug: string): Promise<PengajarPublik | null> {
  const kunci = idAtauSlug.trim().toLowerCase();
  if (pakaiMock) {
    const profils = storeMock().profilPengajar;
    const daftar = pengajarMock.map((p) => {
      const pr = profils.find((x) => x.pengguna_id === p.id);
      return pr?.slug ? { ...p, slug: pr.slug } : p;
    });
    const p = daftar.find((x) => x.slug?.toLowerCase() === kunci || x.id.toLowerCase() === kunci);
    return p ? { ...p, bio: BIO_MOCK[p.id] ?? null } : null;
  }
  await connection();
  if (adalahUuid(idAtauSlug)) {
    const { data, error } = await clientPublik().from("pengajar_publik").select("*").eq("id", idAtauSlug.trim()).maybeSingle();
    lemparJikaError(error);
    return data ? normalisasiPengajar(data as BarisPengajarPublik) : null;
  }
  if (!fiturLanjutan) return null;
  const { data, error } = await clientPublik()
    .from("pengajar_publik")
    .select("*")
    .eq("slug" as never, kunci)
    .maybeSingle();
  lemparJikaError(error);
  return data ? normalisasiPengajar(data as BarisPengajarPublik) : null;
}

/**
 * Pengalaman dan sertifikat pengajar untuk profil publik (spesifikasi 2026-11-28: tabel `pengalaman_pengajar`
 * dan `sertifikat_pengajar`, baca publik untuk pengajar terverifikasi). Sebelum backend siap, mode Supabase
 * mengembalikan daftar kosong agar halaman tetap tampil.
 */
export async function ambilDetailProfilPengajar(pengajarId: string): Promise<DetailProfilPengajar> {
  if (pakaiMock) {
    const d = storeMock().detailPengajar[pengajarId];
    return { pengalaman: d?.pengalaman ?? [], sertifikat: d?.sertifikat ?? [] };
  }
  if (!fiturLanjutan) return { pengalaman: [], sertifikat: [] };
  await connection();
  const [pengalaman, sertifikat] = await Promise.all([
    clientPublik().from("pengalaman_pengajar" as never).select("id, peran, tempat, periode, deskripsi").eq("pengajar_id", pengajarId).order("urutan"),
    clientPublik().from("sertifikat_pengajar" as never).select("id, nama, penerbit, tahun, tautan").eq("pengajar_id", pengajarId).order("tahun", { ascending: false }),
  ]);
  lemparJikaError(pengalaman.error);
  lemparJikaError(sertifikat.error);
  return {
    pengalaman: (pengalaman.data ?? []) as unknown as PengalamanPengajar[],
    sertifikat: (sertifikat.data ?? []) as unknown as SertifikatPengajar[],
  };
}

/** View `ulasan_pengajar_publik`: ulasan terverifikasi (pengajar dengan ≥ 3 rating), terbaru dulu. */
export async function ambilUlasanPengajar(pengajarId: string, batas = 6): Promise<UlasanPengajarPublik[]> {
  if (pakaiMock) {
    return ULASAN_MOCK.filter((u) => u.pengajar_id === pengajarId)
      .sort((a, b) => b.dibuat_pada.localeCompare(a.dibuat_pada))
      .slice(0, batas);
  }
  await connection();
  const { data, error } = await clientPublik()
    .from("ulasan_pengajar_publik")
    .select("*")
    .eq("pengajar_id", pengajarId)
    .order("dibuat_pada", { ascending: false })
    .limit(batas);
  lemparJikaError(error);
  return (data ?? []) as UlasanPengajarPublik[];
}
