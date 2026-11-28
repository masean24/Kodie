import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, FileText, GraduationCap } from "lucide-react";
import type { HasilMinat } from "@/types/database";
import type { ItemLaporanDashboard, ItemSesiDashboard, RaporRinci } from "@/lib/api/sesi";
import { NAMA_BIDANG } from "@/lib/tes-minat";
import { formatTanggal, formatTanggalJam } from "@/lib/format";
import { rentangJamWib } from "@/lib/mengajar";
import { cx } from "@/lib/cx";
import { TagProgram } from "@/components/kategori";
import { Lencana } from "@/components/ui/dasar";
import { kelasTombol } from "@/components/ui/tombol";
import { ChipAnak } from "./chip-anak";

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

export function SesiTerdekat({
  judul = "Sesi terdekat",
  daftar = [],
  basePath = "/orang-tua",
}: {
  judul?: string;
  daftar?: ItemSesiDashboard[];
  basePath?: "/orang-tua" | "/siswa";
}) {
  return (
    <KartuBagian judul={judul} id="judul-sesi">
      {daftar.length === 0 ? (
        <Kosong ikon={CalendarDays}>
          Belum ada sesi terjadwal.{" "}
          <Link href="/kelas" className="font-bold text-primary underline-offset-4 hover:underline">
            Lihat katalog kelas
          </Link>
        </Kosong>
      ) : (
        <ul className="flex flex-col gap-3">
          {daftar.slice(0, 3).map((item) => (
            <li
              key={`${item.sesi.id}-${item.siswa.id}`}
              className="flex flex-col gap-3 rounded-card-sm bg-surface-sunken p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                {basePath === "/orang-tua" ? <ChipAnak id={item.siswa.id} nama={item.siswa.nama} className="mb-2" /> : null}
                <div className="flex flex-wrap items-center gap-2">
                  <TagProgram slug={item.kelas.program_slug}>{item.kelas.program_nama}</TagProgram>
                  {item.bisaMasuk ? <Lencana nada="aksen">Sedang berlangsung</Lencana> : null}
                </div>
                <p className="mt-2 font-display font-semibold">
                  {item.kelas.program_nama} Level {item.kelas.level} · Sesi {item.sesi.nomor}
                </p>
                <p className="text-sm text-text-muted">
                  {formatTanggal(item.sesi.mulai_pada)}, {rentangJamWib(item.sesi.mulai_pada, item.sesi.selesai_pada)}
                  {basePath === "/orang-tua" ? null : ` · ${item.siswa.nama.split(" ")[0]}`}
                </p>
              </div>
              <Link
                href={`${basePath}/sesi/${item.sesi.id}`}
                className={kelasTombol(item.bisaMasuk ? "utama" : "kedua", "md", "shrink-0")}
              >
                {item.bisaMasuk ? "Masuk kelas" : "Buka sesi"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </KartuBagian>
  );
}

export function LaporanTerbaru({
  daftar = [],
  basePath = "/orang-tua",
}: {
  daftar?: ItemLaporanDashboard[];
  basePath?: "/orang-tua" | "/siswa";
}) {
  return (
    <KartuBagian judul="Laporan terbaru" id="judul-laporan">
      {daftar.length === 0 ? (
        <Kosong ikon={FileText}>Laporan pengajar muncul di sini setelah sesi selesai.</Kosong>
      ) : (
        <ul className="flex flex-col gap-3">
          {daftar.slice(0, 4).map((item) => (
            <li key={`${item.laporan.id}-${item.siswa.id}`}>
              <Link
                href={`${basePath}/sesi/${item.sesi.id}`}
                className="block rounded-card-sm bg-surface-sunken p-4 transition-colors hover:bg-primary-subtle"
              >
                {basePath === "/orang-tua" ? <ChipAnak id={item.siswa.id} nama={item.siswa.nama} className="mb-2" /> : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display font-semibold">
                    {item.kelas.program_nama} · Sesi {item.sesi.nomor}
                    {basePath === "/orang-tua" ? null : ` (${item.siswa.nama.split(" ")[0]})`}
                  </p>
                  {item.baru ? <Lencana nada="aksen">Baru</Lencana> : null}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-text-muted">{item.laporan.ringkasan}</p>
                <p className="mt-1 text-sm text-text-muted">{formatTanggalJam(item.laporan.dikirim_pada)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </KartuBagian>
  );
}

export function RaporJurusan({
  daftar = [],
  basePath = "/orang-tua",
}: {
  daftar?: RaporRinci[];
  basePath?: "/orang-tua" | "/siswa";
}) {
  const terbaru = daftar[0];
  return (
    <section aria-labelledby="judul-rapor" className="rounded-card bg-primary-subtle p-6">
      <h2 id="judul-rapor" className="flex items-center gap-2 text-xl font-semibold">
        <GraduationCap aria-hidden className="size-5" /> Rapor jurusan
      </h2>
      {terbaru ? (
        <>
          {basePath === "/orang-tua" ? <ChipAnak id={terbaru.siswa.id} nama={terbaru.siswa.nama} className="mt-3" /> : null}
          <p className="mt-2 font-display text-lg font-bold text-primary">
            {NAMA_BIDANG[terbaru.rapor.bidang_rekomendasi]}
            {basePath === "/orang-tua" ? null : ` (${terbaru.siswa.nama.split(" ")[0]})`}
          </p>
          <p className="mt-1 text-sm text-text-muted">Hasil pengamatan Simulasi Jurusan IT tersedia.</p>
          <Link
            href={`${basePath}/rapor/${terbaru.rapor.id}`}
            className="mt-3 flex min-h-touch items-center font-display font-semibold text-primary underline-offset-4 hover:underline"
          >
            Buka rapor jurusan
          </Link>
        </>
      ) : (
        <p className="mt-2 text-text-muted">Tersedia setelah sesi ke-4 Simulasi Jurusan IT.</p>
      )}
    </section>
  );
}

export function HasilTesTerakhir({ hasil }: { hasil?: HasilMinat }) {
  return (
    <KartuBagian judul="Hasil tes minat terakhir" id="judul-hasil-tes" className="bg-primary-subtle">
      {hasil ? (
        <>
          <p className="text-sm text-text-muted">{formatTanggal(hasil.dibuat_pada)}</p>
          <p className="mt-2 font-display text-28 font-extrabold leading-8 text-primary">
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
