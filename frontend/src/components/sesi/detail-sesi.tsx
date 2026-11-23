import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, GraduationCap, Star } from "lucide-react";
import type { DetailSesiPengguna } from "@/lib/api/sesi";
import { formatTanggal, formatTanggalJam } from "@/lib/format";
import { rentangJamWib } from "@/lib/mengajar";
import { apakahLaporanBaru } from "@/lib/sesi";
import { LencanaStatus } from "@/components/booking/status-booking";
import { TagProgram } from "@/components/kategori";
import { Lencana } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { FormLaporMasalah, FormRating, TombolMasukSesiPengguna } from "./interaksi-sesi";

/** Tampilan halaman sesi untuk orang tua dan siswa (PRD F8, F10, F12, Figma 9). */
export function DetailSesi({ data, basePath }: { data: DetailSesiPengguna; basePath: "/orang-tua" | "/siswa" }) {
  const { sesi, kelas, peserta, bisaMasuk } = data;
  const sekarang = new Date();
  const pertama = peserta[0];
  const namaSiswaGabung = peserta.map((p) => p.siswa.nama.split(" ")[0]).join(", ");
  const adaAnakSd = peserta.some((p) => p.siswa.jenjang === "SD");
  const adaLaporan = peserta.some((p) => Boolean(p.laporan));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={basePath}
        className="inline-flex min-h-touch items-center gap-2 self-start font-display font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden className="size-5" /> Kembali ke ringkasan
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <TagProgram slug={kelas.program_slug}>{kelas.program_nama}</TagProgram>
          <h1 className="mt-1 text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[48px]">
            {kelas.program_nama} Level {kelas.level} · Sesi {sesi.nomor}
          </h1>
          <p className="text-text-muted">
            {formatTanggal(sesi.mulai_pada)}, {rentangJamWib(sesi.mulai_pada, sesi.selesai_pada)} · {namaSiswaGabung} ·{" "}
            {kelas.pengajar_nama}
          </p>
        </div>
        {pertama ? <LencanaStatus status={pertama.booking.status} /> : null}
      </div>

      {!adaLaporan ? (
        <>
          <section
            aria-labelledby="judul-masuk-kelas"
            className="flex flex-col gap-5 rounded-card bg-primary p-6 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-8"
          >
            <div className="flex flex-col gap-2">
              <p id="judul-masuk-kelas" className="flex items-center gap-2 font-bold">
                <span aria-hidden className="size-2.5 rounded-full bg-accent" />
                {bisaMasuk ? "Kelas sedang berlangsung" : "Kelas dibuka 15 menit sebelum jadwal"}
              </p>
              <p className="text-lg">
                Masuk lewat Google Meet. Pakai akun yang sama dengan yang terdaftar.
              </p>
            </div>
            <TombolMasukSesiPengguna sesiId={sesi.id} aktif={bisaMasuk} className="shrink-0" />
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section aria-labelledby="judul-sebelum" className="rounded-card bg-surface p-6">
              <h2 id="judul-sebelum" className="text-xl font-semibold">
                Sebelum masuk
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                <li className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
                  <span>Siapkan laptop atau tablet dengan Chrome atau Edge terbaru</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
                  <span>Pastikan kamera dan mikrofon berfungsi</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
                  <span>
                    {adaAnakSd ? "Dampingi anak SD selama kelas" : "Siapkan pertanyaan atau catatan materi sebelumnya"}
                  </span>
                </li>
              </ul>
            </section>

            <section aria-labelledby="judul-setelah" className="rounded-card bg-surface p-6">
              <h2 id="judul-setelah" className="text-xl font-semibold">
                Setelah kelas
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                <li className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
                  <span>Laporan dari pengajar muncul di halaman ini</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
                  <span>Anda bisa memberi rating setelah laporan masuk</span>
                </li>
              </ul>
            </section>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          {peserta.map((item) => {
            const lap = item.laporan;
            const baru = lap ? apakahLaporanBaru(lap.dikirim_pada, sekarang) : false;
            return (
              <div key={item.siswa.id} className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
                {lap ? (
                  <section
                    aria-labelledby={`judul-laporan-${item.siswa.id}`}
                    className="flex flex-col gap-4 rounded-card border-2 border-primary bg-surface p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 id={`judul-laporan-${item.siswa.id}`} className="text-xl font-semibold">
                          Sesi {sesi.nomor} · {kelas.program_nama} Level {kelas.level}
                        </h2>
                        <p className="text-sm text-text-muted">
                          {formatTanggalJam(lap.dikirim_pada)} · {kelas.pengajar_nama}
                        </p>
                      </div>
                      {baru ? <Lencana nada="aksen">Baru</Lencana> : null}
                    </div>

                    <div>
                      <p className="font-bold text-text-muted">Ringkasan materi</p>
                      <p className="mt-1">{lap.ringkasan}</p>
                    </div>

                    <div>
                      <p className="font-bold text-text-muted">Kehadiran</p>
                      <p className="mt-1">{lap.hadir ? "Hadir" : "Tidak hadir"}</p>
                    </div>

                    {lap.catatan ? (
                      <div>
                        <p className="font-bold text-text-muted">Catatan untuk {item.siswa.nama.split(" ")[0]}</p>
                        <p className="mt-1">{lap.catatan}</p>
                      </div>
                    ) : null}

                    {lap.karya_url || item.raporId ? (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {lap.karya_url ? (
                          <a
                            href={lap.karya_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-touch items-center gap-2 rounded-full border-[1.5px] border-border-strong bg-surface px-5 font-display font-semibold hover:bg-surface-sunken"
                          >
                            <ExternalLink aria-hidden className="size-4" /> Lihat hasil karya
                          </a>
                        ) : null}
                        {item.raporId ? (
                          <TombolTautan href={`${basePath}/rapor/${item.raporId}`}>
                            <GraduationCap aria-hidden className="size-5" /> Lihat rapor jurusan
                          </TombolTautan>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : (
                  <div className="rounded-card bg-surface p-6 text-text-muted">
                    Laporan untuk {item.siswa.nama} belum tersedia.
                  </div>
                )}

                {item.rating ? (
                  <section aria-labelledby={`judul-rating-${item.siswa.id}`} className="rounded-card bg-surface p-6">
                    <h2 id={`judul-rating-${item.siswa.id}`} className="text-xl font-semibold">
                      Rating Anda untuk {item.siswa.nama.split(" ")[0]}
                    </h2>
                    <div className="mt-3 flex items-center gap-1" aria-label={`${item.rating.bintang} dari 5 bintang`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          aria-hidden
                          className={
                            n <= item.rating!.bintang ? "size-6 fill-primary text-primary" : "size-6 text-border-strong"
                          }
                        />
                      ))}
                      <span className="ml-2 font-bold">{item.rating.bintang}/5</span>
                    </div>
                    {item.rating.komentar ? <p className="mt-3">{item.rating.komentar}</p> : null}
                    <p className="mt-2 text-sm text-text-muted">Terima kasih sudah menilai sesi ini.</p>
                  </section>
                ) : lap ? (
                  <FormRating sesiId={sesi.id} siswaId={item.siswa.id} />
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <FormLaporMasalah sesiId={sesi.id} pengajarId={kelas.pengajar_id} namaPengajar={kelas.pengajar_nama} />
    </div>
  );
}
