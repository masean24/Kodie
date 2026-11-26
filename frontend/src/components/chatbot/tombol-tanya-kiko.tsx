"use client";

import { MessageCircle } from "lucide-react";
import { AvatarKiko } from "./avatar-kiko";

/**
 * Pemicu inline untuk membuka dialog Asisten AI Kiko di halaman tanpa maskot melayang (mis. /program),
 * supaya akses bantuan tetap 1 klik tanpa menimpa kartu konten di viewport sempit.
 */
export function TombolTanyaKiko({
  ajakan = "Bingung memilih program yang cocok?",
}: {
  ajakan?: string;
}) {
  const buka = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("kodie:buka-kiko"));
    }
  };

  return (
    <button
      type="button"
      onClick={buka}
      className="inline-flex min-h-[48px] max-w-full flex-wrap items-center justify-center gap-2.5 rounded-full border-[1.5px] border-border-strong bg-surface px-4 py-2 text-left text-sm font-semibold text-text shadow-xs transition-colors hover:border-primary hover:bg-surface-sunken"
    >
      <AvatarKiko ukuran="kecil" />
      <span>{ajakan}</span>
      <span className="inline-flex items-center gap-1 font-display font-bold text-primary">
        <MessageCircle aria-hidden className="size-4 shrink-0" />
        Tanya Kiko AI
      </span>
    </button>
  );
}
