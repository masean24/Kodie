import { connection } from "next/server";
import type { HasilPersetujuan, InfoPersetujuan, KeputusanPersetujuan, LinkPersetujuan } from "@/types/database";
import { storeMock } from "@/lib/mock/store";
import { buatClientServer } from "@/lib/supabase/server";
import { ambilPenggunaSaya } from "./auth";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Persetujuan orang tua (PRD F2). Hanya untuk server. */

const TUJUH_HARI = 7 * 86_400_000;

function tokenMockBerlaku(token: string) {
  const t = storeMock().token.find((x) => x.token === token);
  if (!t || t.status !== "menunggu") return null;
  if (new Date(t.kedaluwarsa_pada) <= new Date()) {
    t.status = "kedaluwarsa";
    return null;
  }
  return t;
}

/** RPC `buat_link_persetujuan()`: token baru, token lama siswa ini otomatis tidak berlaku. */
export async function buatLinkPersetujuan(): Promise<LinkPersetujuan> {
  if (pakaiMock) {
    const p = await ambilPenggunaSaya();
    const store = storeMock();
    const siswa = p && p.peran === "siswa" ? store.siswa.find((s) => s.pengguna_id === p.id) : null;
    if (!p || !siswa) throw new Error("TIDAK_BERHAK");
    if (p.status === "aktif") throw new Error("VALIDASI_GAGAL");
    for (const t of store.token) if (t.siswa_id === siswa.id && t.status === "menunggu") t.status = "kedaluwarsa";
    const baru = {
      token: crypto.randomUUID().replaceAll("-", ""),
      siswa_id: siswa.id,
      kedaluwarsa_pada: new Date(Date.now() + TUJUH_HARI).toISOString(),
      status: "menunggu" as const,
      orang_tua_id: null,
      diputuskan_pada: null,
    };
    store.token.push(baru);
    return { token: baru.token, kedaluwarsa_pada: baru.kedaluwarsa_pada };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("buat_link_persetujuan");
  lemparJikaError(error);
  return data as LinkPersetujuan;
}

/** RPC `info_persetujuan(p_token)`. Lempar TOKEN_TIDAK_BERLAKU jika kedaluwarsa atau sudah dipakai. */
export async function infoPersetujuan(token: string): Promise<InfoPersetujuan> {
  await connection();
  if (pakaiMock) {
    const t = tokenMockBerlaku(token);
    const s = t ? storeMock().siswa.find((x) => x.id === t.siswa_id) : null;
    if (!t || !s) throw new Error("TOKEN_TIDAK_BERLAKU");
    return { siswa_id: s.id, nama: s.nama, jenjang: s.jenjang, kelas: s.kelas, sekolah: s.sekolah, kedaluwarsa_pada: t.kedaluwarsa_pada };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("info_persetujuan", { p_token: token });
  lemparJikaError(error);
  return data as InfoPersetujuan;
}

/** RPC `putuskan_persetujuan`. `setujui` wajib login sebagai orang tua, `tolak` boleh tanpa login. */
export async function putuskanPersetujuan(token: string, keputusan: KeputusanPersetujuan): Promise<HasilPersetujuan> {
  if (pakaiMock) {
    const p = await ambilPenggunaSaya();
    if (keputusan === "setujui" && p?.peran !== "orang_tua") throw new Error("TIDAK_BERHAK");
    const store = storeMock();
    const t = tokenMockBerlaku(token);
    const s = t ? store.siswa.find((x) => x.id === t.siswa_id) : null;
    if (!t || !s) throw new Error("TOKEN_TIDAK_BERLAKU");
    const sekarang = new Date().toISOString();
    t.status = keputusan === "setujui" ? "disetujui" : "ditolak";
    t.diputuskan_pada = sekarang;
    if (keputusan === "setujui" && p) {
      t.orang_tua_id = p.id;
      s.orang_tua_id = p.id;
    }
    const status = keputusan === "setujui" ? "aktif" : "ditolak_orang_tua";
    if (s.pengguna_id) store.status[s.pengguna_id] = status;
    return { status, siswa_id: s.id, diputuskan_pada: sekarang };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("putuskan_persetujuan", { p_token: token, p_keputusan: keputusan });
  lemparJikaError(error);
  return data as HasilPersetujuan;
}
