"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Award, BriefcaseBusiness, Check, Copy, ExternalLink, Link2, Plus, Ticket, Trash2 } from "lucide-react";
import type { DetailProfilPengajar, KodeReferral } from "@/types/database";
import { aksiBuatKodeReferral, aksiSimpanDetailProfil, aksiUbahSlugPengajar } from "@/lib/aksi/pengajar-lanjutan";
import { PERSEN_BAGI_HASIL, PERSEN_BONUS_REFERRAL, PERSEN_POTONGAN_REFERRAL } from "@/lib/referral";
import { Input } from "@/components/ui/formulir";
import { Kartu } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";
import { PesanFormulir } from "@/components/auth/bagian";
import { TombolBagikanProfil } from "@/components/pengajar/bagikan-profil";

type Pengalaman = { id?: string; peran: string; tempat: string; periode: string; deskripsi: string };
type Sertifikat = { id?: string; nama: string; penerbit: string; tahun: string; tautan: string };

/** Kode referral pengajar: buat sekali, salin, atau bagikan bersama tautan profil. */
export function KartuKodeReferral({
  kode,
  pengajarId,
  slug,
  nama,
  terverifikasi,
}: {
  kode: KodeReferral | null;
  pengajarId: string;
  slug?: string | null;
  nama: string;
  terverifikasi: boolean;
}) {
  const [galat, setGalat] = useState<string>();
  const [tersalin, setTersalin] = useState(false);
  const [menunggu, mulai] = useTransition();
  const pathProfil = `/pengajar/${slug || pengajarId}`;

  const buat = () =>
    mulai(async () => {
      setGalat(undefined);
      const h = await aksiBuatKodeReferral();
      if (h.galat) setGalat(h.galat);
    });

  const salin = async () => {
    if (!kode) return;
    try {
      await navigator.clipboard.writeText(kode.kode);
      setTersalin(true);
      window.setTimeout(() => setTersalin(false), 2500);
    } catch {
      setGalat("Gagal menyalin. Salin kode secara manual.");
    }
  };

  return (
    <Kartu className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Ticket aria-hidden className="mt-1 size-6 shrink-0 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Kode referral</h2>
          <p className="mt-1 text-text-muted">
            Bagikan kode ini ke calon siswa. Orang tua yang memakai kode Anda di kelas yang Anda ajar mendapat potongan{" "}
            {PERSEN_POTONGAN_REFERRAL}%, dan bagian Anda untuk siswa itu naik dari {PERSEN_BAGI_HASIL}% menjadi{" "}
            {PERSEN_BAGI_HASIL + PERSEN_BONUS_REFERRAL}%.
          </p>
        </div>
      </div>
      <PesanFormulir galat={galat} />
      {kode ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="rounded-md border-[1.5px] border-dashed border-primary bg-accent-subtle px-4 py-2 font-mono-kodie text-xl font-bold tracking-wider text-text">
            {kode.kode}
          </p>
          <Tombol varian="kedua" onClick={salin}>
            {tersalin ? <Check aria-hidden className="size-5" /> : <Copy aria-hidden className="size-5" />}
            {tersalin ? "Disalin" : "Salin kode"}
          </Tombol>
          <span role="status" aria-live="polite" className="sr-only">
            {tersalin ? "Kode referral disalin" : ""}
          </span>
        </div>
      ) : (
        <div>
          <Tombol onClick={buat} disabled={menunggu || !terverifikasi} aria-busy={menunggu}>
            {menunggu ? "Membuat…" : "Buat kode referral"}
          </Tombol>
          {!terverifikasi ? <p className="mt-2 text-sm text-text-muted">Kode bisa dibuat setelah akun Anda diverifikasi admin.</p> : null}
        </div>
      )}
      {kode ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="font-bold">Bagikan profil dengan kode Anda</p>
          <p className="text-sm text-text-muted">Kode otomatis terisi saat pengunjung tautan ini memesan kelas Anda.</p>
          <div className="flex flex-wrap items-center gap-3">
            <TombolBagikanProfil path={pathProfil} nama={nama} kode={kode.kode} />
            <Link
              href={pathProfil}
              className="inline-flex min-h-touch items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline"
            >
              Lihat profil publik <ExternalLink aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </Kartu>
  );
}

/** Username / slug tautan profil publik pengajar (`/pengajar/<slug>`). */
export function KartuSlugProfil({
  awalSlug,
  slugTersimpan,
  pengajarId,
  nama,
  terverifikasi,
}: {
  awalSlug: string;
  /** Slug yang sudah tersimpan di profil; null bila `awalSlug` baru usulan dari nama. */
  slugTersimpan: string | null;
  pengajarId: string;
  nama: string;
  terverifikasi: boolean;
}) {
  const [nilai, setNilai] = useState(awalSlug);
  const [slugAktif, setSlugAktif] = useState(slugTersimpan ?? "");
  const [galat, setGalat] = useState<string>();
  const [galatIsian, setGalatIsian] = useState<string>();
  const [pesan, setPesan] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const pratinjau = nilai.trim().toLowerCase() || slugAktif;
  // Tautan lama tidak dialihkan (belum ada riwayat slug di backend), jadi pengajar diberi tahu sebelum menyimpan.
  const berubah = Boolean(slugAktif) && nilai.trim().toLowerCase() !== slugAktif;
  const pathProfil = `/pengajar/${slugAktif || pengajarId}`;

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    mulai(async () => {
      setGalat(undefined);
      setGalatIsian(undefined);
      setPesan(undefined);
      const h = await aksiUbahSlugPengajar(nilai);
      if (h.galatIsian?.slug) {
        setGalatIsian(h.galatIsian.slug);
        return;
      }
      if (h.galat) {
        setGalat(h.galat);
        return;
      }
      if (h.ok && h.slug) {
        setNilai(h.slug);
        setSlugAktif(h.slug);
        setPesan("Username tautan profil diperbarui.");
      }
    });
  };

  return (
    <Kartu className="flex flex-col gap-4">
      <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Link2 aria-hidden className="mt-1 size-6 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Username tautan profil publik</h2>
            <p className="mt-1 text-text-muted">
              Otomatis dibuat dari nama Anda saat mendaftar. Bisa dikustomisasi kapan saja menggunakan huruf kecil, angka, dan tanda hubung (<code>-</code>).
            </p>
          </div>
        </div>
        <PesanFormulir galat={galat} />
        {pesan ? (
          <p role="status" className="rounded-card-sm bg-success-subtle p-4 font-bold text-success">
            {pesan}
          </p>
        ) : null}
        <Input
          id="slug-profil-pengajar"
          label="Username tautan profil"
          petunjuk={`Pratinjau tautan: /pengajar/${pratinjau}`}
          value={nilai}
          onChange={(e) => setNilai(e.target.value)}
          galat={galatIsian}
          maxLength={40}
          placeholder="misal: citra-lestari"
        />
        {berubah ? (
          <p className="rounded-card-sm bg-warning-subtle p-4 text-sm">
            <strong>Perhatian:</strong> setelah disimpan, tautan lama <code>/pengajar/{slugAktif}</code> tidak bisa dibuka
            lagi. Bagikan ulang tautan baru ke orang tua yang sudah menerima tautan lama.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
            {menunggu ? "Menyimpan…" : "Simpan username"}
          </Tombol>
          {terverifikasi ? (
            <>
              <TombolBagikanProfil path={pathProfil} nama={nama} />
              <Link
                href={pathProfil}
                className="inline-flex min-h-touch items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline"
              >
                Lihat profil publik <ExternalLink aria-hidden className="size-4" />
              </Link>
            </>
          ) : null}
        </div>
      </form>
    </Kartu>
  );
}

/** Formulir pengalaman & sertifikat yang tampil di profil publik pengajar. */
export function FormDetailProfil({ awal }: { awal: DetailProfilPengajar }) {
  const [pengalaman, setPengalaman] = useState<Pengalaman[]>(
    awal.pengalaman.map((x) => ({ id: x.id, peran: x.peran, tempat: x.tempat, periode: x.periode, deskripsi: x.deskripsi ?? "" })),
  );
  const [sertifikat, setSertifikat] = useState<Sertifikat[]>(
    awal.sertifikat.map((x) => ({ id: x.id, nama: x.nama, penerbit: x.penerbit, tahun: String(x.tahun), tautan: x.tautan ?? "" })),
  );
  const [galat, setGalat] = useState<string>();
  const [galatIsian, setGalatIsian] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const ubahP = (i: number, k: keyof Pengalaman, v: string) =>
    setPengalaman((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const ubahS = (i: number, k: keyof Sertifikat, v: string) =>
    setSertifikat((d) => d.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    mulai(async () => {
      setGalat(undefined);
      setPesan(undefined);
      setGalatIsian({});
      const h = await aksiSimpanDetailProfil({ pengalaman, sertifikat });
      if (h.galatIsian) {
        setGalatIsian(h.galatIsian);
        setGalat("Periksa lagi isian yang ditandai.");
        window.requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-detail-profil] [aria-invalid=true]")?.focus());
      }
      if (h.galat) setGalat(h.galat);
      if (h.ok) setPesan("Pengalaman dan sertifikat disimpan. Profil publik Anda sudah diperbarui.");
    });
  };

  return (
    <Kartu className="flex flex-col gap-6">
      <form onSubmit={simpan} noValidate data-detail-profil className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold">Profil publik: pengalaman dan sertifikat</h2>
          <p className="mt-1 text-text-muted">Tampil di halaman profil Anda yang bisa dibagikan ke orang tua.</p>
        </div>
        <PesanFormulir galat={galat} />
        {pesan ? (
          <p role="status" className="rounded-card-sm bg-success-subtle p-4 font-bold text-success">
            {pesan}
          </p>
        ) : null}

        <fieldset className="flex flex-col gap-4">
          <legend className="flex items-center gap-2 font-display text-lg font-semibold">
            <BriefcaseBusiness aria-hidden className="size-5 text-primary" /> Pengalaman
          </legend>
          {pengalaman.length === 0 ? <p className="text-sm text-text-muted">Belum ada pengalaman.</p> : null}
          {pengalaman.map((x, i) => (
            <div key={x.id ?? `baru-${i}`} className="grid gap-3 rounded-card-sm border border-border p-4 sm:grid-cols-2">
              <Input id={`p-${i}-peran`} label="Peran" value={x.peran} onChange={(e) => ubahP(i, "peran", e.target.value)} galat={galatIsian[`pengalaman.${i}.peran`]} maxLength={80} />
              <Input id={`p-${i}-tempat`} label="Tempat atau organisasi" value={x.tempat} onChange={(e) => ubahP(i, "tempat", e.target.value)} galat={galatIsian[`pengalaman.${i}.tempat`]} maxLength={100} />
              <Input id={`p-${i}-periode`} label="Periode" placeholder="2024 – sekarang" value={x.periode} onChange={(e) => ubahP(i, "periode", e.target.value)} galat={galatIsian[`pengalaman.${i}.periode`]} maxLength={40} />
              <Input id={`p-${i}-deskripsi`} label="Deskripsi singkat (opsional)" value={x.deskripsi} onChange={(e) => ubahP(i, "deskripsi", e.target.value)} galat={galatIsian[`pengalaman.${i}.deskripsi`]} maxLength={240} />
              <div className="sm:col-span-2">
                <Tombol varian="kedua" onClick={() => setPengalaman((d) => d.filter((_, j) => j !== i))}>
                  <Trash2 aria-hidden className="size-5" /> Hapus pengalaman<span className="sr-only"> {x.peran || i + 1}</span>
                </Tombol>
              </div>
            </div>
          ))}
          {pengalaman.length < 10 ? (
            <div>
              <Tombol varian="kedua" onClick={() => setPengalaman((d) => [...d, { peran: "", tempat: "", periode: "", deskripsi: "" }])}>
                <Plus aria-hidden className="size-5" /> Tambah pengalaman
              </Tombol>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="flex items-center gap-2 font-display text-lg font-semibold">
            <Award aria-hidden className="size-5 text-primary" /> Sertifikat
          </legend>
          {sertifikat.length === 0 ? <p className="text-sm text-text-muted">Belum ada sertifikat.</p> : null}
          {sertifikat.map((x, i) => (
            <div key={x.id ?? `baru-${i}`} className="grid gap-3 rounded-card-sm border border-border p-4 sm:grid-cols-2">
              <Input id={`s-${i}-nama`} label="Nama sertifikat" value={x.nama} onChange={(e) => ubahS(i, "nama", e.target.value)} galat={galatIsian[`sertifikat.${i}.nama`]} maxLength={100} />
              <Input id={`s-${i}-penerbit`} label="Penerbit" value={x.penerbit} onChange={(e) => ubahS(i, "penerbit", e.target.value)} galat={galatIsian[`sertifikat.${i}.penerbit`]} maxLength={100} />
              <Input id={`s-${i}-tahun`} label="Tahun" inputMode="numeric" value={x.tahun} onChange={(e) => ubahS(i, "tahun", e.target.value)} galat={galatIsian[`sertifikat.${i}.tahun`]} maxLength={4} />
              <Input id={`s-${i}-tautan`} label="Tautan verifikasi (opsional)" type="url" placeholder="https://" value={x.tautan} onChange={(e) => ubahS(i, "tautan", e.target.value)} galat={galatIsian[`sertifikat.${i}.tautan`]} />
              <div className="sm:col-span-2">
                <Tombol varian="kedua" onClick={() => setSertifikat((d) => d.filter((_, j) => j !== i))}>
                  <Trash2 aria-hidden className="size-5" /> Hapus sertifikat<span className="sr-only"> {x.nama || i + 1}</span>
                </Tombol>
              </div>
            </div>
          ))}
          {sertifikat.length < 10 ? (
            <div>
              <Tombol varian="kedua" onClick={() => setSertifikat((d) => [...d, { nama: "", penerbit: "", tahun: "", tautan: "" }])}>
                <Plus aria-hidden className="size-5" /> Tambah sertifikat
              </Tombol>
            </div>
          ) : null}
        </fieldset>

        <div>
          <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
            {menunggu ? "Menyimpan…" : "Simpan profil publik"}
          </Tombol>
        </div>
      </form>
    </Kartu>
  );
}
