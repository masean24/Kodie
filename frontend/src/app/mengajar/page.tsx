import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BookOpen, CalendarDays, FileText, Plus, Wallet } from "lucide-react";
import { ambilRingkasanPengajar } from "@/lib/api/mengajar";
import { formatJam, formatRupiah, formatTanggal } from "@/lib/format";
import { rentangJamWib } from "@/lib/mengajar";
import { KartuBagian, sapaan } from "@/components/area/kartu-dashboard";
import { TagProgram } from "@/components/kategori";
import { TombolMasukKelas } from "@/components/mengajar/tombol-sesi";
import { Catatan, Lencana, StateKosong } from "@/components/ui/dasar";
import { kelasTombol, TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Dashboard pengajar" };

export default async function DashboardPengajar() {
  const data = await ambilRingkasanPengajar();
  const { pengguna: p, profil, pengingatLaporan, sesiBerikutnya, jumlahKelas, honorBulanIni, honorBelumDibayar } = data;
  const terverifikasi = p.status === "terverifikasi";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">
            {sapaan(new Date())}, {p.nama.split(" ")[0]}
          </h1>
          <p className="mt-2 text-text-muted">
            {terverifikasi ? "Jadwal mengajar dan laporan sesi Anda." : "Pantau status verifikasi akun pengajar Anda."}
          </p>
        </div>
        {terverifikasi ? (
          <TombolTautan href="/mengajar/kelas/baru">
            <Plus aria-hidden className="size-5" /> Buka kelas baru
          </TombolTautan>
        ) : null}
      </div>

      {p.status === "menunggu_verifikasi" ? (
        <Catatan nada="peringatan" judul="Akun Anda sedang diverifikasi admin">
          <p>
            Lengkapi foto profil, kartu identitas (KTP atau KTM), SKCK, dan program yang ingin diajar di halaman profil.
            Admin juga akan menjadwalkan wawancara. Setelah disetujui, Anda bisa membuka kelas.
          </p>
          <TombolTautan href="/mengajar/profil" varian="kedua" className="mt-3">
            Lengkapi profil & dokumen
          </TombolTautan>
        </Catatan>
      ) : null}

      {p.status === "ditolak" ? (
        <Catatan nada="peringatan" judul="Pendaftaran pengajar ditolak">
          <p>{profil?.alasan_penolakan ?? "Periksa kembali data dan dokumen di halaman profil."}</p>
          <TombolTautan href="/mengajar/profil" varian="kedua" className="mt-3">
            Perbarui profil
          </TombolTautan>
        </Catatan>
      ) : null}

      {p.status === "nonaktif" ? (
        <Catatan nada="peringatan" judul="Akun pengajar nonaktif">
          <p>{profil?.alasan_penolakan ?? "Hubungi admin Kodie untuk informasi lebih lanjut."}</p>
        </Catatan>
      ) : null}

      {pengingatLaporan.length > 0 ? (
        <div role="alert" className="flex flex-col gap-3 rounded-card-sm bg-warning-subtle p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="font-display font-semibold text-warning">Ada laporan sesi yang belum dikirim</p>
              <p className="mt-1 text-sm">
                Sesi di bawah sudah berakhir lebih dari 2 jam lalu. Segera kirim laporan supaya orang tua tahu perkembangan siswa
                dan honor Anda tercatat.
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-2 pl-8">
            {pengingatLaporan.map((item) => (
              <li key={item.sesi.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface p-3">
                <div>
                  <p className="font-bold">
                    {item.programNama} Level {item.level} · Sesi {item.sesi.nomor}
                  </p>
                  <p className="text-sm text-text-muted">
                    {formatTanggal(item.sesi.mulai_pada)}, {formatJam(item.sesi.mulai_pada)}
                  </p>
                </div>
                <TombolTautan href={`/mengajar/sesi/${item.sesi.id}/laporan`}>Isi laporan</TombolTautan>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <KartuBagian
          judul="Sesi aktif & mendatang"
          id="judul-sesi-pengajar"
          aksi={
            <Link href="/mengajar/kelas" className="font-display text-sm font-semibold text-primary hover:underline">
              Semua kelas
            </Link>
          }
        >
          {sesiBerikutnya.length === 0 ? (
            <StateKosong
              judul="Belum ada sesi terjadwal"
              keterangan={
                terverifikasi
                  ? "Buka kelas baru supaya siswa bisa mulai memesan jadwal Anda."
                  : "Setelah akun diverifikasi admin, Anda bisa membuka kelas dari menu Kelas."
              }
              aksi={
                terverifikasi ? (
                  <TombolTautan href="/mengajar/kelas/baru">Buka kelas baru</TombolTautan>
                ) : (
                  <TombolTautan href="/mengajar/profil" varian="kedua">
                    Cek profil
                  </TombolTautan>
                )
              }
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {sesiBerikutnya.map((item) => (
                <li key={item.sesi.id} className="rounded-card-sm bg-surface-sunken p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <TagProgram slug={item.programSlug}>{item.programNama}</TagProgram>
                    {item.bisaMasuk ? (
                      <Lencana nada="aksen">Sedang dibuka</Lencana>
                    ) : (
                      <Lencana nada="info">Sesi {item.sesi.nomor}</Lencana>
                    )}
                  </div>
                  <p className="mt-2 font-display text-lg font-semibold">
                    {item.programNama} Level {item.level} · Sesi {item.sesi.nomor}
                  </p>
                  <p className="text-sm text-text-muted">
                    {formatTanggal(item.sesi.mulai_pada)}, {rentangJamWib(item.sesi.mulai_pada, item.sesi.selesai_pada)} ·{" "}
                    {item.jumlahSiswa} siswa
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <TombolMasukKelas sesiId={item.sesi.id} aktif={item.bisaMasuk} />
                    <TombolTautan href={`/mengajar/sesi/${item.sesi.id}/playbook`} varian="kedua">
                      <BookOpen aria-hidden className="size-4" /> Playbook
                    </TombolTautan>
                    {item.bisaLaporan ? (
                      <TombolTautan href={`/mengajar/sesi/${item.sesi.id}/laporan`} varian="kedua">
                        <FileText aria-hidden className="size-4" /> {item.adaLaporan ? "Edit laporan" : "Isi laporan"}
                      </TombolTautan>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </KartuBagian>

        <div className="flex flex-col gap-6">
          <KartuBagian judul="Ringkasan penghasilan" id="judul-honor-ringkas" className="bg-primary-subtle">
            <p className="text-sm text-text-muted">Honor bulan ini</p>
            <p className="mt-1 font-display text-[28px] font-extrabold leading-8 text-primary">
              {formatRupiah(honorBulanIni)}
            </p>
            <p className="mt-3 text-sm text-text-muted">Belum dibayar: {formatRupiah(honorBelumDibayar)}</p>
            <Link
              href="/mengajar/penghasilan"
              className="mt-3 flex min-h-touch items-center gap-2 font-display font-semibold text-primary underline-offset-4 hover:underline"
            >
              <Wallet aria-hidden className="size-4" /> Lihat rincian honor
            </Link>
          </KartuBagian>

          <KartuBagian judul="Kelas Anda" id="judul-kelas-ringkas">
            <p className="flex items-center gap-2 text-text-muted">
              <CalendarDays aria-hidden className="size-5 text-primary" />
              <span>{jumlahKelas} kelas tercatat</span>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/mengajar/kelas" className={kelasTombol("kedua", "md", "w-full")}>
                Kelola kelas
              </Link>
              <Link
                href="/mengajar/profil"
                className="flex min-h-touch items-center justify-center font-display font-semibold text-primary underline-offset-4 hover:underline"
              >
                Profil & dokumen verifikasi
              </Link>
            </div>
          </KartuBagian>
        </div>
      </div>
    </div>
  );
}
