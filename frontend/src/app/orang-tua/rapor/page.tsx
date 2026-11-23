import type { Metadata } from "next";
import { ambilDaftarRaporPengguna } from "@/lib/api/sesi";
import { DaftarRapor } from "@/components/rapor/tampilan-rapor";

export const metadata: Metadata = { title: "Rapor jurusan" };

export default async function HalamanRaporOrangTua() {
  const daftar = await ambilDaftarRaporPengguna();
  return <DaftarRapor daftar={daftar} basePath="/orang-tua" />;
}
