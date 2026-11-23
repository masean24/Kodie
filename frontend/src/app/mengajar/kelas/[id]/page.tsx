import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, FileText, Users } from "lucide-react";
import { ambilDetailKelasPengajar } from "@/lib/api/mengajar";
import { formatTanggal } from "@/lib/format";
import {
  bisaGeserSesi,
  bisaIsiLaporan,
  bisaMasukKelas,
  LABEL_STATUS_SESI,
  laporanTerkunci,
  rentangJamWib,
} from "@/lib/mengajar";
import { TagProgram } from "@/components/kategori";
import { NADA_STATUS_SESI } from "@/components/mengajar/konstanta";
import { FormGeserSesi } from "@/components/mengajar/form-geser-sesi";
import { TombolMasukKelas } from "@/components/mengajar/tombol-sesi";
import { Kartu, Lencana } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Detail kelas" };

export default async function HalamanDetailKelasPengajar({ params }: PageProps<"/mengajar/kelas/[id]">) {
  const { id } = await params;
  const k = await ambilDetailKelasPengajar(id);
  if (!k) notFound();

  const sekarang = new Date();

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <Link
        href="/mengajar/kelas"
        className="inline-flex min-h-touch items-center gap-2 self-start font-display font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden className="size-5" /> Semua kelas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <TagProgram slug={k.program.slug}>{k.program.nama}</TagProgram>
          <h1 className="mt-2 text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">
            {k.program.nama} · Level {k.level}
          </h1>
          <p className="mt-1 text-text-muted">
            {k.siswa.length} dari {k.kapasitas} siswa terkonfirmasi · {k.program.durasi_menit} menit per sesi
          </p>
        </div>
      </div>

      <section aria-labelledby="judul-daftar-sesi" className="flex flex-col gap-4">
        <h2 id="judul-daftar-sesi" className="text-xl font-semibold">
          Jadwal {k.sesi.length} sesi
        </h2>
        <ul className="flex flex-col gap-4">
          {k.sesi.map((s) => {
            const laporan = k.laporanBySesi[s.id];
            const bisaMasuk = bisaMasukKelas(s.mulai_pada, s.selesai_pada, s.status, sekarang);
            const bisaGeser = bisaGeserSesi(s.mulai_pada, s.status, sekarang);
            const bisaLaporan = bisaIsiLaporan(s.mulai_pada, sekarang);
            const terkunci = laporan ? laporanTerkunci(laporan.dikirim_pada, sekarang) : false;

            return (
              <li key={s.id}>
                <Kartu className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">Sesi {s.nomor}</h3>
                        <Lencana nada={NADA_STATUS_SESI[s.status]}>{LABEL_STATUS_SESI[s.status]}</Lencana>
                        {laporan ? (
                          <Lencana nada="sukses">
                            <CheckCircle2 aria-hidden className="size-3.5" /> Laporan terkirim
                          </Lencana>
                        ) : null}
                      </div>
                      <p className="mt-1 flex items-center gap-2 text-text-muted">
                        <CalendarDays aria-hidden className="size-4 shrink-0" />
                        {formatTanggal(s.mulai_pada)}, {rentangJamWib(s.mulai_pada, s.selesai_pada)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2">
                    <TombolMasukKelas sesiId={s.id} aktif={bisaMasuk} />
                    <TombolTautan href={`/mengajar/sesi/${s.id}/playbook`} varian="kedua">
                      <BookOpen aria-hidden className="size-4" /> Playbook
                    </TombolTautan>
                    {bisaLaporan ? (
                      <TombolTautan href={`/mengajar/sesi/${s.id}/laporan`} varian="kedua">
                        <FileText aria-hidden className="size-4" />
                        {laporan ? (terkunci ? "Lihat laporan" : "Edit laporan") : "Isi laporan"}
                      </TombolTautan>
                    ) : null}
                    {bisaGeser ? <FormGeserSesi sesiId={s.id} mulaiPada={s.mulai_pada} /> : null}
                  </div>
                </Kartu>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="judul-peserta" className="rounded-card bg-surface p-6">
        <h2 id="judul-peserta" className="flex items-center gap-2 text-xl font-semibold">
          <Users aria-hidden className="size-5 text-primary" /> Siswa terkonfirmasi ({k.siswa.length})
        </h2>
        {k.siswa.length === 0 ? (
          <p className="mt-3 text-text-muted">Belum ada siswa dengan pembayaran terkonfirmasi di kelas ini.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {k.siswa.map((s) => (
              <li key={s.id} className="rounded-md bg-surface-sunken p-3">
                <p className="font-bold">{s.nama}</p>
                <p className="text-sm text-text-muted">
                  {s.jenjang} kelas {s.kelas}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
