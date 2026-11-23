"use client";

import { SimbolKodie } from "@/components/situs/logo";
import { cx } from "@/lib/cx";
import { CHATBOT_AVATAR_CONFIG } from "./chatbot.config";

/**
 * Avatar asisten Kiko. Memakai Simbol Resmi Kodie (`<>` berkedip & tersenyum)
 * sambil menunggu gambar maskot Kiko selesai, dan otomatis memakai gambar
 * bila `CHATBOT_AVATAR_CONFIG.mode` diganti ke "image".
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
  const dimensi = ukuran === "kecil" ? "size-7" : "size-9";

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
        "grid shrink-0 place-items-center rounded-full border",
        diatasBiru
          ? "border-white/25 bg-white/15"
          : "border-primary/20 bg-surface shadow-xs",
        className,
      )}
    >
      <SimbolKodie
        className={ukuran === "kecil" ? "h-4 min-w-[24px]" : "h-5 min-w-[24px]"}
        warnaKurung={diatasBiru ? "#FFFFFF" : "var(--color-primary)"}
        warnaMata={diatasBiru ? "#FFFFFF" : "var(--color-text)"}
        warnaSenyum="#C6F64D"
      />
    </span>
  );
}
