import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ambilDetailSesiPengguna } from "@/lib/api/sesi";
import { DetailSesi } from "@/components/sesi/detail-sesi";

export const metadata: Metadata = { title: "Detail sesi" };

export default async function HalamanSesiOrangTua({ params }: PageProps<"/orang-tua/sesi/[id]">) {
  const { id } = await params;
  const data = await ambilDetailSesiPengguna(id);
  if (!data) notFound();
  return <DetailSesi data={data} basePath="/orang-tua" />;
}
