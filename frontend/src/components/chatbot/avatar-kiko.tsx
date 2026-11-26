"use client";

import { cx } from "@/lib/cx";
import { CHATBOT_AVATAR_CONFIG } from "./chatbot.config";

/**
 * Avatar kepala Kiko untuk header chat & gelembung balasan bot.
 * Mengikuti desain kepala monitor Kiko (antena lime, telinga & layar navy, casing biru, wajah ":)" lime).
 */
export function AvatarKiko({
  ukuran = "sedang",
  diatasBiru = false,
  className,
}: {
  ukuran?: "kecil" | "sedang";
  diatasBiru?: boolean;
  className?: string;
}) {
  const dimensi = ukuran === "kecil" ? "size-8" : "size-10";

  if (CHATBOT_AVATAR_CONFIG.mode === "image" && CHATBOT_AVATAR_CONFIG.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- aset lokal dari config statis
      <img
        src={CHATBOT_AVATAR_CONFIG.imageUrl}
        alt={CHATBOT_AVATAR_CONFIG.alt}
        className={cx(dimensi, "shrink-0 rounded-full bg-surface object-cover ring-1 ring-border", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cx(
        dimensi,
        "grid shrink-0 place-items-center rounded-full p-0.5",
        diatasBiru
          ? "border border-white/25 bg-white/15"
          : "border border-[#1D4ED8]/25 bg-[#F4F7FC] shadow-kartu dark:border-white/15 dark:bg-[#0F172A]",
        className,
      )}
    >
      <svg
        viewBox="42 6 256 226"
        width="40"
        height="40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="size-full overflow-visible"
      >
        <rect x="167" y="18" width="6" height="26" rx="3" fill="#0F172A" />
        <circle cx="170" cy="16" r="9" fill="#C6F64D" />
        <rect x="46" y="112" width="18" height="52" rx="9" fill="#0F172A" />
        <rect x="276" y="112" width="18" height="52" rx="9" fill="#0F172A" />
        <rect x="58" y="40" width="224" height="186" rx="44" fill="#1D4ED8" stroke={diatasBiru ? "#FFFFFF" : "none"} strokeWidth={diatasBiru ? "6" : "0"} />
        <rect x="78" y="60" width="184" height="146" rx="28" fill="#0F172A" />
        <circle cx="142" cy="124" r="10" fill="#C6F64D" />
        <circle cx="198" cy="124" r="10" fill="#C6F64D" />
        <path
          d="M142 152 Q170 178 198 152"
          fill="none"
          stroke="#C6F64D"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="252" cy="214" r="5" fill="#C6F64D" />
      </svg>
    </span>
  );
}
