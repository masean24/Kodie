import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilDaftarAnak, ambilHasilMinatTerbaru } from "@/lib/api/siswa";
import { ambilDaftarBooking } from "@/lib/api/booking";
import { ambilRingkasanSesiDanLaporan } from "@/lib/api/sesi";
import { KartuPerluBayar } from "@/components/booking/kartu-perlu-bayar";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { kelasTombol } from "@/components/ui/tombol";
import { inisialNama } from "@/lib/nama";
import { KartuBagian, LaporanTerbaru, RaporJurusan, SesiTerdekat, sapaan } from "@/components/area/kartu-dashboard";

export const metadata: Metadata = { title: "Dashboard orang tua" };

export default async function DashboardOrangTua() {
  const [p, anak, booking, ringkasan] = await Promise.all([
    ambilPenggunaSaya(),
    ambilDaftarAnak(),
    ambilDaftarBooking(),
    ambilRingkasanSesiDanLaporan(),
  ]);
  const hasil = await ambilHasilMinatTerbaru(anak.map((a) => a.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">
          {sapaan(new Date())}, {p?.nama.split(" ")[0]}
        </h1>
        <p className="mt-2 text-text-muted">Ini ringkasan kelas anak-anak Anda.</p>
      </div>
      <KartuPerluBayar daftar={booking} basePath="/orang-tua/booking" />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <SesiTerdekat daftar={ringkasan.sesiTerdekat} basePath="/orang-tua" />
          <LaporanTerbaru daftar={ringkasan.laporanTerbaru} basePath="/orang-tua" />
        </div>
        <div className="flex flex-col gap-6">
          <KartuBagian judul="Anak Anda" id="judul-anak">
            {anak.length === 0 ? (
              <p className="text-text-muted">Belum ada profil anak.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {anak.map((a) => {
                  const h = hasil[a.id];
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-subtle text-sm font-display font-semibold text-primary">
                        {inisialNama(a.nama)}
                      </span>
                      <div>
                        <p className="font-bold">{a.nama}</p>
                        <p className="text-sm text-text-muted">
                          {a.jenjang} kelas {a.kelas}
                          {a.pengguna_id ? " · punya akun sendiri" : ""}
                        </p>
                        <p className="text-sm text-text-muted">
                          {h ? `Tes minat: ${NAMA_BIDANG[h.bidang_teratas]} ${h.skor[h.bidang_teratas]}%` : "Belum tes minat"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <Link href="/orang-tua/anak" className={kelasTombol("kedua", "md", "w-full")}>
                <Plus aria-hidden className="size-5" /> Kelola anak
              </Link>
              <Link href="/tes-minat" className="flex min-h-touch items-center justify-center font-display font-semibold text-primary underline-offset-4 hover:underline">
                Tes minat untuk anak
              </Link>
            </div>
          </KartuBagian>
          <RaporJurusan daftar={ringkasan.raporDaftar} basePath="/orang-tua" />
        </div>
      </div>
    </div>
  );
}
