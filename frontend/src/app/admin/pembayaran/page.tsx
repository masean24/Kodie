import type { Metadata } from "next";
import { formatLamaMenunggu, LABEL_STATUS_PEMBAYARAN, type UrutanAntrean } from "@/lib/admin";
import { ambilAntreanPembayaran, ambilRingkasanAdmin } from "@/lib/api/admin";
import { formatRupiah, formatTanggalJam } from "@/lib/format";
import { FilterAntrean, RingkasanAntreanPills } from "@/components/admin/filter-antrean";
import { TagProgram } from "@/components/kategori";
import { Kartu, Lencana, StateKosong } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Verifikasi pembayaran" };

const STATUS_VALID = ["menunggu", "disetujui", "ditolak", "semua"] as const;
type FilterStatus = (typeof STATUS_VALID)[number];

const OPSI_STATUS = [
  { nilai: "menunggu", label: "Menunggu verifikasi" },
  { nilai: "disetujui", label: "Disetujui" },
  { nilai: "ditolak", label: "Ditolak" },
  { nilai: "semua", label: "Semua" },
];

const NADA_PEMBAYARAN = {
  menunggu: "peringatan",
  disetujui: "sukses",
  ditolak: "bahaya",
} as const;

export default async function HalamanPembayaranAdmin({ searchParams }: PageProps<"/admin/pembayaran">) {
  const qp = await searchParams;
  const rawStatus = typeof qp.status === "string" ? qp.status : "menunggu";
  const rawUrutan = typeof qp.urutan === "string" ? qp.urutan : "terlama";
  const status: FilterStatus = (STATUS_VALID as readonly string[]).includes(rawStatus)
    ? (rawStatus as FilterStatus)
    : "menunggu";
  const urutan: UrutanAntrean = rawUrutan === "terbaru" ? "terbaru" : "terlama";

  const [ringkasan, daftar] = await Promise.all([
    ambilRingkasanAdmin(),
    ambilAntreanPembayaran(status, urutan),
  ]);
  const sekarang = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[46px]">
          Verifikasi pembayaran
        </h1>
        <p className="mt-2 text-text-muted">
          Periksa bukti transfer atau QRIS yang diunggah orang tua dan siswa.
        </p>
      </div>

      <RingkasanAntreanPills ringkasan={ringkasan} />

      <FilterAntrean status={status} urutan={urutan} opsiStatus={OPSI_STATUS} />

      {daftar.length === 0 ? (
        <StateKosong
          judul="Tidak ada pembayaran pada filter ini"
          keterangan="Antrean akan muncul otomatis saat orang tua atau siswa mengunggah bukti bayar."
        />
      ) : (
        <>
          {/* Tabel desktop (>= md) */}
          <div className="hidden overflow-hidden rounded-card bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Booking & siswa</th>
                  <th className="px-5 py-3.5 font-semibold">Program & kelas</th>
                  <th className="px-5 py-3.5 font-semibold">Nominal</th>
                  <th className="px-5 py-3.5 font-semibold">Status & waktu</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {daftar.map((item) => (
                  <tr key={item.pembayaran.id} className="align-middle hover:bg-surface-sunken/50">
                    <td className="px-5 py-4">
                      <p className="font-mono font-bold text-ink">{item.booking.kode}</p>
                      <p className="text-text-muted">
                        {item.siswa ? `${item.siswa.nama} (${item.siswa.jenjang} kelas ${item.siswa.kelas})` : "Siswa"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {item.kelas ? (
                        <div className="flex flex-col items-start gap-1">
                          <TagProgram slug={item.kelas.program_slug}>{item.kelas.program_nama}</TagProgram>
                          <span className="text-xs text-text-muted">
                            Level {item.kelas.level} · {item.kelas.pengajar_nama}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted">Kelas</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-display font-bold tabular-nums">
                      {formatRupiah(item.booking.total)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <Lencana nada={NADA_PEMBAYARAN[item.pembayaran.status]}>
                          {LABEL_STATUS_PEMBAYARAN[item.pembayaran.status]}
                        </Lencana>
                        <span className="text-xs text-text-muted">
                          {item.pembayaran.status === "menunggu"
                            ? formatLamaMenunggu(item.pembayaran.diunggah_pada, sekarang)
                            : formatTanggalJam(item.pembayaran.diunggah_pada)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <TombolTautan href={`/admin/pembayaran/${item.pembayaran.id}`} varian="kedua">
                        {item.pembayaran.status === "menunggu" ? "Periksa" : "Detail"}
                      </TombolTautan>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kartu mobile (< md) */}
          <div className="flex flex-col gap-4 md:hidden">
            {daftar.map((item) => (
              <Kartu key={item.pembayaran.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold">{item.booking.kode}</span>
                  <Lencana nada={NADA_PEMBAYARAN[item.pembayaran.status]}>
                    {LABEL_STATUS_PEMBAYARAN[item.pembayaran.status]}
                  </Lencana>
                </div>
                {item.kelas ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <TagProgram slug={item.kelas.program_slug}>{item.kelas.program_nama}</TagProgram>
                    <span className="text-xs text-text-muted">Level {item.kelas.level}</span>
                  </div>
                ) : null}
                <div className="text-sm">
                  <p className="font-semibold">
                    {item.siswa ? `${item.siswa.nama} (${item.siswa.jenjang} kelas ${item.siswa.kelas})` : "Siswa"}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold tabular-nums">
                    {formatRupiah(item.booking.total)}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {item.pembayaran.status === "menunggu"
                      ? formatLamaMenunggu(item.pembayaran.diunggah_pada, sekarang)
                      : `Diunggah ${formatTanggalJam(item.pembayaran.diunggah_pada)}`}
                  </p>
                </div>
                <TombolTautan href={`/admin/pembayaran/${item.pembayaran.id}`} varian="kedua" className="w-full">
                  {item.pembayaran.status === "menunggu" ? "Periksa bukti bayar" : "Lihat detail"}
                </TombolTautan>
              </Kartu>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
