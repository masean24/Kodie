import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import type { StatusMasalah } from "@/types/database";
import { LABEL_STATUS_MASALAH, type UrutanAntrean } from "@/lib/admin";
import { ambilDaftarLaporanMasalahAdmin, ambilRingkasanAdmin } from "@/lib/api/admin";
import { formatTanggalJam } from "@/lib/format";
import { LABEL_KATEGORI_MASALAH } from "@/lib/sesi";
import { TombolStatusMasalah } from "@/components/admin/aksi-kelola";
import { FilterAntrean, RingkasanAntreanPills } from "@/components/admin/filter-antrean";
import { Kartu, Lencana, StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Laporan masalah" };

const STATUS_VALID = ["baru", "ditinjau", "selesai", "semua"] as const;
type FilterStatus = (typeof STATUS_VALID)[number];

const OPSI_STATUS = [
  { nilai: "baru", label: "Baru" },
  { nilai: "ditinjau", label: "Ditinjau" },
  { nilai: "selesai", label: "Selesai" },
  { nilai: "semua", label: "Semua" },
];

const NADA_MASALAH: Record<StatusMasalah, "peringatan" | "info" | "sukses"> = {
  baru: "peringatan",
  ditinjau: "info",
  selesai: "sukses",
};

export default async function HalamanLaporanMasalahAdmin({
  searchParams,
}: PageProps<"/admin/laporan-masalah">) {
  const qp = await searchParams;
  const rawStatus = typeof qp.status === "string" ? qp.status : "baru";
  const rawUrutan = typeof qp.urutan === "string" ? qp.urutan : "terlama";
  const status: FilterStatus = (STATUS_VALID as readonly string[]).includes(rawStatus)
    ? (rawStatus as FilterStatus)
    : "baru";
  const urutan: UrutanAntrean = rawUrutan === "terbaru" ? "terbaru" : "terlama";

  const [ringkasan, daftar] = await Promise.all([
    ambilRingkasanAdmin(),
    ambilDaftarLaporanMasalahAdmin(status, urutan),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[46px]">
          Laporan masalah
        </h1>
        <p className="mt-2 text-text-muted">
          Kategori perilaku tidak pantas selalu diprioritaskan di urutan paling atas.
        </p>
      </div>

      <RingkasanAntreanPills ringkasan={ringkasan} />

      <FilterAntrean status={status} urutan={urutan} opsiStatus={OPSI_STATUS} />

      {daftar.length === 0 ? (
        <StateKosong
          judul="Tidak ada laporan masalah pada filter ini"
          keterangan="Laporan kendala dari siswa atau orang tua akan tampil di halaman ini."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {daftar.map(({ laporan, pelaporNama, pengajarNama }) => {
            const prioritasTinggi =
              laporan.kategori === "perilaku_tidak_pantas" || laporan.prioritas === "tinggi";
            return (
              <Kartu
                key={laporan.id}
                className={prioritasTinggi ? "flex flex-col gap-4 bg-danger-subtle/50" : "flex flex-col gap-4"}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {prioritasTinggi ? (
                      <Lencana nada="bahaya">
                        <ShieldAlert aria-hidden className="size-3.5" /> Prioritas tinggi
                      </Lencana>
                    ) : null}
                    <Lencana nada={NADA_MASALAH[laporan.status]}>{LABEL_STATUS_MASALAH[laporan.status]}</Lencana>
                    <span className="font-semibold text-ink">{LABEL_KATEGORI_MASALAH[laporan.kategori]}</span>
                  </div>
                  <span className="text-xs text-text-muted">{formatTanggalJam(laporan.dibuat_pada)}</span>
                </div>

                <p className="text-sm leading-6 text-ink">{laporan.deskripsi}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-3">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted">
                    <span>
                      Pelapor: <strong className="text-ink">{pelaporNama}</strong>
                    </span>
                    <span>
                      Pengajar terkait: <strong className="text-ink">{pengajarNama}</strong>
                    </span>
                  </div>
                  <TombolStatusMasalah id={laporan.id} statusSaatIni={laporan.status} />
                </div>
              </Kartu>
            );
          })}
        </div>
      )}
    </div>
  );
}
