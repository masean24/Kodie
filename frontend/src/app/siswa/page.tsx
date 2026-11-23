import type { Metadata } from "next";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { DashboardSementara } from "@/components/area/dashboard-sementara";
import { Catatan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Dashboard siswa" };

export default async function DashboardSiswa() {
  const p = await ambilPenggunaSaya();
  return (
    <DashboardSementara>
      {p?.status === "menunggu_persetujuan" ? (
        <Catatan nada="peringatan" judul="Akunmu menunggu persetujuan orang tua">
          <p>Kamu sudah bisa melihat program dan mengerjakan tes minat. Booking kelas terbuka setelah orang tua menyetujui.</p>
          <TombolTautan href="/siswa/persetujuan" className="mt-3">
            Kirim link persetujuan
          </TombolTautan>
        </Catatan>
      ) : null}
      {p?.status === "ditolak_orang_tua" ? (
        <Catatan nada="peringatan" judul="Orang tua menolak persetujuan">
          Akunmu belum bisa memesan kelas. Bicarakan dengan orang tua, lalu buat link persetujuan baru.
        </Catatan>
      ) : null}
    </DashboardSementara>
  );
}
