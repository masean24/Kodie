import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, FileText, GraduationCap } from "lucide-react";
import type { HasilMinat } from "@/types/database";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { formatTanggal } from "@/lib/format";
import { cx } from "@/lib/cx";

/** Sapaan sesuai jam WIB, untuk judul dashboard. */
export function sapaan(sekarang: Date): string {
  const jam = Number(
    new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(sekarang),
  );
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export function KartuBagian({
  judul,
  id,
  aksi,
  className,
  children,
}: {
  judul: string;
  id: string;
  aksi?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cx("rounded-card bg-surface p-6", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-xl font-semibold">
          {judul}
        </h2>
        {aksi}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Kosong({ ikon: Ikon, children }: { ikon: typeof CalendarDays; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-card-sm bg-surface-sunken p-4 text-text-muted">
      <Ikon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Sementara kosong: diisi dari view `sesi_saya` di Prompt 6. */
export function SesiTerdekat({ judul = "Sesi terdekat" }: { judul?: string }) {
  return (
    <KartuBagian judul={judul} id="judul-sesi">
      <Kosong ikon={CalendarDays}>
        Belum ada sesi terjadwal.{" "}
        <Link href="/kelas" className="font-bold text-primary underline-offset-4 hover:underline">
          Lihat katalog kelas
        </Link>
      </Kosong>
    </KartuBagian>
  );
}

/** Sementara kosong: diisi dari view `laporan_saya` di Prompt 6. */
export function LaporanTerbaru() {
  return (
    <KartuBagian judul="Laporan terbaru" id="judul-laporan">
      <Kosong ikon={FileText}>Laporan pengajar muncul di sini setelah sesi selesai.</Kosong>
    </KartuBagian>
  );
}

export function RaporJurusan() {
  return (
    <section aria-labelledby="judul-rapor" className="rounded-card bg-primary-subtle p-6">
      <h2 id="judul-rapor" className="flex items-center gap-2 text-xl font-semibold">
        <GraduationCap aria-hidden className="size-5" /> Rapor jurusan
      </h2>
      <p className="mt-2 text-text-muted">Tersedia setelah sesi ke-4 Simulasi Jurusan IT.</p>
    </section>
  );
}

export function HasilTesTerakhir({ hasil }: { hasil?: HasilMinat }) {
  return (
    <KartuBagian judul="Hasil tes minat terakhir" id="judul-hasil-tes" className="bg-primary-subtle">
      {hasil ? (
        <>
          <p className="text-sm text-text-muted">{formatTanggal(hasil.dibuat_pada)}</p>
          <p className="mt-2 font-display text-[28px] font-extrabold leading-8 text-primary">
            {NAMA_BIDANG[hasil.bidang_teratas]} {hasil.skor[hasil.bidang_teratas]}%
          </p>
          <p className="mt-2 text-sm text-text-muted">Hasil tes adalah saran, bukan keputusan.</p>
        </>
      ) : (
        <p className="text-text-muted">Belum ada hasil. 12 soal, sekitar 5 menit.</p>
      )}
      <Link href="/tes-minat" className="mt-3 flex min-h-touch items-center font-display font-semibold text-primary underline-offset-4 hover:underline">
        {hasil ? "Ulangi tes minat" : "Mulai tes minat"}
      </Link>
    </KartuBagian>
  );
}
