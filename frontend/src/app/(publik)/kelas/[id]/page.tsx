import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarDays, Check } from "lucide-react";
import { ambilKelas } from "@/lib/api/kelas";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilPengajarPublik } from "@/lib/api/pengajar";
import { ambilProgram } from "@/lib/api/program";
import { alasanTidakBisaDipesan, jadwalSesi } from "@/lib/kelas";
import { formatJamTeks, formatRupiah, formatTanggal, namaHari } from "@/lib/format";
import { cx } from "@/lib/cx";
import { Kartu, Kerangka, Kontainer, StatusMemuat } from "@/components/ui/dasar";
import { TombolTautan, kelasTombol } from "@/components/ui/tombol";
import { TagProgram, labelJenjang, warnaProgram } from "@/components/kategori";
import { SisaKursi, judulKelas } from "@/components/kelas/kartu-kelas";
import { KartuPengajar } from "@/components/pengajar/kartu-pengajar";

export default function HalamanDetailKelas({ params }: PageProps<"/kelas/[id]">) {
  return (
    <Kontainer className="py-8 md:py-12">
      <Link href="/kelas" className="inline-flex min-h-touch items-center gap-2 font-display font-semibold text-primary hover:underline">
        <ArrowLeft aria-hidden className="size-5" /> Kembali ke katalog
      </Link>
      <Suspense
        fallback={
          <div className="mt-4 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <StatusMemuat label="Memuat detail kelas…" />
            <Kerangka className="h-72" />
            <Kerangka className="h-72" />
          </div>
        }
      >
        <Isi params={params} />
      </Suspense>
    </Kontainer>
  );
}

function jamSelesai(jamMulai: string, durasi: number) {
  const [h, m] = jamMulai.split(":").map(Number);
  const total = h * 60 + m + durasi;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}.${String(total % 60).padStart(2, "0")}`;
}

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const k = await ambilKelas(id);
  if (!k) notFound();
  const [pengajar, program] = await Promise.all([ambilPengajarPublik(k.pengajar_id), ambilProgram(k.program_slug)]);
  const alasan = alasanTidakBisaDipesan(k);
  const pengguna = await ambilPenggunaSaya();
  const pemesan: "tamu" | "orang_tua" | "siswa" | "lain" = !pengguna
    ? "tamu"
    : pengguna.peran === "orang_tua" || pengguna.peran === "siswa"
      ? pengguna.peran
      : "lain";
  const sesi = jadwalSesi(k.mulai_pada, k.jumlah_sesi);

  return (
    <div className="mt-4 grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        <section className={cx("rounded-card bg-gradient-to-br p-6 text-on-block md:p-10", warnaProgram(k.program_slug).blok)}>
          <TagProgram slug={k.program_slug}>
            {k.program_nama} · {labelJenjang(k.jenjang)}
          </TagProgram>
          <h1 className="mt-4 text-[28px] leading-[36px] font-extrabold tracking-tight sm:text-[36px] sm:leading-[46px] md:text-[42px] md:leading-[52px]">
            {judulKelas(k)}
          </h1>
          {program ? <p className="mt-4 max-w-2xl text-base leading-7 md:text-lg">{program.deskripsi}</p> : null}
        </section>

        <Kartu>
          <h2 className="text-2xl font-bold">Jadwal {k.jumlah_sesi} sesi</h2>
          <p className="mt-1 text-text-muted">
            Setiap {namaHari(k.hari_mingguan)}, {formatJamTeks(k.jam_mulai)}–{jamSelesai(k.jam_mulai, k.durasi_menit)} WIB, lewat
            Google Meet. Link kelas muncul di dashboard 15 menit sebelum mulai.
          </p>
          <ol className="mt-4 flex flex-col gap-3">
            {sesi.map((s, i) => (
              <li key={s} className="flex items-center gap-4">
                <CalendarDays aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="w-16 font-bold">Sesi {i + 1}</span>
                <span>{formatTanggal(s)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-text-muted">Tanggal sesi 2–4 bisa digeser pengajar. Perubahan akan diberitahukan.</p>
        </Kartu>

        <section aria-labelledby="judul-pengajar-kelas">
          <h2 id="judul-pengajar-kelas" className="text-2xl font-bold">
            Pengajar
          </h2>
          <div className="mt-4 max-w-sm">
            {pengajar ? (
              <KartuPengajar p={pengajar} />
            ) : (
              <p className="rounded-card-sm bg-surface p-6">{k.pengajar_nama}</p>
            )}
          </div>
        </section>
      </div>

      <aside aria-label="Harga dan pemesanan" className="lg:sticky lg:top-24">
        <Kartu className="flex flex-col gap-4">
          <div>
            <p className="font-display text-[28px] font-semibold leading-8">{formatRupiah(k.harga_paket)}</p>
            <p className="text-sm text-text-muted">per paket {k.jumlah_sesi} sesi</p>
          </div>
          <SisaKursi k={k} />
          {alasan ? (
            <p className={kelasTombol("utama", "lg", "w-full")} aria-disabled="true">
              {alasan}
            </p>
          ) : pemesan === "lain" ? (
            <>
              <p className={kelasTombol("utama", "lg", "w-full")} aria-disabled="true">
                Pesan kelas
              </p>
              <p className="text-sm text-text-muted">Pemesanan hanya untuk akun orang tua dan siswa.</p>
            </>
          ) : (
            <TombolTautan
              href={
                pemesan === "tamu"
                  ? `/masuk?lanjut=/kelas/${k.id}`
                  : `${pemesan === "orang_tua" ? "/orang-tua" : "/siswa"}/booking/baru?kelas=${k.id}`
              }
              ukuran="lg"
              className="w-full"
            >
              Pesan kelas
            </TombolTautan>
          )}
          <ul className="flex flex-col gap-2 text-sm">
            <li className="flex gap-2">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> Kursi ditahan 24 jam setelah Anda memesan.
            </li>
            <li className="flex gap-2">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> Bayar lewat transfer bank atau QRIS, lalu unggah
              bukti bayar.
            </li>
          </ul>
        </Kartu>
      </aside>
    </div>
  );
}
