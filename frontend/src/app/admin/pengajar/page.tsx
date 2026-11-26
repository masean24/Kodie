import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { formatLamaMenunggu, type UrutanAntrean } from "@/lib/admin";
import { ambilAntreanPengajarAdmin, ambilRingkasanAdmin } from "@/lib/api/admin";
import { formatTanggalJam } from "@/lib/format";
import { LABEL_STATUS_KERJA } from "@/lib/mengajar";
import { LABEL_STATUS } from "@/lib/peran";
import { FilterAntrean, RingkasanAntreanPills } from "@/components/admin/filter-antrean";
import { Kartu, Lencana, StateKosong } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Verifikasi pengajar" };

const STATUS_VALID = ["menunggu_verifikasi", "terverifikasi", "ditolak", "nonaktif", "semua"] as const;
type FilterStatus = (typeof STATUS_VALID)[number];

const OPSI_STATUS = [
  { nilai: "menunggu_verifikasi", label: "Menunggu verifikasi" },
  { nilai: "terverifikasi", label: "Terverifikasi" },
  { nilai: "ditolak", label: "Ditolak" },
  { nilai: "nonaktif", label: "Nonaktif" },
  { nilai: "semua", label: "Semua" },
];

function nadaStatus(status: string) {
  if (status === "terverifikasi") return "sukses" as const;
  if (status === "menunggu_verifikasi") return "peringatan" as const;
  if (status === "ditolak" || status === "nonaktif") return "bahaya" as const;
  return "netral" as const;
}

function StatusSyarat({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      {ok ? (
        <CheckCircle2 aria-hidden className="size-3.5 text-success" />
      ) : (
        <XCircle aria-hidden className="size-3.5 text-text-muted" />
      )}
      <span className={ok ? "font-semibold text-ink" : "text-text-muted"}>{label}</span>
    </span>
  );
}

export default async function HalamanPengajarAdmin({ searchParams }: PageProps<"/admin/pengajar">) {
  const qp = await searchParams;
  const rawStatus = typeof qp.status === "string" ? qp.status : "menunggu_verifikasi";
  const rawUrutan = typeof qp.urutan === "string" ? qp.urutan : "terlama";
  const status: FilterStatus = (STATUS_VALID as readonly string[]).includes(rawStatus)
    ? (rawStatus as FilterStatus)
    : "menunggu_verifikasi";
  const urutan: UrutanAntrean = rawUrutan === "terbaru" ? "terbaru" : "terlama";

  const [ringkasan, daftar] = await Promise.all([
    ambilRingkasanAdmin(),
    ambilAntreanPengajarAdmin(status, urutan),
  ]);
  const sekarang = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-40 md:leading-[46px]">
          Verifikasi & kelola pengajar
        </h1>
        <p className="mt-2 text-text-muted">
          Periksa dokumen identitas (KTP/KTM), SKCK, hasil wawancara, serta program yang diajar.
        </p>
      </div>

      <RingkasanAntreanPills ringkasan={ringkasan} />

      <FilterAntrean status={status} urutan={urutan} opsiStatus={OPSI_STATUS} />

      {daftar.length === 0 ? (
        <StateKosong
          judul="Tidak ada pengajar pada filter ini"
          keterangan="Pendaftar pengajar baru atau pengajar dengan status tersebut akan tampil di sini."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-card bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Pengajar</th>
                  <th className="px-5 py-3.5 font-semibold">Latar belakang</th>
                  <th className="px-5 py-3.5 font-semibold">Kelengkapan</th>
                  <th className="px-5 py-3.5 font-semibold">Status & waktu</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {daftar.map(({ pengguna, profil }) => (
                  <tr key={pengguna.id} className="align-middle hover:bg-surface-sunken/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{pengguna.nama}</p>
                      <p className="text-sm text-text-muted">{pengguna.no_wa ?? "No. WA belum diisi"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {profil ? (
                        <div>
                          <p className="font-semibold">{LABEL_STATUS_KERJA[profil.status_kerja]}</p>
                          <p className="text-sm text-text-muted">
                            {[profil.jurusan, profil.kampus].filter(Boolean).join(" · ") || "Belum diisi"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-text-muted">Profil belum dilengkapi</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <StatusSyarat label="KTP/KTM" ok={Boolean(profil?.identitas_path)} />
                        <StatusSyarat label="SKCK" ok={Boolean(profil?.skck_path)} />
                        <StatusSyarat label="Wawancara" ok={Boolean(profil?.wawancara_selesai)} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <Lencana nada={nadaStatus(pengguna.status)}>{LABEL_STATUS[pengguna.status]}</Lencana>
                        <span className="text-sm text-text-muted">
                          {pengguna.status === "menunggu_verifikasi"
                            ? formatLamaMenunggu(pengguna.dibuat_pada, sekarang)
                            : formatTanggalJam(pengguna.dibuat_pada)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <TombolTautan href={`/admin/pengajar/${pengguna.id}`} varian="kedua">
                        {pengguna.status === "menunggu_verifikasi" ? "Periksa" : "Kelola"}
                      </TombolTautan>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {daftar.map(({ pengguna, profil }) => (
              <Kartu key={pengguna.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{pengguna.nama}</p>
                    <p className="text-sm text-text-muted">{pengguna.no_wa ?? "No. WA belum diisi"}</p>
                  </div>
                  <Lencana nada={nadaStatus(pengguna.status)}>{LABEL_STATUS[pengguna.status]}</Lencana>
                </div>
                {profil ? (
                  <p className="text-sm text-text-muted">
                    {LABEL_STATUS_KERJA[profil.status_kerja]}
                    {profil.jurusan || profil.kampus
                      ? ` · ${[profil.jurusan, profil.kampus].filter(Boolean).join(" — ")}`
                      : ""}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <StatusSyarat label="KTP/KTM" ok={Boolean(profil?.identitas_path)} />
                  <StatusSyarat label="SKCK" ok={Boolean(profil?.skck_path)} />
                  <StatusSyarat label="Wawancara" ok={Boolean(profil?.wawancara_selesai)} />
                </div>
                <p className="text-sm text-text-muted">
                  {pengguna.status === "menunggu_verifikasi"
                    ? formatLamaMenunggu(pengguna.dibuat_pada, sekarang)
                    : `Terdaftar ${formatTanggalJam(pengguna.dibuat_pada)}`}
                </p>
                <TombolTautan href={`/admin/pengajar/${pengguna.id}`} varian="kedua" className="w-full">
                  {pengguna.status === "menunggu_verifikasi" ? "Periksa dokumen & putuskan" : "Kelola pengajar"}
                </TombolTautan>
              </Kartu>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
