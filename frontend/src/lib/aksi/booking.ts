"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { batalkanBooking, buatBooking, kirimBuktiBayar } from "@/lib/api/booking";
import { pesanError } from "@/lib/errors";
import { DASHBOARD } from "@/lib/peran";

/** Server Function untuk F6. Akses tetap dicek di lapisan data dan di backend (RLS dan RPC). */

type Hasil = { galat?: string };

export async function aksiBuatBooking(kelasId: string, siswaId: string): Promise<Hasil> {
  let tujuan: string;
  try {
    const p = await ambilPenggunaSaya();
    if (!p) return { galat: pesanError("TIDAK_BERHAK") };
    const hasil = await buatBooking(kelasId, siswaId);
    tujuan = `${DASHBOARD[p.peran]}/booking/${hasil.id}`;
  } catch (e) {
    return { galat: pesanError(e) };
  }
  redirect(tujuan);
}

export async function aksiBatalkanBooking(bookingId: string): Promise<Hasil> {
  try {
    await batalkanBooking(bookingId);
  } catch (e) {
    const kode = e instanceof Error ? e.message : "";
    return {
      galat:
        kode === "VALIDASI_GAGAL"
          ? "Booking ini tidak bisa dibatalkan lagi karena bukti bayar sudah dikirim atau statusnya sudah berubah."
          : pesanError(e),
    };
  }
  refresh();
  return {};
}

export async function aksiKirimBukti(bookingId: string, path: string): Promise<Hasil> {
  try {
    await kirimBuktiBayar(bookingId, path);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return {};
}
