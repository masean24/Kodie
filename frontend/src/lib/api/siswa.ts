import type { HasilMinat, Siswa } from "@/types/database";
import { storeMock } from "@/lib/mock/store";
import { buatClientServer } from "@/lib/supabase/server";
import type { InputAnak } from "@/lib/validasi/anak";
import { ambilPenggunaSaya } from "./auth";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Tabel `siswa` dan `hasil_minat`. Hanya untuk server (memakai sesi di cookie). */

async function wajibLogin() {
  const p = await ambilPenggunaSaya();
  if (!p) throw new Error("TIDAK_BERHAK");
  return p;
}

/** Baris `siswa` milik akun siswa yang login. */
export async function ambilSiswaSaya(): Promise<Siswa | null> {
  const p = await wajibLogin();
  if (pakaiMock) return storeMock().siswa.find((s) => s.pengguna_id === p.id) ?? null;
  const supabase = await buatClientServer();
  const { data, error } = await supabase.from("siswa").select("*").eq("pengguna_id", p.id).maybeSingle();
  lemparJikaError(error);
  return (data as Siswa | null) ?? null;
}

/** Profil anak milik orang tua yang login, termasuk akun siswa yang terhubung lewat F2. */
export async function ambilDaftarAnak(): Promise<Siswa[]> {
  const p = await wajibLogin();
  if (pakaiMock) {
    return storeMock()
      .siswa.filter((s) => s.orang_tua_id === p.id)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.from("siswa").select("*").eq("orang_tua_id", p.id).order("nama");
  lemparJikaError(error);
  return (data ?? []) as Siswa[];
}

function bersihkan(input: InputAnak) {
  return { ...input, sekolah: input.sekolah || null };
}

export async function tambahAnak(input: InputAnak): Promise<Siswa> {
  const p = await wajibLogin();
  if (p.peran !== "orang_tua") throw new Error("TIDAK_BERHAK");
  if (pakaiMock) {
    const baru: Siswa = {
      id: crypto.randomUUID(),
      ...bersihkan(input),
      orang_tua_id: p.id,
      pengguna_id: null,
      nama_orang_tua: null,
      email_orang_tua: null,
    };
    storeMock().siswa.push(baru);
    return baru;
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase
    .from("siswa")
    .insert({ ...bersihkan(input), orang_tua_id: p.id })
    .select()
    .single();
  lemparJikaError(error);
  return data as Siswa;
}

/** Hanya profil tanpa akun sendiri yang diubah orang tua. Akun siswa mengelola datanya sendiri. */
export async function ubahAnak(id: string, input: InputAnak): Promise<Siswa> {
  const p = await wajibLogin();
  if (pakaiMock) {
    const s = storeMock().siswa.find((x) => x.id === id);
    if (!s || s.orang_tua_id !== p.id || s.pengguna_id) throw new Error("TIDAK_BERHAK");
    Object.assign(s, bersihkan(input));
    return s;
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.from("siswa").update(bersihkan(input)).eq("id", id).select().single();
  lemparJikaError(error);
  return data as Siswa;
}

/** Backend menolak hapus jika anak punya booking aktif (trigger, PRD bagian 8). */
export async function hapusAnak(id: string): Promise<void> {
  const p = await wajibLogin();
  if (pakaiMock) {
    const store = storeMock();
    const s = store.siswa.find((x) => x.id === id);
    if (!s || s.orang_tua_id !== p.id || s.pengguna_id) throw new Error("TIDAK_BERHAK");
    store.siswa = store.siswa.filter((x) => x.id !== id);
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.from("siswa").delete().eq("id", id);
  lemparJikaError(error);
}

/** Hasil tes minat terbaru per siswa (PRD F4: yang tampil adalah hasil terbaru). */
export async function ambilHasilMinatTerbaru(siswaIds: string[]): Promise<Record<string, HasilMinat>> {
  if (siswaIds.length === 0) return {};
  let baris: HasilMinat[];
  if (pakaiMock) {
    baris = storeMock().hasilMinat.filter((h) => siswaIds.includes(h.siswa_id));
  } else {
    const supabase = await buatClientServer();
    const { data, error } = await supabase
      .from("hasil_minat")
      .select("*")
      .in("siswa_id", siswaIds)
      .order("dibuat_pada", { ascending: false });
    lemparJikaError(error);
    baris = (data ?? []) as HasilMinat[];
  }
  const hasil: Record<string, HasilMinat> = {};
  for (const h of [...baris].sort((a, b) => b.dibuat_pada.localeCompare(a.dibuat_pada))) {
    hasil[h.siswa_id] ??= h;
  }
  return hasil;
}
