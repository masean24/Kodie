import { connection } from "next/server";
import type { Notifikasi } from "@/types/database";
import { storeMock } from "@/lib/mock/store";
import { buatClientServer } from "@/lib/supabase/server";
import { ambilPenggunaSaya } from "./auth";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Notifikasi di aplikasi (PRD bagian 9). Hanya untuk server (memakai sesi di cookie). */

export async function ambilDaftarNotifikasi(batas = 20): Promise<Notifikasi[]> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p) return [];

  if (pakaiMock) {
    return storeMock()
      .notifikasi.filter((n) => n.pengguna_id === p.id)
      .sort((a, b) => b.dibuat_pada.localeCompare(a.dibuat_pada))
      .slice(0, batas);
  }

  const supabase = await buatClientServer();
  const { data, error } = await supabase
    .from("notifikasi")
    .select("*")
    .eq("pengguna_id", p.id)
    .order("dibuat_pada", { ascending: false })
    .limit(batas);
  lemparJikaError(error);
  return (data ?? []) as Notifikasi[];
}

export async function tandaiNotifikasiDibaca(id: string): Promise<void> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p) throw new Error("TIDAK_BERHAK");

  if (pakaiMock) {
    const n = storeMock().notifikasi.find((x) => x.id === id && x.pengguna_id === p.id);
    if (n && !n.dibaca_pada) n.dibaca_pada = new Date().toISOString();
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase
    .from("notifikasi")
    .update({ dibaca_pada: new Date().toISOString() })
    .eq("id", id)
    .eq("pengguna_id", p.id);
  lemparJikaError(error);
}

export async function tandaiSemuaNotifikasiDibaca(): Promise<number> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p) throw new Error("TIDAK_BERHAK");

  if (pakaiMock) {
    const sekarang = new Date().toISOString();
    let hitung = 0;
    for (const n of storeMock().notifikasi) {
      if (n.pengguna_id === p.id && !n.dibaca_pada) {
        n.dibaca_pada = sekarang;
        hitung++;
      }
    }
    return hitung;
  }

  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("baca_semua_notifikasi");
  lemparJikaError(error);
  return Number(data ?? 0);
}
