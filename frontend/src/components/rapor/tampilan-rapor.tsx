import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import type { RaporRinci } from "@/lib/api/sesi";
import { formatTanggal } from "@/lib/format";
import { SKOR_BIDANG_URUT } from "@/lib/mengajar";
import { skorPengajarKePersen } from "@/lib/sesi";
import { JURUSAN_PER_BIDANG, NAMA_BIDANG } from "@/lib/tes-minat";
import { TagBidang, TagProgram } from "@/components/kategori";
import { TombolCetak } from "@/components/mengajar/tombol-sesi";
import { Catatan, Kartu, StateKosong } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

/** Daftar rapor rekomendasi jurusan untuk orang tua & siswa (PRD F11). */
export function DaftarRapor({ daftar, basePath }: { daftar: RaporRinci[]; basePath: "/orang-tua" | "/siswa" }) {
  return (
    <div className="flex max-w-[864px] flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">
          Rapor rekomendasi jurusan
        </h1>
        <p className="mt-2 text-text-muted">
          Rapor diterbitkan setelah menyelesaikan sesi ke-4 program Simulasi Jurusan IT.
        </p>
      </div>

      {daftar.length === 0 ? (
        <StateKosong
          judul="Belum ada rapor jurusan"
          keterangan="Rapor muncul di sini setelah siswa menyelesaikan 4 sesi Simulasi Jurusan IT."
          aksi={
            <TombolTautan href="/kelas?program=simulasi-jurusan-it" varian="kedua">
              Lihat kelas Simulasi Jurusan IT
            </TombolTautan>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {daftar.map((item) => (
            <li key={item.rapor.id}>
              <Kartu className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <TagProgram slug="simulasi-jurusan-it">Simulasi Jurusan IT</TagProgram>
                    <TagBidang bidang={item.rapor.bidang_rekomendasi} />
                  </div>
                  <h2 className="mt-1 text-xl font-semibold">{item.siswa.nama}</h2>
                  <p className="text-sm text-text-muted">
                    {item.siswa.jenjang} kelas {item.siswa.kelas} · Diterbitkan {formatTanggal(item.rapor.dibuat_pada)}
                    {item.kelas ? ` · ${item.kelas.pengajar_nama}` : ""}
                  </p>
                </div>
                <TombolTautan href={`${basePath}/rapor/${item.rapor.id}`} className="shrink-0">
                  Buka rapor
                </TombolTautan>
              </Kartu>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Detail rapor rekomendasi jurusan berdampingan dengan hasil tes minat (PRD F11, print CSS). */
export function DetailRapor({ item, basePath }: { item: RaporRinci; basePath: "/orang-tua" | "/siswa" }) {
  const { rapor, siswa, kelas, sesi, hasilMinat } = item;
  const minatSkor = rapor.tes_minat_skor ?? rapor.minat_skor ?? hasilMinat?.skor ?? null;
  const jurusanSaran = JURUSAN_PER_BIDANG[rapor.bidang_rekomendasi];

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <Link
        href={`${basePath}/rapor`}
        className="tanpa-cetak inline-flex min-h-touch items-center gap-2 self-start font-display font-semibold text-primary hover:underline"
      >
        <ArrowLeft data-kembali aria-hidden className="size-5" /> Semua rapor
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <TagProgram slug="simulasi-jurusan-it">Simulasi Jurusan IT</TagProgram>
          <h1 className="mt-1 text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[48px]">
            Rapor Rekomendasi Jurusan · {siswa.nama}
          </h1>
          <p className="text-text-muted">
            {siswa.jenjang} kelas {siswa.kelas}
            {sesi ? ` · Sesi 4 (${formatTanggal(sesi.mulai_pada)})` : ""}
            {kelas ? ` · Pengajar: ${kelas.pengajar_nama}` : ""}
          </p>
        </div>
        <TombolCetak className="tanpa-cetak" />
      </div>

      <section aria-labelledby="judul-rekomendasi" className="rounded-card bg-primary-subtle p-6">
        <p id="judul-rekomendasi" className="flex items-center gap-2 font-bold text-primary">
          <GraduationCap aria-hidden className="size-5" /> Bidang yang paling direkomendasikan pengajar
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="font-display text-3xl font-extrabold">{NAMA_BIDANG[rapor.bidang_rekomendasi]}</p>
          <TagBidang bidang={rapor.bidang_rekomendasi} />
        </div>
        <p className="mt-3 text-text-muted">
          Contoh jurusan kuliah yang relevan:{" "}
          <span className="font-bold text-text">{jurusanSaran.join(", ")}</span>
        </p>
      </section>

      <section aria-labelledby="judul-perbandingan" className="rounded-card bg-surface p-6">
        <h2 id="judul-perbandingan" className="text-xl font-semibold">
          Skor pengajar vs hasil tes minat terbaru
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Menilai kecenderungan berdasarkan praktik langsung selama 4 sesi dan kuis tes minat.
        </p>

        <div className="mt-5 flex flex-col gap-5">
          {SKOR_BIDANG_URUT.map(({ key, bidang }) => {
            const skorPengajar = rapor[key];
            const persenPengajar = skorPengajarKePersen(skorPengajar);
            const persenMinat = minatSkor ? minatSkor[bidang] : null;

            return (
              <div key={bidang} className="rounded-card-sm bg-surface-sunken p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold">{NAMA_BIDANG[bidang]}</p>
                  <TagBidang bidang={bidang} />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Pengamatan pengajar</span>
                      <span className="font-bold tabular-nums">{skorPengajar} / 5</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${persenPengajar}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Tes minat siswa</span>
                      <span className="font-bold tabular-nums">
                        {persenMinat !== null ? `${persenMinat}%` : "Belum tes"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-border-strong"
                        style={{ width: `${persenMinat ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Kartu>
          <h2 className="text-xl font-semibold">Alasan rekomendasi</h2>
          <p className="mt-3 whitespace-pre-line">{rapor.alasan}</p>
        </Kartu>
        <Kartu>
          <h2 className="text-xl font-semibold">Saran langkah berikutnya</h2>
          <p className="mt-3 whitespace-pre-line">{rapor.saran}</p>
        </Kartu>
      </div>

      <Catatan nada="info" judul="Catatan penting">
        <p>
          Rapor rekomendasi jurusan ini adalah saran berdasarkan pengamatan pengajar dan hasil tes minat, bukan keputusan
          mutlak. Diskusikan pilihan jurusan bersama orang tua dan guru sekolah.
        </p>
      </Catatan>
    </div>
  );
}
