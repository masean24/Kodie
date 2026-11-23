import type { Metadata } from "next";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilHasilMinatTerbaru, ambilSiswaSaya } from "@/lib/api/siswa";
import { Catatan } from "@/components/ui/dasar";
import { HasilTesTerakhir, LaporanTerbaru, RaporJurusan, SesiTerdekat } from "@/components/area/kartu-dashboard";
import { PanelLink } from "@/components/persetujuan/panel-link";
import { SambilMenunggu } from "@/components/persetujuan/sambil-menunggu";

export const metadata: Metadata = { title: "Dashboard siswa" };

export default async function DashboardSiswa() {
  const [p, siswa] = await Promise.all([ambilPenggunaSaya(), ambilSiswaSaya()]);
  const hasil = siswa ? (await ambilHasilMinatTerbaru([siswa.id]))[siswa.id] : undefined;
  const panggilan = p?.nama.split(" ")[0];
  const aktif = p?.status === "aktif";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">Halo, {panggilan}</h1>
        <p className="mt-2 text-text-muted">
          {aktif ? "Ini jadwal dan laporan terbarumu." : "Satu langkah lagi sebelum kamu bisa pesan kelas."}
        </p>
      </div>

      {aktif ? (
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <SesiTerdekat judul="Sesi berikutnya" />
            <LaporanTerbaru />
          </div>
          <div className="flex flex-col gap-6">
            <HasilTesTerakhir hasil={hasil} />
            <RaporJurusan />
          </div>
        </div>
      ) : (
        <div className="flex max-w-[864px] flex-col gap-6">
          {p?.status === "ditolak_orang_tua" ? (
            <Catatan nada="peringatan" judul="Orang tua menolak persetujuan">
              Akunmu belum bisa memesan kelas. Bicarakan dulu dengan orang tuamu, lalu kirim link baru.
            </Catatan>
          ) : p?.status === "nonaktif" ? (
            <Catatan nada="peringatan" judul="Akun nonaktif">
              Hubungi admin Kodie untuk informasi lebih lanjut.
            </Catatan>
          ) : (
            <Catatan judul="Akun menunggu persetujuan orang tua">
              Kirim link persetujuan ke orang tuamu. Sambil menunggu, kamu tetap bisa melihat kelas dan mengerjakan tes minat.
            </Catatan>
          )}
          {p?.status === "nonaktif" ? null : <PanelLink namaSiswa={siswa?.nama ?? p?.nama ?? "Siswa"} />}
          <SambilMenunggu hasil={hasil} />
        </div>
      )}
    </div>
  );
}
