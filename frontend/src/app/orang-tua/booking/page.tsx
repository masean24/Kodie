import type { Metadata } from "next";
import { ambilDaftarBooking } from "@/lib/api/booking";
import { DaftarBooking } from "@/components/booking/daftar-booking";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Booking" };

export default async function DaftarBookingOrangTua() {
  const daftar = await ambilDaftarBooking();
  return (
    <div className="flex max-w-[864px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">Booking</h1>
        <TombolTautan href="/kelas" varian="kedua">
          Pesan kelas lain
        </TombolTautan>
      </div>
      <DaftarBooking daftar={daftar} basePath="/orang-tua/booking" />
    </div>
  );
}
