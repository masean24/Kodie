"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Bidang } from "@/types/database";
import { NAMA_BIDANG } from "@/lib/tes-minat";

/** Teks ringkas hasil tes minat untuk dibagikan ke orang tua (WhatsApp, catatan, dan sebagainya). */
export function teksRingkasan(teratas: Bidang, urut: Bidang[], skor: Record<Bidang, number>, program: string[]): string {
  const baris = [
    `Hasil tes minat Kodie: paling cocok di ${NAMA_BIDANG[teratas]}.`,
    `Skor: ${urut.map((b) => `${NAMA_BIDANG[b]} ${skor[b]}%`).join(", ")}.`,
  ];
  if (program.length > 0) baris.push(`Program yang disarankan: ${program.join(", lalu ")}.`);
  baris.push("Hasil ini saran, bukan keputusan.");
  return baris.join("\n");
}

/** Tombol salin ringkasan hasil, dengan konfirmasi singkat yang diumumkan pembaca layar. */
export function SalinRingkasan({ teks }: { teks: string }) {
  const [status, setStatus] = useState<"siap" | "disalin" | "gagal">("siap");

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teks);
      setStatus("disalin");
    } catch {
      setStatus("gagal");
    }
    window.setTimeout(() => setStatus("siap"), 2500);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={salin}
        className="inline-flex min-h-touch items-center gap-2 rounded-full border-[1.5px] border-border-strong bg-surface px-5 font-display font-semibold text-text hover:bg-surface-sunken"
      >
        {status === "disalin" ? <Check aria-hidden className="size-5 text-success" /> : <Copy aria-hidden className="size-5" />}
        Salin ringkasan hasil
      </button>
      <span aria-live="polite" className="text-sm text-text-muted">
        {status === "disalin"
          ? "Ringkasan disalin. Tempel di chat untuk dibahas bersama orang tua."
          : status === "gagal"
            ? "Browser menolak menyalin. Pilih teks hasil lalu salin manual."
            : ""}
      </span>
    </div>
  );
}
