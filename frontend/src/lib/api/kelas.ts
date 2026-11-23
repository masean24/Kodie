import { connection } from "next/server";
import type { KelasKatalog, Program, StatusKelas } from "@/types/database";
import { buatKelasMock } from "@/lib/mock/data";
import { saringKelas, urutkanKelas, type FilterKelas } from "@/lib/kelas";
import { clientPublik } from "@/lib/supabase/publik";
import { buatClientServer } from "@/lib/supabase/server";
import { lemparJikaError, pakaiMock } from "./sumber";

type BarisKelasKatalog = Omit<KelasKatalog, "mulai_pada" | "pengajar_foto_url"> & {
  mulai_pada?: string | null;
  sesi_pertama_mulai_pada?: string | null;
  pengajar_foto_url?: string | null;
  pengajar_foto_path?: string | null;
};

export function normalisasiKelasKatalog(row: BarisKelasKatalog): KelasKatalog {
  const mulai = row.mulai_pada ?? row.sesi_pertama_mulai_pada ?? row.dibuat_pada ?? "";
  const fotoUrl =
    row.pengajar_foto_url ??
    (row.pengajar_foto_path
      ? clientPublik().storage.from("foto-pengajar").getPublicUrl(row.pengajar_foto_path).data.publicUrl
      : null);
  return {
    ...row,
    mulai_pada: mulai,
    pengajar_foto_url: fotoUrl,
  };
}

/**
 * Hanya untuk Server Component. Sisa kursi dan status bisa dipesan bergantung waktu,
 * jadi data dibaca saat request (connection()), bukan saat build.
 */
async function semuaKelas(): Promise<KelasKatalog[]> {
  await connection();
  if (pakaiMock) return buatKelasMock(new Date());
  const { data, error } = await clientPublik().from("kelas_katalog").select("*");
  lemparJikaError(error);
  return ((data ?? []) as BarisKelasKatalog[]).map(normalisasiKelasKatalog);
}

/** View `kelas_katalog` (tanpa link Meet), disaring dan diurutkan. */
export async function ambilKatalogKelas(filter: FilterKelas = {}): Promise<KelasKatalog[]> {
  return urutkanKelas(saringKelas(await semuaKelas(), filter));
}

export async function ambilKelas(id: string): Promise<KelasKatalog | null> {
  if (pakaiMock) return (await semuaKelas()).find((k) => k.id === id) ?? null;
  await connection();
  const { data, error } = await clientPublik().from("kelas_katalog").select("*").eq("id", id).maybeSingle();
  lemparJikaError(error);
  return data ? normalisasiKelasKatalog(data as BarisKelasKatalog) : null;
}

/**
 * Mengambil detail `KelasKatalog` berdasarkan daftar ID, termasuk kelas berstatus
 * `selesai` atau `disembunyikan` yang tidak masuk view publik `kelas_katalog`.
 */
export async function ambilKelasByIds(kelasIds: string[]): Promise<KelasKatalog[]> {
  const unik = [...new Set(kelasIds)].filter(Boolean);
  if (unik.length === 0) return [];
  if (pakaiMock) return buatKelasMock(new Date()).filter((k) => unik.includes(k.id));

  await connection();
  const { data: katData, error: katErr } = await clientPublik().from("kelas_katalog").select("*").in("id", unik);
  lemparJikaError(katErr);
  const hasil = ((katData ?? []) as BarisKelasKatalog[]).map(normalisasiKelasKatalog);
  const ketemu = new Set(hasil.map((k) => k.id));
  const sisa = unik.filter((id) => !ketemu.has(id));
  if (sisa.length === 0) return hasil;

  const supabase = await buatClientServer();
  const { data: kData, error: kErr } = await supabase.from("kelas").select("*, program(*)").in("id", sisa);
  lemparJikaError(kErr);
  type BarisFallback = {
    id: string;
    program_id: string;
    level: number;
    pengajar_id: string;
    kapasitas: number;
    jam_mulai: string;
    status: StatusKelas;
    dibuat_pada: string;
    program: Program | Program[] | null;
  };
  const barisKelas = (kData ?? []) as unknown as BarisFallback[];
  if (barisKelas.length === 0) return hasil;

  const pengajarIds = [...new Set(barisKelas.map((k) => k.pengajar_id))];
  const [pengRes, sesiRes] = await Promise.all([
    clientPublik().from("pengajar_publik").select("id, nama, foto_path").in("id", pengajarIds),
    supabase.from("sesi_saya").select("kelas_id, nomor, mulai_pada").in("kelas_id", sisa).eq("nomor", 1),
  ]);
  lemparJikaError(pengRes.error);
  lemparJikaError(sesiRes.error);

  const pengMap = new Map(
    ((pengRes.data ?? []) as { id: string; nama: string; foto_path: string | null }[]).map((p) => [p.id, p]),
  );
  const sesi1Map = new Map(
    ((sesiRes.data ?? []) as { kelas_id: string; mulai_pada: string }[]).map((s) => [s.kelas_id, s.mulai_pada]),
  );

  for (const k of barisKelas) {
    const prog = Array.isArray(k.program) ? (k.program[0] ?? null) : k.program;
    if (!prog) continue;
    const peng = pengMap.get(k.pengajar_id);
    const mulaiPada = sesi1Map.get(k.id) ?? k.dibuat_pada;
    const wib = new Date(new Date(mulaiPada).getTime() + 7 * 3_600_000);
    const hari_mingguan = ((wib.getUTCDay() + 6) % 7) + 1;
    hasil.push(
      normalisasiKelasKatalog({
        id: k.id,
        program_id: k.program_id,
        level: k.level ?? 1,
        pengajar_id: k.pengajar_id,
        kapasitas: k.kapasitas,
        jam_mulai: k.jam_mulai,
        status: k.status,
        kursi_terpakai: 0,
        sisa_kursi: 0,
        bisa_dibooking: false,
        hari_mingguan,
        program_slug: prog.slug,
        program_nama: prog.nama,
        jenjang: prog.jenjang,
        kelas_min: prog.kelas_min,
        kelas_maks: prog.kelas_maks,
        durasi_menit: prog.durasi_menit,
        jumlah_sesi: prog.jumlah_sesi,
        harga_paket: prog.harga_paket,
        pengajar_nama: peng?.nama ?? "Pengajar",
        pengajar_foto_path: peng?.foto_path ?? null,
        sesi_pertama_mulai_pada: mulaiPada,
        dibuat_pada: k.dibuat_pada,
      }),
    );
  }
  return hasil;
}
