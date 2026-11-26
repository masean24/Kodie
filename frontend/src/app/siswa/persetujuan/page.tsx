import type { Metadata } from "next";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilHasilMinatTerbaru, ambilSiswaSaya } from "@/lib/api/siswa";
import { Catatan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { PanelLink } from "@/components/persetujuan/panel-link";
import { SambilMenunggu } from "@/components/persetujuan/sambil-menunggu";

export const metadata: Metadata = { title: "Persetujuan orang tua" };

export default async function HalamanPersetujuan() {
  const [p, siswa] = await Promise.all([ambilPenggunaSaya(), ambilSiswaSaya()]);
  const hasil = siswa ? (await ambilHasilMinatTerbaru([siswa.id]))[siswa.id] : undefined;

  return (
    <div className="flex max-w-[784px] flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">Persetujuan orang tua</h1>
        <p className="mt-2 text-text-muted">Akun siswa aktif setelah orang tua menyetujui (UU Pelindungan Data Pribadi Pasal 25).</p>
      </div>

      {p?.status === "aktif" ? (
        <Catatan nada="sukses" judul="Orang tuamu sudah menyetujui">
          <p>Akunmu aktif. Sekarang kamu bisa memesan kelas.</p>
          <TombolTautan href="/kelas" className="mt-3">
            Lihat katalog kelas
          </TombolTautan>
        </Catatan>
      ) : (
        <>
          {p?.status === "ditolak_orang_tua" ? (
            <Catatan nada="peringatan" judul="Orang tua menolak permintaan sebelumnya">
              Bicarakan dulu dengan orang tuamu. Kalau sudah sepakat, buat link baru di bawah.
            </Catatan>
          ) : (
            <Catatan judul="Akun menunggu persetujuan orang tua">
              Kirim link ke orang tuamu. Sambil menunggu, kamu tetap bisa melihat kelas dan mengerjakan tes minat.
            </Catatan>
          )}
          <PanelLink namaSiswa={siswa?.nama ?? p?.nama ?? "Siswa"} />
          <SambilMenunggu hasil={hasil} />
        </>
      )}
    </div>
  );
}
