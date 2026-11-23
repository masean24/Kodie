"use client";

import { useState, useTransition } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import type { LinkPersetujuan } from "@/types/database";
import { aksiBuatLink } from "@/lib/aksi/akun";
import { formatTanggalJam } from "@/lib/format";
import { linkPersetujuan, pesanPersetujuan, tautanWhatsApp } from "@/lib/persetujuan";
import { Tombol, kelasTombol } from "@/components/ui/tombol";

/** F2: buat link persetujuan, salin, dan kirim via WhatsApp. */
export function PanelLink({ namaSiswa }: { namaSiswa: string }) {
  const [link, setLink] = useState<LinkPersetujuan | null>(null);
  const [galat, setGalat] = useState<string>();
  const [tersalin, setTersalin] = useState(false);
  const [menunggu, mulai] = useTransition();

  const buat = () =>
    mulai(async () => {
      setGalat(undefined);
      setTersalin(false);
      const hasil = await aksiBuatLink();
      if ("galat" in hasil) setGalat(hasil.galat);
      else setLink(hasil.link);
    });

  const url = link ? linkPersetujuan(window.location.origin, link.token) : "";

  async function salin() {
    try {
      await navigator.clipboard.writeText(url);
      setTersalin(true);
    } catch {
      setGalat("Link belum bisa disalin otomatis. Pilih teks link, lalu salin manual.");
    }
  }

  return (
    <section aria-labelledby="judul-link" className="rounded-card bg-surface p-6 md:p-8">
      <h2 id="judul-link" className="text-2xl font-bold">
        Kirim link persetujuan ke orang tua
      </h2>
      <p className="mt-2 text-text-muted">
        Orang tuamu membuka link ini, membaca data yang kami simpan, lalu menekan Setujui. Link berlaku 7 hari dan hanya bisa
        dipakai sekali.
      </p>

      {galat ? (
        <p role="alert" className="mt-4 rounded-card-sm bg-danger-subtle p-4 font-bold text-danger">
          {galat}
        </p>
      ) : null}

      {link ? (
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="link-persetujuan" className="font-bold">
              Link persetujuan
            </label>
            <input
              id="link-persetujuan"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2 min-h-control w-full rounded-md bg-surface-sunken px-4 text-sm"
            />
            <p className="mt-2 text-sm text-text-muted">Berlaku sampai {formatTanggalJam(link.kedaluwarsa_pada)}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={tautanWhatsApp(pesanPersetujuan(namaSiswa, url, link.kedaluwarsa_pada))}
              target="_blank"
              rel="noopener noreferrer"
              className={kelasTombol("utama")}
            >
              <MessageCircle aria-hidden className="size-5" /> Kirim via WhatsApp
              <span className="sr-only"> (membuka tab baru)</span>
            </a>
            <Tombol varian="kedua" onClick={salin}>
              {tersalin ? <Check aria-hidden className="size-5" /> : <Copy aria-hidden className="size-5" />}
              {tersalin ? "Link tersalin" : "Salin link"}
            </Tombol>
            <Tombol varian="tautan" onClick={buat} disabled={menunggu}>
              Buat link baru
            </Tombol>
          </div>
          <p aria-live="polite" className="sr-only">
            {tersalin ? "Link tersalin" : ""}
          </p>
          <p className="text-sm text-text-muted">Membuat link baru membuat link sebelumnya tidak berlaku.</p>
        </div>
      ) : (
        <div className="mt-5">
          <Tombol onClick={buat} disabled={menunggu} aria-busy={menunggu} ukuran="lg">
            {menunggu ? "Membuat link…" : "Buat link persetujuan"}
          </Tombol>
          <p className="mt-3 text-sm text-text-muted">
            Demi keamanan, link hanya ditampilkan sekali. Kalau halaman ini ditutup, buat link baru. Link lama otomatis tidak
            berlaku.
          </p>
        </div>
      )}
    </section>
  );
}
