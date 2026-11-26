import type { Metadata } from "next";
import { VideoOff } from "lucide-react";
import type { StatusKelas } from "@/types/database";
import { ambilDaftarKelasAdmin } from "@/lib/api/admin";
import { formatTanggalJam } from "@/lib/format";
import { FormUbahKelasAdmin, TombolBuatMeetUlang } from "@/components/admin/aksi-kelola";
import { TagProgram } from "@/components/kategori";
import { Catatan, Kartu, Lencana, StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Kelola kelas & link Meet" };

const LABEL_STATUS_KELAS: Record<StatusKelas, string> = {
  terbuka: "Terbuka",
  berjalan: "Berjalan",
  selesai: "Selesai",
  disembunyikan: "Disembunyikan",
};

const NADA_STATUS_KELAS: Record<StatusKelas, "sukses" | "info" | "netral" | "peringatan"> = {
  terbuka: "info",
  berjalan: "sukses",
  selesai: "netral",
  disembunyikan: "peringatan",
};

export default async function HalamanKelasAdmin() {
  const { kelas, sesiTanpaMeet } = await ambilDaftarKelasAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-40 md:leading-[46px]">
          Kelola kelas & link Meet
        </h1>
        <p className="mt-2 text-text-muted">
          Pantau sesi terjadwal yang gagal membuat link Meet serta ubah status atau kapasitas kelas.
        </p>
      </div>

      {sesiTanpaMeet.length > 0 ? (
        <Catatan nada="peringatan" judul={`${sesiTanpaMeet.length} sesi belum memiliki link Google Meet`}>
          <div className="mt-3 flex flex-col gap-3">
            {sesiTanpaMeet.map((item) => (
              <div
                key={item.sesi.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface p-4 text-ink"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <VideoOff aria-hidden className="size-4 text-warning" />
                    <span>
                      {item.programNama} — Sesi {item.sesi.nomor}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">
                    Pengajar: {item.pengajarNama} · Jadwal: {formatTanggalJam(item.sesi.mulai_pada)}
                  </p>
                  {item.sesi.meet_gagal_terakhir ? (
                    <p className="text-sm text-danger">Catatan gagal: {item.sesi.meet_gagal_terakhir}</p>
                  ) : null}
                </div>
                <TombolBuatMeetUlang kelasId={item.sesi.kelas_id} />
              </div>
            ))}
          </div>
        </Catatan>
      ) : null}

      <section aria-labelledby="judul-daftar-kelas" className="flex flex-col gap-4">
        <h2 id="judul-daftar-kelas" className="text-xl font-semibold">
          Semua kelas ({kelas.length})
        </h2>

        {kelas.length === 0 ? (
          <StateKosong judul="Belum ada kelas terdaftar" />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-card bg-surface md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-sunken text-text-muted">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Program & level</th>
                    <th className="px-5 py-3.5 font-semibold">Pengajar</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Ubah status & kapasitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {kelas.map((k) => (
                    <tr key={k.id} className="align-middle hover:bg-surface-sunken/50">
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <TagProgram slug={k.programSlug}>{k.programNama}</TagProgram>
                          <span className="text-sm text-text-muted">
                            Level {k.level} {k.mulaiPada ? `· Mulai ${formatTanggalJam(k.mulaiPada)}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold">{k.pengajarNama}</td>
                      <td className="px-5 py-4">
                        <Lencana nada={NADA_STATUS_KELAS[k.status]}>{LABEL_STATUS_KELAS[k.status]}</Lencana>
                      </td>
                      <td className="px-5 py-4">
                        <FormUbahKelasAdmin kelasId={k.id} statusAwal={k.status} kapasitasAwal={k.kapasitas} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 md:hidden">
              {kelas.map((k) => (
                <Kartu key={k.id} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <TagProgram slug={k.programSlug}>{k.programNama}</TagProgram>
                    <Lencana nada={NADA_STATUS_KELAS[k.status]}>{LABEL_STATUS_KELAS[k.status]}</Lencana>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">
                      Level {k.level} · Pengajar {k.pengajarNama}
                    </p>
                    {k.mulaiPada ? (
                      <p className="text-sm text-text-muted">Mulai {formatTanggalJam(k.mulaiPada)}</p>
                    ) : null}
                  </div>
                  <FormUbahKelasAdmin kelasId={k.id} statusAwal={k.status} kapasitasAwal={k.kapasitas} />
                </Kartu>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
