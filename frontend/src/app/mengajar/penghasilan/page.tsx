import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CheckCircle2, Clock } from "lucide-react";
import { ambilPenghasilanPengajar } from "@/lib/api/mengajar";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { TagProgram } from "@/components/kategori";
import { Catatan, Kartu, Lencana, StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Penghasilan" };

export default async function HalamanPenghasilan() {
  const { bulanIni, belumDibayar, daftar } = await ambilPenghasilanPengajar();

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">Penghasilan</h1>
        <p className="mt-2 text-text-muted">Ringkasan honor per sesi yang sudah Anda laporkan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Kartu className="bg-primary-subtle">
          <p className="text-sm font-bold text-primary">Total honor bulan berjalan</p>
          <p className="mt-2 font-display text-[32px] font-extrabold leading-[38px]">{formatRupiah(bulanIni)}</p>
        </Kartu>
        <Kartu>
          <p className="text-sm font-bold text-text-muted">Total belum dibayar</p>
          <p className="mt-2 font-display text-[32px] font-extrabold leading-[38px]">{formatRupiah(belumDibayar)}</p>
        </Kartu>
      </div>

      <Catatan nada="info" judul="Cara pencairan honor">
        <p>
          Honor otomatis tercatat segera setelah Anda mengirim laporan sesi. Sesi tanpa laporan tidak menghasilkan honor.
          Admin mentransfer honor ke rekening Anda di luar sistem lalu menandainya sebagai dibayar.
        </p>
      </Catatan>

      {daftar.length === 0 ? (
        <StateKosong
          judul="Belum ada honor tercatat"
          keterangan="Honor per sesi akan muncul di sini setelah Anda selesai mengajar dan mengirim laporan sesi."
        />
      ) : (
        <section aria-labelledby="judul-riwayat-honor" className="flex flex-col gap-4">
          <h2 id="judul-riwayat-honor" className="text-xl font-semibold">
            Riwayat honor per sesi ({daftar.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {daftar.map((item) => {
              const dibayar = item.honor.status === "dibayar";
              return (
                <li key={item.honor.id}>
                  <Kartu kecil className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TagProgram slug={item.programSlug}>{item.programNama}</TagProgram>
                        <Lencana nada={dibayar ? "sukses" : "peringatan"}>
                          {dibayar ? (
                            <CheckCircle2 aria-hidden className="size-3.5" />
                          ) : (
                            <Clock aria-hidden className="size-3.5" />
                          )}
                          {dibayar ? "Dibayar" : "Belum dibayar"}
                        </Lencana>
                      </div>
                      <Link
                        href={`/mengajar/kelas/${item.kelasId}`}
                        className="mt-1 font-display text-lg font-semibold hover:text-primary hover:underline"
                      >
                        {item.programNama} Level {item.level} · Sesi {item.nomorSesi}
                      </Link>
                      <p className="text-sm text-text-muted">
                        Sesi: {formatTanggal(item.mulaiPada)}
                        {dibayar && item.honor.dibayar_pada
                          ? ` · Dibayar ${formatTanggal(item.honor.dibayar_pada).split(", ")[1]}`
                          : ""}
                      </p>
                    </div>
                    <p className="flex items-center gap-2 font-display text-xl font-bold tabular-nums">
                      <Banknote aria-hidden className="size-5 text-primary" />
                      {formatRupiah(item.honor.jumlah)}
                    </p>
                  </Kartu>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
