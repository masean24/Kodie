import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ambilBooking, ambilInfoPembayaran } from "@/lib/api/booking";
import { DetailBooking } from "@/components/booking/detail-booking";

export const metadata: Metadata = { title: "Detail booking" };

export default async function DetailBookingOrangTua({ params }: PageProps<"/orang-tua/booking/[id]">) {
  const { id } = await params;
  const r = await ambilBooking(id);
  if (!r) notFound();
  const info = r.booking.status === "menunggu_pembayaran" ? await ambilInfoPembayaran() : null;
  return <DetailBooking r={r} info={info} basePath="/orang-tua/booking" />;
}
