import type { Metadata } from "next";
import { HalamanPesan } from "@/components/booking/halaman-pesan";

export const metadata: Metadata = { title: "Pesan kelas" };

export default async function PesanKelasSiswa({ searchParams }: PageProps<"/siswa/booking/baru">) {
  const { kelas, trial } = await searchParams;
  return <HalamanPesan peran="siswa" kelasId={typeof kelas === "string" ? kelas : null} trial={trial === "1"} />;
}
