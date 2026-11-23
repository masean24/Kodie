"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Printer, Video } from "lucide-react";
import { aksiMasukSesi } from "@/lib/aksi/mengajar";
import { Tombol } from "@/components/ui/tombol";

/**
 * Tombol Masuk kelas (PRD F8): memanggil RPC `link_masuk_sesi` di server lalu membuka Google Meet.
 * Aktif mulai 15 menit sebelum sesi sampai sesi berakhir.
 */
export function TombolMasukKelas({
  sesiId,
  aktif,
  varian = "utama",
  ukuran = "md",
  className,
}: {
  sesiId: string;
  aktif: boolean;
  varian?: "utama" | "kedua";
  ukuran?: "md" | "lg";
  className?: string;
}) {
  const [menunggu, mulai] = useTransition();
  const [galat, setGalat] = useState<string>();
  const [meetUrl, setMeetUrl] = useState<string>();

  const buka = () =>
    mulai(async () => {
      setGalat(undefined);
      const res = await aksiMasukSesi(sesiId);
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
    <div className={className ? "flex flex-col gap-2" : "inline-flex flex-col gap-2"}>
      <Tombol
        varian={varian}
        ukuran={ukuran}
        disabled={!aktif || menunggu}
        aria-busy={menunggu}
        onClick={buka}
        className={className}
        title={aktif ? undefined : "Tombol aktif 15 menit sebelum sesi dimulai"}
      >
        <Video aria-hidden className="size-5" />
        {menunggu ? "Mempersiapkan…" : "Masuk kelas"}
      </Tombol>
      {meetUrl ? (
        <a
          href={meetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink aria-hidden className="size-4" /> Buka tautan Meet jika tab belum terbuka
        </a>
      ) : null}
      {galat ? (
        <p role="alert" className="text-sm font-bold text-danger">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

/** Tombol cetak atau simpan PDF untuk playbook (PRD F9, Figma 10). */
export function TombolCetak({ className }: { className?: string }) {
  return (
    <Tombol varian="kedua" onClick={() => window.print()} className={className}>
      <Printer aria-hidden className="size-5" />
      Cetak atau simpan PDF
    </Tombol>
  );
}
