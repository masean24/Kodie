"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import type { Bidang, HasilTesMinat } from "@/types/database";
import { NAMA_BIDANG, REKOMENDASI_UMUM, URUTAN_BIDANG } from "@/lib/tes-minat";
import { cx } from "@/lib/cx";
import { Catatan, Kerangka, StateKosong } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { ObjekBidang, TagBidang, WARNA_BATANG_BIDANG } from "@/components/kategori";
import { bacaHasil, hapusTes } from "./penyimpanan";

const kosong = () => () => {};

function useHasil(): HasilTesMinat | null | undefined {
  // undefined saat render server, null jika belum ada hasil di sessionStorage.
  const mentah = useSyncExternalStore(
    kosong,
    () => sessionStorage.getItem("kodie:tes-minat:hasil") ?? "",
    () => undefined,
  );
  if (mentah === undefined) return undefined;
  return mentah ? bacaHasil() : null;
}

export function HasilTes({ namaProgram }: { namaProgram: Record<string, string> }) {
  const hasil = useHasil();

  if (hasil === undefined) {
    return (
      <div className="flex flex-col gap-6" role="status" aria-label="Memuat hasil">
        <Kerangka className="h-72 rounded-card" />
        <Kerangka className="h-80 rounded-card" />
      </div>
    );
  }
  if (hasil === null) {
    return (
      <StateKosong
        judul="Belum ada hasil tes"
        keterangan="Kerjakan 12 soal tes minat dulu. Hasilnya langsung keluar dan tidak perlu akun."
        aksi={
          <TombolTautan href="/tes-minat" varian="utama">
            Mulai tes minat
          </TombolTautan>
        }
      />
    );
  }

  const teratas = hasil.bidang_teratas;
  const urut = [...URUTAN_BIDANG].sort((a, b) => hasil.skor[b] - hasil.skor[a] || URUTAN_BIDANG.indexOf(a) - URUTAN_BIDANG.indexOf(b));
  const nama = (slug: string) => namaProgram[slug] ?? slug;
  const programUtama = hasil.rekomendasi_program[0] ?? "simulasi-jurusan-it";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between gap-6 overflow-hidden rounded-card bg-gradient-to-br from-kelas-reguler-block-to to-kelas-reguler-block p-6 text-on-block md:p-12">
        <div>
          <TagBidang bidang={teratas} />
          <p className="mt-4 font-bold">Bidang IT yang paling cocok untukmu</p>
          <h1 className="mt-2 text-[28px] leading-[36px] font-extrabold tracking-tight sm:text-[36px] sm:leading-[46px] md:text-[44px] md:leading-[54px]">
            Paling cocok: {NAMA_BIDANG[teratas]}
          </h1>
        </div>
        <ObjekBidang bidang={teratas} ukuran={140} miring={6} className="hidden sm:block" />
      </section>

      <Catatan judul="Hasil ini saran, bukan keputusan">
        Kamu tetap bebas memilih kelas dan jurusan.{" "}
        {hasil.tersimpan ? "Hasil ini sudah tersimpan di profil siswa." : "Hasil tamu tidak tersimpan. Daftar dulu kalau ingin menyimpannya."}
      </Catatan>

      <section aria-labelledby="judul-skor" className="rounded-card bg-surface p-6 md:p-8">
        <h2 id="judul-skor" className="text-2xl font-bold">
          Skor per bidang
        </h2>
        <ul className="mt-6 flex flex-col gap-5">
          {urut.map((b: Bidang) => (
            <li key={b}>
              <div className="flex items-baseline justify-between">
                <span className={cx(b === teratas && "font-display text-lg font-semibold")}>{NAMA_BIDANG[b]}</span>
                <span className="font-bold">{hasil.skor[b]}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-subtle" aria-hidden>
                <div className={cx("h-full rounded-full", WARNA_BATANG_BIDANG[b])} style={{ width: `${hasil.skor[b]}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-text-muted">Persentase = skor bidang ÷ jumlah skor keempat bidang × 100, dibulatkan.</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="judul-jurusan" className="rounded-card bg-surface p-6">
          <h2 id="judul-jurusan" className="text-xl font-semibold">
            Jurusan kuliah yang bisa dipertimbangkan
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {hasil.rekomendasi_jurusan.map((j) => (
              <li key={j} className="flex gap-2">
                <Check aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
                {j}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="judul-saran-program" className="rounded-card bg-surface p-6">
          <h2 id="judul-saran-program" className="text-xl font-semibold">
            Program yang disarankan
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {hasil.rekomendasi_program.length > 0
              ? hasil.rekomendasi_program.map((slug, i) => (
                  <li key={slug} className="flex gap-2">
                    <Check aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
                    {i === 0 ? "" : "Setelah itu: "}
                    {nama(slug)}
                  </li>
                ))
              : REKOMENDASI_UMUM.map((r) => (
                  <li key={r.untuk} className="flex gap-2">
                    <Check aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
                    <span>
                      {r.untuk}: {r.program.map(nama).join(", lalu ")}
                    </span>
                  </li>
                ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {hasil.tersimpan ? null : (
          <TombolTautan href="/daftar" ukuran="lg">
            Daftar dan simpan hasil
          </TombolTautan>
        )}
        <Link href={`/kelas?program=${programUtama}`} className="flex min-h-touch items-center font-display font-semibold text-primary hover:underline">
          Lihat kelas {nama(programUtama)}
        </Link>
        <Link href="/tes-minat" onClick={hapusTes} className="flex min-h-touch items-center font-display font-semibold text-primary hover:underline">
          Ulangi tes
        </Link>
      </div>
    </div>
  );
}
