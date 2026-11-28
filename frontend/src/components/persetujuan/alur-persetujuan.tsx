"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, CheckCircle2, Eye, FileText, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";
import type { InfoPersetujuan, Peran } from "@/types/database";
import { aksiPutuskan } from "@/lib/aksi/akun";
import { aksiKeluar } from "@/app/(auth)/aksi";
import { formatTanggal, labelKelas } from "@/lib/format";
import { cx } from "@/lib/cx";
import { Tombol, TombolTautan } from "@/components/ui/tombol";
import { KartuAuth, Langkah, PesanFormulir } from "@/components/auth/bagian";
import { FormMasuk } from "@/components/auth/form-masuk";
import { FormOrangTua } from "@/components/auth/alur-daftar";

type Props = {
  token: string;
  info: InfoPersetujuan;
  pengguna: { peran: Peran; nama: string } | null;
  /** true jika kembali dari masuk/daftar setelah mencentang persetujuan. */
  sudahSetuju: boolean;
  akunMock?: string[];
};

function Daftar({ ikon: Ikon, judul, isi }: { ikon: LucideIcon; judul: string; isi: string[] }) {
  return (
    <section className="rounded-card-sm bg-surface p-5">
      <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
        <Ikon aria-hidden className="size-5 shrink-0 text-primary" /> {judul}
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {isi.map((t) => (
          <li key={t} className="flex gap-2">
            <Check aria-hidden className="mt-1 size-4 shrink-0 text-success" />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AlurPersetujuan({ token, info, pengguna, sudahSetuju, akunMock }: Props) {
  const panggilan = info.nama.split(/\s+/)[0];
  const lanjut = `/persetujuan/${encodeURIComponent(token)}?setuju=1`;
  const [langkah, setLangkah] = useState<1 | 2>(sudahSetuju ? 2 : 1);
  const [centang, setCentang] = useState(sudahSetuju);
  const [galatCentang, setGalatCentang] = useState(false);
  const [konfirmasiTolak, setKonfirmasiTolak] = useState(false);
  const [tab, setTab] = useState<"masuk" | "daftar">("masuk");
  const [selesai, setSelesai] = useState<"setujui" | "tolak" | null>(null);
  const [galat, setGalat] = useState<string>();
  const [menunggu, mulai] = useTransition();
  const judulRef = useRef<HTMLHeadingElement>(null);
  const pertama = useRef(true);

  useEffect(() => {
    if (!pertama.current) judulRef.current?.focus();
    pertama.current = false;
  }, [langkah, selesai]);

  const putuskan = (k: "setujui" | "tolak") =>
    mulai(async () => {
      setGalat(undefined);
      const hasil = await aksiPutuskan(token, k);
      if ("galat" in hasil) setGalat(hasil.galat);
      else setSelesai(k);
    });

  const judul = "text-32 leading-[38px] font-extrabold focus:outline-none md:text-48 md:leading-[50px]";

  if (selesai) {
    const setuju = selesai === "setujui";
    const Ikon = setuju ? CheckCircle2 : XCircle;
    return (
      <KartuAuth lebar="max-w-[640px]">
        <Ikon aria-hidden className={cx("size-12", setuju ? "text-success" : "text-text-muted")} />
        <h1 ref={judulRef} tabIndex={-1} className={cx(judul, "mt-4")}>
          {setuju ? `Akun ${panggilan} sudah aktif` : "Permintaan ditolak"}
        </h1>
        <p className="mt-3 text-lg">
          {setuju
            ? `${info.nama} sekarang terhubung ke akun Anda dan bisa memesan kelas. Laporan setiap sesi akan tampil di dashboard Anda.`
            : `Akun ${info.nama} tidak diaktifkan. ${panggilan} bisa membuat link baru kalau Anda berubah pikiran.`}
        </p>
        {setuju ? (
          <TombolTautan href="/orang-tua/anak" ukuran="lg" className="mt-6">
            Lihat anak di dashboard
          </TombolTautan>
        ) : (
          <TombolTautan href="/" varian="kedua" className="mt-6">
            Ke beranda
          </TombolTautan>
        )}
      </KartuAuth>
    );
  }

  if (langkah === 1) {
    return (
      <KartuAuth lebar="max-w-[640px]">
        <Langkah ke={1} dari={2} label="Baca dan setujui" />
        <h1 ref={judulRef} tabIndex={-1} className={cx(judul, "mt-6")}>
          {panggilan} meminta persetujuan Anda
        </h1>
        <p className="mt-3 text-text-muted">
          {info.nama} ({labelKelas(info.jenjang, info.kelas)}
          {info.sekolah ? `, ${info.sekolah}` : ""}) mendaftar kelas teknologi daring di Kodie. Akunnya baru aktif setelah Anda
          setuju. Link ini berlaku sampai {formatTanggal(info.kedaluwarsa_pada)}.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <Daftar
            ikon={FileText}
            judul="Data yang kami simpan"
            isi={["Nama lengkap dan tanggal lahir", "Jenjang, kelas, dan nama sekolah", "Nama dan email orang tua"]}
          />
          <Daftar
            ikon={Eye}
            judul="Untuk apa data ini dipakai"
            isi={["Menyaring kelas sesuai jenjang", "Mengirim laporan setiap sesi ke Anda", "Tidak dijual dan tidak dipakai untuk iklan"]}
          />
          <Daftar
            ikon={ShieldCheck}
            judul="Aturan keamanan kelas"
            isi={[
              "Pengajar sudah diverifikasi: KTP/KTM, SKCK, dan wawancara",
              "Kelas lewat Google Meet; link hanya untuk peserta",
              `Catatan pengajar hanya bisa dilihat Anda dan ${panggilan}`,
            ]}
          />
        </div>
        <p className="mt-4 text-sm">
          Rincian lengkap ada di{" "}
          <Link href="/kebijakan-privasi" className="font-bold text-primary underline-offset-4 hover:underline">
            Kebijakan privasi
          </Link>
          .
        </p>

        <div className="mt-6">
          <label className="flex min-h-touch cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={centang}
              onChange={(e) => {
                setCentang(e.target.checked);
                setGalatCentang(false);
              }}
              aria-invalid={galatCentang || undefined}
              aria-describedby={galatCentang ? "galat-centang" : undefined}
              className="mt-1 size-5 shrink-0 accent-primary"
            />
            <span>Saya sudah membaca dan menyetujui pemakaian data {panggilan}.</span>
          </label>
          {galatCentang ? (
            <p id="galat-centang" className="mt-1 text-sm font-bold text-danger">
              Centang persetujuan dulu sebelum melanjutkan.
            </p>
          ) : null}
        </div>

        <PesanFormulir galat={galat} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Tombol
            ukuran="lg"
            onClick={() => {
              if (!centang) setGalatCentang(true);
              else setLangkah(2);
            }}
          >
            Setujui dan lanjutkan
          </Tombol>
          {konfirmasiTolak ? null : (
            <Tombol varian="tautan" onClick={() => setKonfirmasiTolak(true)}>
              Tolak permintaan
            </Tombol>
          )}
        </div>

        {konfirmasiTolak ? (
          <div role="alertdialog" aria-labelledby="judul-tolak" className="mt-6 rounded-card-sm bg-danger-subtle p-5">
            <p id="judul-tolak" className="font-display text-lg font-semibold">
              Tolak permintaan {panggilan}?
            </p>
            <p className="mt-1">Akun {panggilan} tidak akan aktif dan link ini tidak bisa dipakai lagi.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Tombol varian="bahaya" onClick={() => putuskan("tolak")} disabled={menunggu} aria-busy={menunggu}>
                Ya, tolak
              </Tombol>
              <Tombol varian="kedua" onClick={() => setKonfirmasiTolak(false)}>
                Batal
              </Tombol>
            </div>
          </div>
        ) : null}
        <p className="mt-6 text-sm text-text-muted">Langkah berikutnya: masuk atau buat akun orang tua di halaman ini juga.</p>
      </KartuAuth>
    );
  }

  return (
    <KartuAuth lebar="max-w-[640px]">
      <Langkah ke={2} dari={2} label="Masuk sebagai orang tua" />
      {pengguna?.peran === "orang_tua" ? (
        <>
          <h1 ref={judulRef} tabIndex={-1} className={cx(judul, "mt-6")}>
            Setujui sebagai {pengguna.nama}?
          </h1>
          <p className="mt-3">
            {info.nama} akan terhubung ke akun Anda. Anda bisa memesan kelas untuknya dan melihat laporan setiap sesi.
          </p>
          <PesanFormulir galat={galat} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Tombol ukuran="lg" onClick={() => putuskan("setujui")} disabled={menunggu} aria-busy={menunggu}>
              {menunggu ? "Menyimpan…" : `Setujui akun ${panggilan}`}
            </Tombol>
            <Tombol varian="kedua" onClick={() => setLangkah(1)}>
              Kembali
            </Tombol>
          </div>
        </>
      ) : pengguna ? (
        <>
          <h1 ref={judulRef} tabIndex={-1} className={cx(judul, "mt-6")}>
            Masuk dengan akun orang tua
          </h1>
          <p className="mt-3">
            Anda sedang masuk sebagai {pengguna.nama}. Persetujuan hanya bisa diberikan dari akun orang tua. Keluar dulu, lalu
            masuk atau buat akun orang tua.
          </p>
          <form action={() => aksiKeluar(lanjut)} className="mt-6">
            <Tombol type="submit">Keluar dan lanjutkan</Tombol>
          </form>
        </>
      ) : (
        <>
          <h1 ref={judulRef} tabIndex={-1} className={cx(judul, "mt-6")}>
            Masuk atau buat akun orang tua
          </h1>
          <p className="mt-3">Setelah itu Anda kembali ke halaman ini untuk menyelesaikan persetujuan.</p>
          <div role="tablist" aria-label="Pilih cara" className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-surface p-1">
            {(
              [
                ["masuk", "Saya sudah punya akun"],
                ["daftar", "Buat akun orang tua"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`tab-${k}`}
                aria-selected={tab === k}
                aria-controls={`panel-${k}`}
                onClick={() => setTab(k)}
                className={cx(
                  "min-h-touch rounded-full px-3 text-sm font-display font-semibold",
                  tab === k ? "bg-primary text-primary-foreground" : "text-text hover:bg-surface-sunken",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-4 rounded-card-sm bg-surface p-5">
            {tab === "masuk" ? (
              <FormMasuk ringkas lanjut={lanjut} akunMock={akunMock} />
            ) : (
              <FormOrangTua lanjut={lanjut} />
            )}
          </div>
          <Tombol varian="tautan" className="mt-4" onClick={() => setLangkah(1)}>
            Kembali ke langkah 1
          </Tombol>
        </>
      )}
    </KartuAuth>
  );
}
