import type { Metadata } from "next";
import type { UrutanAntrean } from "@/lib/admin";
import { ambilDaftarHonorAdmin } from "@/lib/api/admin";
import { formatRupiah, formatTanggalJam } from "@/lib/format";
import { TombolBayarHonor } from "@/components/admin/aksi-kelola";
import { FilterAntrean } from "@/components/admin/filter-antrean";
import { TagProgram } from "@/components/kategori";
import { Kartu, Lencana, StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Honor pengajar" };

const STATUS_VALID = ["belum_dibayar", "dibayar", "semua"] as const;
type FilterStatus = (typeof STATUS_VALID)[number];

const OPSI_STATUS = [
  { nilai: "belum_dibayar", label: "Belum dibayar" },
  { nilai: "dibayar", label: "Sudah dibayar" },
  { nilai: "semua", label: "Semua" },
];

export default async function HalamanHonorAdmin({ searchParams }: PageProps<"/admin/honor">) {
  const qp = await searchParams;
  const rawStatus = typeof qp.status === "string" ? qp.status : "belum_dibayar";
  const rawUrutan = typeof qp.urutan === "string" ? qp.urutan : "terlama";
  const status: FilterStatus = (STATUS_VALID as readonly string[]).includes(rawStatus)
    ? (rawStatus as FilterStatus)
    : "belum_dibayar";
  const urutan: UrutanAntrean = rawUrutan === "terbaru" ? "terbaru" : "terlama";

  const daftar = await ambilDaftarHonorAdmin(status, urutan);
  const totalNominal = daftar.reduce((sum, x) => sum + x.honor.jumlah, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[46px]">
          Honor pengajar
        </h1>
        <p className="mt-2 text-text-muted">
          Daftar honor otomatis dari laporan sesi pengajar. Tandai sudah dibayar setelah transfer dilakukan.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterAntrean status={status} urutan={urutan} opsiStatus={OPSI_STATUS} />
        <div className="rounded-md bg-surface px-4 py-3 text-sm">
          <span className="text-text-muted">Total daftar ini ({daftar.length} sesi): </span>
          <strong className="font-display text-lg font-bold tabular-nums">{formatRupiah(totalNominal)}</strong>
        </div>
      </div>

      {daftar.length === 0 ? (
        <StateKosong
          judul="Tidak ada catatan honor pada filter ini"
          keterangan="Honor dibuat otomatis ketika pengajar mengirim laporan sesi."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-card bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Pengajar</th>
                  <th className="px-5 py-3.5 font-semibold">Program & sesi</th>
                  <th className="px-5 py-3.5 font-semibold">Nominal</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {daftar.map((item) => {
                  const dibayar = item.honor.status === "dibayar";
                  return (
                    <tr key={item.honor.id} className="align-middle hover:bg-surface-sunken/50">
                      <td className="px-5 py-4 font-semibold text-ink">{item.pengajarNama}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <TagProgram slug={item.programSlug}>{item.programNama}</TagProgram>
                          <span className="text-xs text-text-muted">
                            {item.nomorSesi ? `Sesi ${item.nomorSesi}` : "Sesi"}{" "}
                            {item.mulaiPada ? `· ${formatTanggalJam(item.mulaiPada)}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-display font-bold tabular-nums">
                        {formatRupiah(item.honor.jumlah)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <Lencana nada={dibayar ? "sukses" : "peringatan"}>
                            {dibayar ? "Dibayar" : "Belum dibayar"}
                          </Lencana>
                          {dibayar && item.honor.dibayar_pada ? (
                            <span className="text-xs text-text-muted">{formatTanggalJam(item.honor.dibayar_pada)}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <TombolBayarHonor id={item.honor.id} dibayar={dibayar} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {daftar.map((item) => {
              const dibayar = item.honor.status === "dibayar";
              return (
                <Kartu key={item.honor.id} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{item.pengajarNama}</span>
                    <Lencana nada={dibayar ? "sukses" : "peringatan"}>
                      {dibayar ? "Dibayar" : "Belum dibayar"}
                    </Lencana>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TagProgram slug={item.programSlug}>{item.programNama}</TagProgram>
                    <span className="text-xs text-text-muted">
                      {item.nomorSesi ? `Sesi ${item.nomorSesi}` : "Sesi"}
                    </span>
                  </div>
                  {item.mulaiPada ? (
                    <p className="text-xs text-text-muted">{formatTanggalJam(item.mulaiPada)}</p>
                  ) : null}
                  <p className="font-display text-lg font-bold tabular-nums">{formatRupiah(item.honor.jumlah)}</p>
                  {dibayar && item.honor.dibayar_pada ? (
                    <p className="text-xs text-text-muted">Dibayar pada {formatTanggalJam(item.honor.dibayar_pada)}</p>
                  ) : null}
                  <TombolBayarHonor id={item.honor.id} dibayar={dibayar} />
                </Kartu>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
