import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Lock } from "lucide-react";
import { ambilHalamanLaporan } from "@/lib/api/mengajar";
import { formatTanggal, formatTanggalJam } from "@/lib/format";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { FormLaporan } from "@/components/mengajar/form-laporan";
import { Catatan, Kartu, Lencana } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Laporan sesi" };

export default async function HalamanLaporanSesi({ params }: PageProps<"/mengajar/sesi/[id]/laporan">) {
  const { id } = await params;
  const data = await ambilHalamanLaporan(id);
  if (!data) notFound();

  const { sesi, kelas, program, siswa, laporanSesi, laporanSiswa, raporJurusan, bisaIsi, terkunci, wajibRapor } = data;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/mengajar/kelas/${kelas.id}`}
        className="inline-flex min-h-touch items-center gap-2 self-start font-display font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden className="size-5" /> Kembali ke kelas
      </Link>

      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[48px]">
          Laporan sesi {sesi.nomor}
        </h1>
        <p className="mt-2 text-lg text-text-muted">
          {program.nama} Level {kelas.level} · {formatTanggal(sesi.mulai_pada)}. Laporan bisa diedit sampai 24 jam setelah dikirim.
        </p>
      </div>

      {!bisaIsi ? (
        <Catatan nada="info" judul="Laporan belum bisa diisi">
          <p>
            Laporan baru dibuka saat sesi dimulai, yaitu pada{" "}
            <span className="font-bold">{formatTanggalJam(sesi.mulai_pada)}</span>.
          </p>
        </Catatan>
      ) : terkunci && laporanSesi ? (
        <div className="flex max-w-[820px] flex-col gap-5">
          <Catatan nada="info" judul="Laporan sudah terkunci">
            <p className="flex items-center gap-2">
              <Lock aria-hidden className="size-4 shrink-0" />
              Dikirim pada {formatTanggalJam(laporanSesi.dikirim_pada)}. Perubahan ditutup setelah 24 jam.
            </p>
          </Catatan>

          <Kartu className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Ringkasan sesi</h2>
            <div>
              <p className="text-sm text-text-muted">Ringkasan materi</p>
              <p className="mt-1">{laporanSesi.ringkasan}</p>
            </div>
            {laporanSesi.rekaman_url ? (
              <div>
                <p className="text-sm text-text-muted">Rekaman sesi</p>
                <a
                  href={laporanSesi.rekaman_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
                >
                  <ExternalLink aria-hidden className="size-4" /> Buka tautan rekaman
                </a>
              </div>
            ) : null}
            {laporanSesi.kendala ? (
              <div>
                <p className="text-sm text-text-muted">Kendala</p>
                <p className="mt-1">{laporanSesi.kendala}</p>
              </div>
            ) : null}
          </Kartu>

          <Kartu className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Catatan siswa</h2>
            <ul className="flex flex-col gap-3">
              {siswa.map((s) => {
                const ls = laporanSiswa.find((x) => x.siswa_id === s.id);
                const rj = raporJurusan.find((x) => x.siswa_id === s.id);
                return (
                  <li key={s.id} className="rounded-md bg-surface-sunken p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">{s.nama}</p>
                      <Lencana nada={ls?.hadir ? "sukses" : "netral"}>{ls?.hadir ? "Hadir" : "Tidak hadir"}</Lencana>
                    </div>
                    {ls?.catatan ? <p className="mt-2">{ls.catatan}</p> : null}
                    {ls?.karya_url ? (
                      <a
                        href={ls.karya_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                      >
                        <ExternalLink aria-hidden className="size-4" /> Lihat hasil karya
                      </a>
                    ) : null}
                    {rj ? (
                      <div className="mt-3 border-t border-border pt-3 text-sm">
                        <p className="font-bold">Rekomendasi jurusan: {NAMA_BIDANG[rj.bidang_rekomendasi]}</p>
                        <p className="mt-1 text-text-muted">
                          Skor — Software {rj.skor_software}/5 · Jaringan {rj.skor_jaringan}/5 · IoT {rj.skor_iot}/5 · AI & Data{" "}
                          {rj.skor_ai_data}/5
                        </p>
                        <p className="mt-1">{rj.alasan}</p>
                        <p className="mt-1 text-text-muted">Saran: {rj.saran}</p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Kartu>
        </div>
      ) : (
        <FormLaporan
          sesiId={sesi.id}
          siswa={siswa}
          laporanAwal={laporanSesi}
          laporanSiswaAwal={laporanSiswa}
          raporAwal={raporJurusan}
          wajibRapor={wajibRapor}
        />
      )}
    </div>
  );
}
