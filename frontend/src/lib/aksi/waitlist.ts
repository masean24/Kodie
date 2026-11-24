"use server";

import { refresh } from "next/cache";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { batalWaitlist, daftarWaitlist } from "@/lib/api/waitlist";
import { pesanError } from "@/lib/errors";

/** Server Function daftar tunggu kelas penuh. Aturan sebenarnya dicek RPC backend. */
type Hasil = { galat?: string; info?: string };

export async function aksiDaftarWaitlist(kelasId: string, siswaId: string | null): Promise<Hasil> {
  try {
    const p = await ambilPenggunaSaya();
    if (!p || (p.peran !== "orang_tua" && p.peran !== "siswa")) return { galat: pesanError("TIDAK_BERHAK") };
    if (p.peran === "orang_tua" && !siswaId) return { galat: "Pilih anak yang ingin dimasukkan ke daftar tunggu." };
    const hasil = await daftarWaitlist(kelasId, p.peran === "orang_tua" ? siswaId : null);
    refresh();
    return {
      info: hasil.sudah_terdaftar
        ? "Anda sudah ada di daftar tunggu kelas ini."
        : "Berhasil masuk daftar tunggu. Kami kirim notifikasi begitu ada kursi kosong.",
    };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiBatalWaitlist(kelasId: string): Promise<Hasil> {
  try {
    await batalWaitlist(kelasId);
    refresh();
    return { info: "Anda keluar dari daftar tunggu kelas ini." };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}
