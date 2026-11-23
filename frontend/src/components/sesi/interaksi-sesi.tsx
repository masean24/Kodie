"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Flag, Star, Video } from "lucide-react";
import type { KategoriMasalah } from "@/types/database";
import { aksiBeriRating, aksiLaporMasalah, aksiMasukKelasPengguna } from "@/lib/aksi/sesi";
import { cx } from "@/lib/cx";
import { LABEL_KATEGORI_MASALAH } from "@/lib/sesi";
import { KATEGORI_MASALAH_PILIHAN } from "@/lib/validasi/sesi";
import { Catatan } from "@/components/ui/dasar";
import { Pilihan, Textarea } from "@/components/ui/formulir";
import { Tombol } from "@/components/ui/tombol";
import { PesanFormulir, fokusGalatPertama } from "@/components/auth/bagian";

/** Tombol Masuk kelas untuk orang tua dan siswa (PRD F8). */
export function TombolMasukSesiPengguna({
  sesiId,
  aktif,
  varian = "terang",
  diBlokBiru = true,
  className,
}: {
  sesiId: string;
  aktif: boolean;
  varian?: "utama" | "kedua" | "terang";
  diBlokBiru?: boolean;
  className?: string;
}) {
  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();
  const [meetUrl, setMeetUrl] = useState<string>();

  const buka = () =>
    mulai(async () => {
      setGalat(undefined);
      const res = await aksiMasukKelasPengguna(sesiId);
      if (res.galat) {
        setGalat(res.galat);
        return;
      }
      if (res.meetUrl) {
        setMeetUrl(res.meetUrl);
        window.open(res.meetUrl, "_blank", "noopener,noreferrer");
      }
    });

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <Tombol
        varian={varian}
        ukuran="lg"
        disabled={!aktif || menunggu}
        aria-busy={menunggu}
        onClick={buka}
        className={cx(!aktif && diBlokBiru && "opacity-75")}
      >
        <Video aria-hidden className="size-5" />
        {menunggu ? "Mempersiapkan…" : "Masuk kelas"}
      </Tombol>
      {meetUrl ? (
        <a
          href={meetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(
            "inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline",
            diBlokBiru ? "text-primary-foreground" : "text-primary",
          )}
        >
          <ExternalLink aria-hidden className="size-4" /> Buka Google Meet
        </a>
      ) : null}
      {galat ? (
        <p role="alert" className="rounded-md bg-danger-subtle px-3 py-1.5 text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

/** Form rating 1-5 bintang dan komentar opsional (PRD F12, Figma 9). */
export function FormRating({ sesiId, siswaId }: { sesiId: string; siswaId: string }) {
  const [bintang, setBintang] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [galat, setGalat] = useState<string>();
  const [galatBintang, setGalatBintang] = useState<string>();
  const [galatKomentar, setGalatKomentar] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setGalatBintang(undefined);
    setGalatKomentar(undefined);

    mulai(async () => {
      const res = await aksiBeriRating({
        sesi_id: sesiId,
        siswa_id: siswaId,
        bintang,
        komentar,
      });
      if (res.galatIsian) {
        setGalatBintang(res.galatIsian.bintang);
        setGalatKomentar(res.galatIsian.komentar);
        fokusGalatPertama();
      }
      if (res.galat) setGalat(res.galat);
    });
  };

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-[-0.2px]">Beri rating sesi ini</h2>
        <p className="mt-1 text-sm text-text-muted">
          Satu kali per sesi. Pengajar melihat rata-ratanya, bukan nama Anda.
        </p>
      </div>

      <PesanFormulir galat={galat} />

      <fieldset aria-describedby={galatBintang ? `rating-galat-${siswaId}` : undefined}>
        <legend className="font-bold">Penilaian Anda</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const aktif = n <= bintang;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} bintang`}
                aria-pressed={bintang === n}
                onClick={() => {
                  setBintang(n);
                  setGalatBintang(undefined);
                }}
                className={cx(
                  "grid size-touch place-items-center rounded-md border-[1.5px] transition-colors",
                  aktif ? "border-primary bg-accent-subtle text-on-accent" : "border-border-strong bg-surface text-text-muted hover:bg-surface-sunken",
                )}
              >
                <Star aria-hidden className={cx("size-6", aktif && "fill-current text-primary")} />
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-sm text-text-muted">{bintang > 0 ? `${bintang} dari 5 bintang` : "Pilih 1–5 bintang"}</p>
        {galatBintang ? (
          <p id={`rating-galat-${siswaId}`} role="alert" className="mt-1 text-sm font-bold text-danger">
            {galatBintang}
          </p>
        ) : null}
      </fieldset>

      <Textarea
        id={`komentar-${siswaId}`}
        label="Komentar (opsional)"
        value={komentar}
        onChange={(e) => setKomentar(e.target.value)}
        maxLength={300}
        maksKarakter={300}
        panjangSaatIni={komentar.length}
        petunjuk="Maksimal 300 karakter."
        galat={galatKomentar}
        placeholder="Ceritakan pengalaman belajar di sesi ini…"
      />

      <Tombol type="submit" disabled={menunggu} aria-busy={menunggu} className="w-full">
        {menunggu ? "Mengirim rating…" : "Kirim rating"}
      </Tombol>
    </form>
  );
}

/** Form lapor masalah pada sesi atau profil pengajar (PRD F12). */
export function FormLaporMasalah({
  sesiId,
  pengajarId,
  namaPengajar,
}: {
  sesiId: string | null;
  pengajarId: string;
  namaPengajar: string;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [kategori, setKategori] = useState<KategoriMasalah>("masalah_teknis");
  const [deskripsi, setDeskripsi] = useState("");
  const [galat, setGalat] = useState<string>();
  const [galatIsian, setGalatIsian] = useState<Record<string, string>>({});
  const [terkirim, setTerkirim] = useState(false);
  const [menunggu, mulai] = useTransition();

  if (terkirim) {
    return (
      <Catatan nada="sukses" judul="Laporan masalah terkirim">
        <p className="flex items-start gap-2">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Tim admin Kodie sudah menerima laporan Anda dan akan meninjaunya.</span>
        </p>
      </Catatan>
    );
  }

  if (!terbuka) {
    return (
      <div>
        <Tombol varian="tautan" onClick={() => setTerbuka(true)}>
          <Flag aria-hidden className="size-4" /> Laporkan masalah
        </Tombol>
      </div>
    );
  }

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(undefined);
    setGalatIsian({});
    mulai(async () => {
      const res = await aksiLaporMasalah({
        sesi_id: sesiId,
        pengajar_id: pengajarId,
        kategori,
        deskripsi,
      });
      if (res.galatIsian) {
        setGalatIsian(res.galatIsian);
        fokusGalatPertama();
        return;
      }
      if (res.galat) {
        setGalat(res.galat);
        return;
      }
      setTerkirim(true);
    });
  };

  return (
    <form onSubmit={kirim} noValidate className="flex max-w-[640px] flex-col gap-4 rounded-card bg-surface p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden className="mt-1 size-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-xl font-semibold">Laporkan masalah</h2>
          <p className="mt-1 text-sm text-text-muted">
            Terkait {namaPengajar}. Laporan kategori perilaku tidak pantas diprioritaskan admin.
          </p>
        </div>
      </div>

      <PesanFormulir galat={galat} />

      <Pilihan
        id="kategori-masalah"
        label="Kategori masalah"
        value={kategori}
        onChange={(e) => setKategori(e.target.value as KategoriMasalah)}
        galat={galatIsian.kategori}
      >
        {KATEGORI_MASALAH_PILIHAN.map((k) => (
          <option key={k} value={k}>
            {LABEL_KATEGORI_MASALAH[k]}
          </option>
        ))}
      </Pilihan>

      <Textarea
        id="deskripsi-masalah"
        label="Jelaskan masalah yang terjadi"
        value={deskripsi}
        onChange={(e) => setDeskripsi(e.target.value)}
        maxLength={1000}
        maksKarakter={1000}
        panjangSaatIni={deskripsi.length}
        petunjuk="Wajib, minimal 10 karakter."
        galat={galatIsian.deskripsi}
        placeholder="Tuliskan kronologi atau kendala yang Anda alami…"
      />

      <div className="flex flex-wrap gap-3">
        <Tombol type="submit" disabled={menunggu} aria-busy={menunggu}>
          {menunggu ? "Mengirim…" : "Kirim laporan masalah"}
        </Tombol>
        <Tombol varian="kedua" onClick={() => setTerbuka(false)}>
          Batal
        </Tombol>
      </div>
    </form>
  );
}
