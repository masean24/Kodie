"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Copy, FileText, RefreshCw, Upload } from "lucide-react";
import { aksiBatalkanBooking, aksiKirimBukti } from "@/lib/aksi/booking";
import { unggahBuktiBayar } from "@/lib/api/unggah";
import { pesanError } from "@/lib/errors";
import { ACCEPT_BUKTI, cekBukti, formatUkuran } from "@/lib/validasi/bukti";
import { Tombol } from "@/components/ui/tombol";

/** Tombol salin teks (nomor rekening). */
export function TombolSalin({ teks, label }: { teks: string; label: string }) {
  const [tersalin, setTersalin] = useState(false);
  return (
    <>
      <Tombol
        varian="kedua"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(teks.replace(/\s+/g, ""));
            setTersalin(true);
            setTimeout(() => setTersalin(false), 3000);
          } catch {
            setTersalin(false);
          }
        }}
      >
        {tersalin ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
        {tersalin ? "Tersalin" : "Salin"}
        <span className="sr-only"> {label}</span>
      </Tombol>
      <span aria-live="polite" className="sr-only">
        {tersalin ? `${label} tersalin` : ""}
      </span>
    </>
  );
}

/** Unggah bukti bayar: cek format dan ukuran di browser, unggah, lalu kirim (PRD F6). */
export function FormBukti({ bookingId }: { bookingId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [galat, setGalat] = useState<string>();
  const [menunggu, mulai] = useTransition();

  function pilih(f: File | undefined) {
    setGalat(undefined);
    if (!f) return;
    const masalah = cekBukti(f);
    if (masalah) {
      setFile(null);
      setGalat(masalah);
      if (input.current) input.current.value = "";
      return;
    }
    setFile(f);
  }

  const kirim = () =>
    mulai(async () => {
      if (!file) {
        setGalat("Pilih file bukti bayar dulu.");
        input.current?.focus();
        return;
      }
      try {
        const path = await unggahBuktiBayar(bookingId, file);
        const hasil = await aksiKirimBukti(bookingId, path);
        if (hasil.galat) setGalat(hasil.galat);
      } catch (e) {
        setGalat(pesanError(e));
      }
    });

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="bukti" className="font-bold">
        Bukti bayar
      </label>
      <p id="bukti-petunjuk" className="text-sm text-text-muted">
        JPG, PNG, atau PDF. Maksimal 2 MB.
      </p>
      <input
        ref={input}
        id="bukti"
        type="file"
        accept={ACCEPT_BUKTI}
        aria-describedby={galat ? "bukti-petunjuk bukti-galat" : "bukti-petunjuk"}
        aria-invalid={galat ? true : undefined}
        onChange={(e) => pilih(e.target.files?.[0])}
        className="sr-only"
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-card-sm border-[1.5px] border-border-strong p-4">
          <FileText aria-hidden className="size-8 shrink-0 text-text-muted" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{file.name}</p>
            <p className="text-sm text-text-muted">{formatUkuran(file.size)} · siap dikirim</p>
          </div>
          <Tombol varian="tautan" onClick={() => input.current?.click()}>
            <RefreshCw aria-hidden className="size-4" /> Ganti file
          </Tombol>
        </div>
      ) : (
        <Tombol varian="kedua" onClick={() => input.current?.click()} className="w-full justify-center border-dashed">
          <Upload aria-hidden className="size-5" /> Pilih file
        </Tombol>
      )}
      {galat ? (
        <p id="bukti-galat" role="alert" className="font-bold text-danger">
          {galat}
        </p>
      ) : null}
      <Tombol onClick={kirim} disabled={menunggu} aria-busy={menunggu} className="w-full">
        {menunggu ? "Mengirim…" : "Kirim bukti bayar"}
      </Tombol>
    </div>
  );
}

/** Batalkan booking selama bukti belum diunggah, dengan konfirmasi. */
export function TombolBatal({ bookingId }: { bookingId: string }) {
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galat, setGalat] = useState<string>();
  const [menunggu, mulai] = useTransition();

  if (!konfirmasi) {
    return (
      <Tombol varian="tautan" className="self-center" onClick={() => setKonfirmasi(true)}>
        Batalkan booking
      </Tombol>
    );
  }
  return (
    <div role="alertdialog" aria-labelledby="judul-batal" className="rounded-card-sm bg-danger-subtle p-4">
      <p id="judul-batal" className="font-display font-semibold">
        Batalkan booking ini?
      </p>
      <p className="mt-1 text-sm">Kursi akan dilepas untuk siswa lain. Pembatalan tidak bisa diurungkan.</p>
      {galat ? (
        <p role="alert" className="mt-2 text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Tombol
          varian="bahaya"
          disabled={menunggu}
          aria-busy={menunggu}
          onClick={() =>
            mulai(async () => {
              const hasil = await aksiBatalkanBooking(bookingId);
              if (hasil.galat) setGalat(hasil.galat);
            })
          }
        >
          Ya, batalkan
        </Tombol>
        <Tombol varian="kedua" onClick={() => setKonfirmasi(false)}>
          Tidak
        </Tombol>
      </div>
    </div>
  );
}
