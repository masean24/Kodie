"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BookOpen, CalendarDays, Check, Info, User } from "lucide-react";
import type { KelasKatalog } from "@/types/database";
import { aksiBuatBooking } from "@/lib/aksi/booking";
import { formatJamTeks, formatRupiah, formatTanggal, namaHari } from "@/lib/format";
import { inisialNama } from "@/lib/nama";
import { cx } from "@/lib/cx";
import { Tombol } from "@/components/ui/tombol";
import { TagProgram } from "@/components/kategori";
import { PesanFormulir } from "@/components/auth/bagian";
import { LangkahPesan } from "./langkah-pesan";

export type KandidatSiswa = { id: string; nama: string; jenjang: string; kelas: number; alasan: string | null };

type Props = {
  kelas: KelasKatalog;
  kandidat: KandidatSiswa[];
  /** Siswa memesan untuk dirinya sendiri: langkah pilih siswa dilewati. */
  untukDiriSendiri: boolean;
};

export function AlurPesan({ kelas, kandidat, untukDiriSendiri }: Props) {
  const cocok = kandidat.filter((k) => !k.alasan);
  const [siswaId, setSiswaId] = useState<string | null>(untukDiriSendiri || cocok.length === 1 ? (cocok[0]?.id ?? null) : null);
  const [langkah, setLangkah] = useState<1 | 2>(untukDiriSendiri ? 2 : 1);
  const [galat, setGalat] = useState<string>();
  const [galatPilih, setGalatPilih] = useState(false);
  const [menunggu, mulai] = useTransition();
  const judulRef = useRef<HTMLHeadingElement>(null);
  const pertama = useRef(true);

  useEffect(() => {
    if (!pertama.current) judulRef.current?.focus();
    pertama.current = false;
  }, [langkah]);

  const siswa = kandidat.find((k) => k.id === siswaId) ?? null;
  const judul = "text-[32px] leading-[38px] font-extrabold focus:outline-none md:text-[44px] md:leading-[50px]";

  if (langkah === 1) {
    return (
      <div className="flex flex-col gap-6">
        <LangkahPesan ke={1} />
        <h1 ref={judulRef} tabIndex={-1} className={judul}>
          Pesan untuk siapa?
        </h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!siswaId) setGalatPilih(true);
            else setLangkah(2);
          }}
        >
          <fieldset aria-describedby={galatPilih ? "galat-pilih" : undefined}>
            <legend className="sr-only">Pilih siswa</legend>
            <div className="flex flex-col gap-3">
              {kandidat.map((k) => {
                const aktif = siswaId === k.id;
                const nonaktif = Boolean(k.alasan);
                return (
                  <label
                    key={k.id}
                    className={cx(
                      "flex items-center gap-4 rounded-card-sm border-[1.5px] bg-surface p-4",
                      nonaktif ? "cursor-not-allowed opacity-70" : "cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                      aktif ? "border-primary bg-primary-subtle" : "border-transparent",
                      !nonaktif && !aktif && "hover:border-border-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="siswa"
                      value={k.id}
                      checked={aktif}
                      disabled={nonaktif}
                      onChange={() => {
                        setSiswaId(k.id);
                        setGalatPilih(false);
                      }}
                      className="size-5 shrink-0 accent-primary"
                    />
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-subtle text-sm font-display font-semibold text-primary">
                      {inisialNama(k.nama)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{k.nama}</span>
                      <span className="block text-sm text-text-muted">
                        {k.jenjang} kelas {k.kelas}
                        {k.alasan ? ` · Tidak cocok: ${k.alasan}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {galatPilih ? (
            <p id="galat-pilih" role="alert" className="font-bold text-danger">
              Pilih siswa dulu.
            </p>
          ) : null}
          {cocok.length === 0 ? (
            <p className="rounded-card-sm bg-warning-subtle p-4">
              Belum ada anak yang sesuai dengan jenjang dan kelas program ini. Tambahkan atau perbarui profil anak di menu Anak.
            </p>
          ) : null}
          <div>
            <Tombol type="submit" ukuran="lg" disabled={cocok.length === 0}>
              Lanjut
            </Tombol>
          </div>
        </form>
      </div>
    );
  }

  const pesan = () =>
    mulai(async () => {
      setGalat(undefined);
      if (!siswa) return;
      const hasil = await aksiBuatBooking(kelas.id, siswa.id);
      if (hasil?.galat) setGalat(hasil.galat);
    });

  return (
    <div className="flex flex-col gap-6">
      <LangkahPesan ke={2} />
      <h1 ref={judulRef} tabIndex={-1} className={judul}>
        Periksa pesanan Anda
      </h1>
      <section aria-label="Ringkasan pesanan" className="rounded-card bg-surface p-6">
        <dl className="flex flex-col gap-5">
          <div className="flex gap-3">
            <User aria-hidden className="mt-1 size-5 shrink-0 text-text-muted" />
            <div>
              <dt className="text-sm text-text-muted">Siswa</dt>
              <dd className="font-bold">{siswa?.nama}</dd>
              <dd className="text-sm text-text-muted">
                {siswa?.jenjang} kelas {siswa?.kelas}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <BookOpen aria-hidden className="mt-1 size-5 shrink-0 text-text-muted" />
            <div>
              <dt className="text-sm text-text-muted">Kelas</dt>
              <dd className="mt-1">
                <TagProgram slug={kelas.program_slug}>{kelas.program_nama}</TagProgram>
              </dd>
              <dd className="mt-1 font-bold">
                {kelas.program_nama} · Level {kelas.level}
              </dd>
              <dd className="text-sm text-text-muted">Pengajar: {kelas.pengajar_nama}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <CalendarDays aria-hidden className="mt-1 size-5 shrink-0 text-text-muted" />
            <div>
              <dt className="text-sm text-text-muted">Jadwal</dt>
              <dd className="font-bold">
                {kelas.jumlah_sesi} sesi, setiap {namaHari(kelas.hari_mingguan)}, {formatJamTeks(kelas.jam_mulai)} WIB
              </dd>
              <dd className="text-sm text-text-muted">Mulai {formatTanggal(kelas.mulai_pada)}</dd>
            </div>
          </div>
        </dl>
        <div className="mt-6 flex items-center justify-between rounded-card-sm bg-surface-sunken p-4">
          <span className="font-bold">Total</span>
          <span className="font-display text-2xl font-semibold">{formatRupiah(kelas.harga_paket)}</span>
        </div>
      </section>
      <div className="flex gap-3 rounded-card-sm bg-info-subtle p-5">
        <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-info" />
        <div>
          <p className="font-display font-semibold text-info">Kursi ditahan 24 jam</p>
          <p className="mt-1">
            Setelah Anda menekan Pesan kelas, bayar dan unggah bukti sebelum batas waktu. Kalau tidak, kursi dilepas untuk siswa lain.
          </p>
        </div>
      </div>
      <PesanFormulir galat={galat} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {untukDiriSendiri ? <span /> : (
          <Tombol varian="kedua" onClick={() => setLangkah(1)}>
            Kembali
          </Tombol>
        )}
        <Tombol ukuran="lg" onClick={pesan} disabled={menunggu || !siswa} aria-busy={menunggu}>
          {menunggu ? (
            "Memesan…"
          ) : (
            <>
              <Check aria-hidden className="size-5" /> Pesan kelas
            </>
          )}
        </Tombol>
      </div>
    </div>
  );
}
