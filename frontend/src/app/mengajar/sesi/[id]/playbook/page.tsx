import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ambilHalamanPlaybook } from "@/lib/api/mengajar";
import { formatTanggal, formatTanggalJam } from "@/lib/format";
import { rentangJamWib } from "@/lib/mengajar";
import { TagProgram } from "@/components/kategori";
import { TampilanPlaybook } from "@/components/mengajar/tampilan-playbook";
import { TombolCetak, TombolMasukKelas } from "@/components/mengajar/tombol-sesi";
import { Catatan, StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Teaching Playbook" };

export default async function HalamanPlaybook({ params }: PageProps<"/mengajar/sesi/[id]/playbook">) {
  const { id } = await params;
  const data = await ambilHalamanPlaybook(id);
  if (!data) notFound();

  const { sesi, kelas, program, jumlahSiswa, terbuka, bisaMasuk, playbook } = data;
  const waktuBuka = new Date(new Date(sesi.mulai_pada).getTime() - 24 * 3_600_000);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/mengajar/kelas/${kelas.id}`}
        className="tanpa-cetak inline-flex min-h-touch items-center gap-2 self-start font-display font-semibold text-primary hover:underline"
      >
        <ArrowLeft data-kembali aria-hidden className="size-5" /> Kembali ke kelas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <p className="font-bold text-primary">Teaching Playbook</p>
          <TagProgram slug={program.slug}>{program.nama}</TagProgram>
          <h1 className="mt-1 text-32 leading-[38px] font-extrabold md:text-40 md:leading-[48px]">
            {program.nama} Level {kelas.level} · Sesi {sesi.nomor}
          </h1>
          <p className="text-text-muted">
            {formatTanggal(sesi.mulai_pada)}, {rentangJamWib(sesi.mulai_pada, sesi.selesai_pada)} · {jumlahSiswa} siswa
          </p>
        </div>
        <div className="tanpa-cetak flex flex-wrap gap-3">
          <TombolMasukKelas sesiId={sesi.id} aktif={bisaMasuk} />
          {terbuka && playbook ? <TombolCetak /> : null}
        </div>
      </div>

      {!terbuka ? (
        <Catatan nada="info" judul="Playbook belum dibuka">
          <p>
            Teaching Playbook tersedia mulai H-1 (24 jam sebelum sesi dimulai), yaitu pada{" "}
            <span className="font-bold">{formatTanggalJam(waktuBuka)}</span>.
          </p>
        </Catatan>
      ) : !playbook ? (
        <StateKosong
          judul="Playbook sesi ini belum tersedia"
          keterangan="Panduan untuk kombinasi program, level, dan nomor sesi ini belum ditambahkan oleh admin."
        />
      ) : (
        <TampilanPlaybook playbook={playbook} durasiMenit={program.durasi_menit} />
      )}
    </div>
  );
}
