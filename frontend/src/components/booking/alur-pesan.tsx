"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BookOpen, CalendarDays, Check, Gift, Info, Ticket, User } from "lucide-react";
import type { KelasKatalog } from "@/types/database";
import { aksiBuatBooking } from "@/lib/aksi/booking";
import { formatJamTeks, formatRupiah, formatTanggal, namaHari, labelKelas } from "@/lib/format";
import { inisialNama } from "@/lib/nama";
import { cx } from "@/lib/cx";
import { Tombol } from "@/components/ui/tombol";
import { TagProgram } from "@/components/kategori";
import { PesanFormulir } from "@/components/auth/bagian";
import { LangkahPesan } from "./langkah-pesan";
import { Input } from "@/components/ui/formulir";
import { bacaKodeReferral, hitungPotongan, kodeValid, normalisasiKode, PERSEN_POTONGAN_REFERRAL } from "@/lib/referral";

export type KandidatSiswa = {
  id: string;
  nama: string;
  jenjang: string;
  kelas: number;
  alasan: string | null;
  /** Sudah pernah memakai trial gratis (sekali per anak). */
  sudahTrial?: boolean;
};

type Props = {
  kelas: KelasKatalog;
  kandidat: KandidatSiswa[];
  /** Siswa memesan untuk dirinya sendiri: langkah pilih siswa dilewati. */
  untukDiriSendiri: boolean;
  /** Trial gratis & kode referral aktif (mode mock atau backend sudah siap). */
  fiturLanjutan?: boolean;
  /** Datang dari tombol trial beranda (`?trial=1`): pilihan "Trial gratis" terpilih sejak awal. */
  awalTrial?: boolean;
};

export function AlurPesan({ kelas, kandidat, untukDiriSendiri, fiturLanjutan = false, awalTrial = false }: Props) {
  const cocok = kandidat.filter((k) => !k.alasan);
  const [siswaId, setSiswaId] = useState<string | null>(untukDiriSendiri || cocok.length === 1 ? (cocok[0]?.id ?? null) : null);
  const [langkah, setLangkah] = useState<1 | 2>(untukDiriSendiri ? 2 : 1);
  const [galat, setGalat] = useState<string>();
  const [galatPilih, setGalatPilih] = useState(false);
  const [menunggu, mulai] = useTransition();
  const [jenis, setJenis] = useState<"paket" | "trial">(awalTrial && fiturLanjutan ? "trial" : "paket");
  const [kodeRef, setKodeRef] = useState("");
  const judulRef = useRef<HTMLHeadingElement>(null);

  // Kode dari tautan profil pengajar yang dibagikan (?ref=) diisi otomatis sekali saat halaman dibuka.
  useEffect(() => {
    if (!fiturLanjutan) return;
    const tersimpan = bacaKodeReferral(kelas.pengajar_id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hanya ada di browser, bukan saat render server
    if (tersimpan) setKodeRef(tersimpan);
  }, [fiturLanjutan, kelas.pengajar_id]);
  const pertama = useRef(true);

  useEffect(() => {
    if (!pertama.current) judulRef.current?.focus();
    pertama.current = false;
  }, [langkah]);

  const siswa = kandidat.find((k) => k.id === siswaId) ?? null;
  const judul = "text-32 leading-[38px] font-extrabold focus:outline-none md:text-48 md:leading-[50px]";

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
                        {labelKelas(k.jenjang, k.kelas)}
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

  // Trial gratis hanya Sesi 1, sekali per anak, dan hanya sebelum Sesi 1 dimulai (keputusan 2026-11-28).
  const trialBisa = fiturLanjutan && kelas.bisa_dibooking && !siswa?.sudahTrial;
  const jenisEfektif = jenis === "trial" && trialBisa ? "trial" : "paket";
  const kodeBersih = normalisasiKode(kodeRef);
  const kodeTerisi = jenisEfektif === "paket" && kodeBersih.length > 0;
  const formatKodeSalah = kodeTerisi && !kodeValid(kodeBersih);
  const potongan = kodeTerisi && !formatKodeSalah ? hitungPotongan(kelas.harga_paket) : 0;
  const total = jenisEfektif === "trial" ? 0 : kelas.harga_paket - potongan;

  const pesan = () =>
    mulai(async () => {
      setGalat(undefined);
      if (!siswa) return;
      if (formatKodeSalah) {
        setGalat("Format kode referral tidak valid. Gunakan huruf, angka, dan tanda hubung.");
        return;
      }
      const hasil = await aksiBuatBooking(kelas.id, siswa.id, {
        jenis: jenisEfektif,
        kodeReferral: kodeTerisi ? kodeBersih : null,
      });
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
                {labelKelas(siswa?.jenjang, siswa?.kelas)}
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

        {fiturLanjutan ? (
          <fieldset className="mt-6 flex flex-col gap-3">
            <legend className="font-bold">Jenis pesanan</legend>
            <label
              className={cx(
                "flex cursor-pointer gap-3 rounded-card-sm border-[1.5px] p-4",
                jenisEfektif === "paket" ? "border-primary bg-primary-subtle" : "border-border-strong",
              )}
            >
              <input
                type="radio"
                name="jenis-pesanan"
                value="paket"
                checked={jenisEfektif === "paket"}
                onChange={() => setJenis("paket")}
                className="mt-1 size-5 accent-[var(--k-royal)]"
              />
              <span>
                <span className="block font-bold">Paket {kelas.jumlah_sesi} sesi · {formatRupiah(kelas.harga_paket)}</span>
                <span className="block text-sm text-text-muted">Semua sesi, laporan tiap sesi, dan karya akhir.</span>
              </span>
            </label>
            <label
              className={cx(
                "flex gap-3 rounded-card-sm border-[1.5px] p-4",
                !trialBisa ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                jenisEfektif === "trial" ? "border-primary bg-primary-subtle" : "border-border-strong",
              )}
            >
              <input
                type="radio"
                name="jenis-pesanan"
                value="trial"
                checked={jenisEfektif === "trial"}
                disabled={!trialBisa}
                onChange={() => setJenis("trial")}
                aria-describedby="ket-trial"
                className="mt-1 size-5 accent-[var(--k-royal)]"
              />
              <span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Gift aria-hidden className="size-4 text-primary" /> Trial gratis: ikut Sesi 1 saja
                </span>
                <span id="ket-trial" className="block text-sm text-text-muted">
                  {siswa?.sudahTrial
                    ? "Anak ini sudah pernah memakai trial gratis."
                    : !kelas.bisa_dibooking
                      ? "Trial hanya bisa diambil sebelum Sesi 1 dimulai."
                      : "Sekali per anak. Setelah Sesi 1, lanjutkan dengan memesan paket penuh."}
                </span>
              </span>
            </label>
          </fieldset>
        ) : null}

        {fiturLanjutan && jenisEfektif === "paket" ? (
          <div className="mt-5">
            <Input
              id="kode-referral"
              label="Kode referral pengajar (opsional)"
              value={kodeRef}
              onChange={(e) => setKodeRef(e.target.value.toUpperCase())}
              maxLength={20}
              autoComplete="off"
              galat={formatKodeSalah ? "Gunakan huruf, angka, dan tanda hubung (4–20 karakter)." : undefined}
              petunjuk={`Kode dari pengajar kelas ini memberi potongan ${PERSEN_POTONGAN_REFERRAL}%. Kode diperiksa saat Anda menekan Pesan kelas.`}
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 rounded-card-sm bg-surface-sunken p-4">
          {potongan > 0 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>Harga paket</span>
                <span className="tabular-nums">{formatRupiah(kelas.harga_paket)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-success">
                <span className="inline-flex items-center gap-1.5">
                  <Ticket aria-hidden className="size-4" /> Potongan referral {PERSEN_POTONGAN_REFERRAL}%
                </span>
                <span className="tabular-nums">−{formatRupiah(potongan)}</span>
              </div>
            </>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="font-bold">Total</span>
            <span className="font-display text-2xl font-semibold" aria-live="polite">
              {jenisEfektif === "trial" ? "Gratis" : formatRupiah(total)}
            </span>
          </div>
        </div>
      </section>
      <div className="flex gap-3 rounded-card-sm bg-info-subtle p-5">
        <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-info" />
        <div>
          {jenisEfektif === "trial" ? (
            <>
              <p className="font-display font-semibold text-info">Kursi Sesi 1 langsung terkonfirmasi</p>
              <p className="mt-1">
                Tidak perlu membayar. Tombol masuk kelas muncul di halaman sesi 15 menit sebelum Sesi 1 dimulai.
              </p>
            </>
          ) : (
            <>
              <p className="font-display font-semibold text-info">Kursi ditahan 24 jam</p>
              <p className="mt-1">
                Setelah Anda menekan Pesan kelas, bayar dan unggah bukti sebelum batas waktu. Kalau tidak, kursi dilepas untuk siswa lain.
              </p>
            </>
          )}
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
              <Check aria-hidden className="size-5" /> {jenisEfektif === "trial" ? "Ambil trial gratis" : "Pesan kelas"}
            </>
          )}
        </Tombol>
      </div>
    </div>
  );
}
