import type { Metadata } from "next";
import { HalamanPesan } from "@/components/booking/halaman-pesan";

export const metadata: Metadata = { title: "Pesan kelas" };

export default async function PesanKelasOrangTua({ searchParams }: PageProps<"/orang-tua/booking/baru">) {
  const { kelas } = await searchParams;
  return <HalamanPesan peran="orang_tua" kelasId={typeof kelas === "string" ? kelas : null} />;
}
