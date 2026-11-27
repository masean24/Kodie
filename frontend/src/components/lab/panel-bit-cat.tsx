"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Lightbulb, Loader2, LocateFixed, Sparkles, X } from "lucide-react";
import { cx } from "@/lib/cx";
import type { BerkasTemuan, ResponsLabMentor, TemuanLab, TingkatTemuan } from "@/lib/lab/mentor";
import { AvatarBitCat } from "./avatar-bit-cat";

const LABEL_BERKAS: Record<BerkasTemuan, string> = {
  html: "index.html",
  css: "style.css",
  js: "script.js",
  "main.py": "main.py",
  "turtle.py": "turtle.py",
  blok: "Papan blok",
};

const GAYA_TINGKAT: Record<
  TingkatTemuan,
  { label: string; lencana: string; bingkai: string; ikon: typeof AlertCircle }
> = {
  error: {
    label: "Galat",
    lencana: "bg-danger-subtle text-danger",
    bingkai: "border-danger/40",
    ikon: AlertCircle,
  },
  warn: {
    label: "Peringatan",
    lencana: "bg-warning-subtle text-warning",
    bingkai: "border-warning/40",
    ikon: AlertTriangle,
  },
  hint: {
    label: "Petunjuk",
    lencana: "bg-primary-subtle text-primary",
    bingkai: "border-primary/40",
    ikon: Lightbulb,
  },
};

export function PanelBitCat({
  hasil,
  memuat,
  galat,
  tujuan,
  onUbahTujuan,
  onPeriksa,
  onMintaLevel2,
  onPilihTemuan,
  onTutup,
}: {
  hasil: ResponsLabMentor | null;
  memuat: boolean;
  galat: string | null;
  tujuan: string;
  onUbahTujuan: (nilai: string) => void;
  onPeriksa: () => void;
  onMintaLevel2: () => void;
  onPilihTemuan: (t: TemuanLab) => void;
  onTutup: () => void;
}) {
  return (
    <section
      aria-labelledby="judul-bit-cat"
      data-tanpa-animasi
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-kartu md:p-6"
    >
      {/* Header panel */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarBitCat />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="judul-bit-cat" className="font-display text-lg font-bold text-text">
                Bit-Cat Mentor
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-3 py-0.5 text-sm font-bold text-text">
                <Sparkles aria-hidden="true" className="size-4 text-primary" />
                Hanya petunjuk · Bukan jawaban jadi
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Bantu kamu mencari letak salah dan logika yang kurang pas tanpa langsung membocorkan kodenya.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onTutup}
          aria-label="Tutup Bit-Cat Mentor"
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border border-border-strong bg-surface px-3 text-sm font-bold text-text hover:bg-surface-sunken"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      {/* Form tujuan opsional + tombol Periksa ulang */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPeriksa();
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="tujuan-lab" className="text-sm font-bold text-text">
            Apa yang sedang kamu coba buat? <span className="font-normal text-text-muted">(opsional, bantu cek logika)</span>
          </label>
          <input
            id="tujuan-lab"
            type="text"
            value={tujuan}
            maxLength={240}
            onChange={(e) => onUbahTujuan(e.target.value)}
            placeholder="Contoh: menggambar persegi biru, menghitung luas segitiga"
            className="min-h-touch w-full rounded-md border border-border-strong bg-surface-sunken px-4 text-base text-text placeholder:text-text-muted"
          />
        </div>
        <button
          type="submit"
          disabled={memuat}
          className="inline-flex min-h-touch shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 font-display text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:text-text-muted"
        >
          {memuat ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          <span>{memuat ? "Memeriksa…" : "Periksa kode"}</span>
        </button>
      </form>

      {/* Status & hasil */}
      <div aria-live="polite" className="flex flex-col gap-3">
        {memuat && !hasil ? (
          <div className="flex items-center gap-3 rounded-card-sm border border-border bg-surface-sunken p-4 text-sm font-semibold text-text-muted">
            <Loader2 aria-hidden="true" className="size-5 shrink-0 animate-spin text-primary" />
            <span>Bit-Cat sedang membaca baris kodemu dan menyiapkan petunjuk…</span>
          </div>
        ) : null}

        {galat ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card-sm border border-danger/40 bg-danger-subtle p-4 text-sm text-danger">
            <p className="font-semibold">{galat}</p>
            <button
              type="button"
              onClick={onPeriksa}
              className="min-h-touch rounded-full border border-danger px-4 text-sm font-bold text-danger hover:bg-surface"
            >
              Coba lagi
            </button>
          </div>
        ) : null}

        {hasil ? (
          <>
            <div
              className={cx(
                "flex flex-wrap items-start gap-3 rounded-card-sm border p-4",
                hasil.status === "kode_rapi"
                  ? "border-success/40 bg-success-subtle"
                  : hasil.status === "ditolak_privasi"
                    ? "border-danger/40 bg-danger-subtle"
                    : "border-border bg-surface-sunken",
              )}
            >
              {hasil.status === "kode_rapi" ? (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
              ) : (
                <AvatarBitCat ukuran="kecil" className="mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-text">{hasil.ringkasan}</p>
                {hasil.sumber === "lokal" ? (
                  <p className="mt-1 text-sm text-text-muted">
                    Menggunakan pemeriksa cepat di perangkat (tanpa koneksi server AI).
                  </p>
                ) : null}
              </div>
              {hasil.temuan.length > 0 ? (
                <span className="rounded-full bg-surface px-3 py-1 text-sm font-bold text-text">
                  Petunjuk Level {hasil.level}
                </span>
              ) : null}
            </div>

            {hasil.temuan.length > 0 ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {hasil.temuan.map((t) => {
                  const gaya = GAYA_TINGKAT[t.tingkat];
                  const Ikon = gaya.ikon;
                  const namaBerkas = LABEL_BERKAS[t.berkas];
                  const bisaSorot = t.berkas !== "blok" && t.baris !== null;

                  return (
                    <li
                      key={t.id}
                      className={cx(
                        "flex flex-col gap-3 rounded-card-sm border bg-surface p-4 shadow-kartu",
                        gaya.bingkai,
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-bold", gaya.lencana)}>
                          <Ikon aria-hidden="true" className="size-4 shrink-0" />
                          {gaya.label}
                        </span>
                        {bisaSorot ? (
                          <button
                            type="button"
                            onClick={() => onPilihTemuan(t)}
                            className="inline-flex min-h-touch items-center gap-1.5 rounded-full border border-border-strong bg-surface-sunken px-3 text-sm font-bold text-primary hover:bg-primary-subtle"
                          >
                            <LocateFixed aria-hidden="true" className="size-4 shrink-0" />
                            <span>
                              {namaBerkas} · Baris {t.baris}
                            </span>
                          </button>
                        ) : (
                          <span className="font-mono text-sm font-bold text-text-muted">{namaBerkas}</span>
                        )}
                      </div>

                      <h3 className="font-display text-base font-bold text-text">{t.judul}</h3>
                      <p className="text-sm leading-relaxed text-text">{t.petunjuk}</p>

                      <div className="mt-auto rounded-md border border-border bg-surface-sunken p-3 text-sm">
                        <p className="font-bold text-primary">Coba pikirkan:</p>
                        <p className="mt-1 text-text">{t.pertanyaan_pemandu}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {hasil.boleh_level_2 && hasil.level === 1 && !memuat ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card-sm border border-border bg-surface-sunken p-4">
                <p className="text-sm text-text-muted">
                  Masih bingung di bagian tertentu? Minta langkah pengecekan yang lebih spesifik (tetap tanpa kode jadi).
                </p>
                <button
                  type="button"
                  onClick={onMintaLevel2}
                  className="inline-flex min-h-touch items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-bold text-text hover:bg-primary-subtle hover:text-primary"
                >
                  <Lightbulb aria-hidden="true" className="size-4" />
                  <span>Minta petunjuk lebih rinci (Level 2)</span>
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
