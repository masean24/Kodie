import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ambilDetailRaporPengguna } from "@/lib/api/sesi";
import { DetailRapor } from "@/components/rapor/tampilan-rapor";

export const metadata: Metadata = { title: "Detail rapor jurusan" };

export default async function HalamanDetailRaporSiswa({ params }: PageProps<"/siswa/rapor/[id]">) {
  const { id } = await params;
  const item = await ambilDetailRaporPengguna(id);
  if (!item) notFound();
  return <DetailRapor item={item} basePath="/siswa" />;
}
