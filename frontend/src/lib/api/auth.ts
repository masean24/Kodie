import { cookies } from "next/headers";
import type { Pengguna } from "@/types/database";
import { akunMock } from "@/lib/mock/akun";
import { storeMock } from "@/lib/mock/store";
import { buatClientServer } from "@/lib/supabase/server";
import { kodeErrorAuth } from "@/lib/errors";
import { dataSignUp, type InputDaftar, type InputMasuk } from "@/lib/validasi/auth";
import { pakaiMock } from "./sumber";

/**
 * Auth. Hanya untuk server (Server Component, Server Function, proxy), karena sesi ada di cookie.
 * Supabase: sesi dikelola @supabase/ssr. Mock: baris `pengguna` disimpan di cookie httpOnly.
 */

export const COOKIE_MOCK = "kodie_mock_pengguna";

export function bacaCookieMock(nilai: string | undefined): Pengguna | null {
  if (!nilai) return null;
  try {
    return JSON.parse(Buffer.from(nilai, "base64url").toString("utf8")) as Pengguna;
  } catch {
    return null;
  }
}

async function tulisCookieMock(p: Pengguna | null) {
  const c = await cookies();
  if (!p) {
    c.delete(COOKIE_MOCK);
    return;
  }
  c.set(COOKIE_MOCK, Buffer.from(JSON.stringify(p)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Akun yang didaftarkan selama server mock berjalan (hilang saat server dimulai ulang). */
const gAkun = globalThis as typeof globalThis & { __kodieAkunBaru?: typeof akunMock };
const akunBaruMock: typeof akunMock = (gAkun.__kodieAkunBaru ??= []);

/** Baris `pengguna` milik pengguna yang sedang login, atau null untuk tamu. */
export async function ambilPenggunaSaya(): Promise<Pengguna | null> {
  if (pakaiMock) {
    const p = bacaCookieMock((await cookies()).get(COOKIE_MOCK)?.value);
    const status = p ? storeMock().status[p.id] : undefined;
    return p && status ? { ...p, status } : p;
  }
  const supabase = await buatClientServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("pengguna").select("*").eq("id", u.user.id).maybeSingle();
  return (data as Pengguna | null) ?? null;
}

/** Lempar Error berisi kode (lib/errors.ts) jika gagal. */
export async function masuk({ email, password }: InputMasuk): Promise<Pengguna> {
  if (pakaiMock) {
    const akun = [...akunMock, ...akunBaruMock].find((a) => a.email === email.toLowerCase());
    if (!akun || akun.password !== password) throw new Error("LOGIN_GAGAL");
    await tulisCookieMock(akun.pengguna);
    return akun.pengguna;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(kodeErrorAuth(error));
  const p = await ambilPenggunaSaya();
  if (!p) throw new Error("UMUM");
  return p;
}

/**
 * Daftar dengan peran. Trigger database membuat baris `pengguna` dan `siswa`/`profil_pengajar`
 * dari `options.data`. `pengguna` bernilai null jika Supabase meminta konfirmasi email dulu.
 */
export async function daftar(input: InputDaftar): Promise<{ pengguna: Pengguna | null }> {
  const email = input.email.toLowerCase();
  if (pakaiMock) {
    if ([...akunMock, ...akunBaruMock].some((a) => a.email === email)) throw new Error("EMAIL_SUDAH_DIPAKAI");
    const pengguna: Pengguna = {
      id: crypto.randomUUID(),
      peran: input.peran,
      nama: input.nama,
      no_wa: "no_wa" in input ? input.no_wa : null,
      status:
        input.peran === "siswa" ? "menunggu_persetujuan" : input.peran === "pengajar" ? "menunggu_verifikasi" : "aktif",
      dibuat_pada: new Date().toISOString(),
    };
    akunBaruMock.push({ email, password: input.password, pengguna });
    if (input.peran === "siswa") {
      // Padanan trigger database: baris `siswa` milik akun ini.
      storeMock().siswa.push({
        id: crypto.randomUUID(),
        nama: input.nama,
        tanggal_lahir: input.tanggal_lahir,
        jenjang: input.jenjang,
        kelas: input.kelas,
        sekolah: input.sekolah || null,
        orang_tua_id: null,
        pengguna_id: pengguna.id,
        nama_orang_tua: input.nama_orang_tua,
        email_orang_tua: input.email_orang_tua || null,
      });
    }
    await tulisCookieMock(pengguna);
    return { pengguna };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: dataSignUp(input) },
  });
  if (error) throw new Error(kodeErrorAuth(error));
  // Jika konfirmasi email aktif, email terdaftar dikembalikan tanpa identitas dan tanpa error.
  if (data.user && data.user.identities?.length === 0) throw new Error("EMAIL_SUDAH_DIPAKAI");
  if (!data.session) return { pengguna: null };
  return { pengguna: await ambilPenggunaSaya() };
}

export async function keluar(): Promise<void> {
  if (pakaiMock) return tulisCookieMock(null);
  const supabase = await buatClientServer();
  await supabase.auth.signOut({ scope: "local" });
}
