import { cx } from "@/lib/cx";

/**
 * Avatar SVG piksel Bit-Cat Mentor, serasi dengan sprite Bit-Cat di footer situs.
 * Warna piksel disamakan dengan seni piksel footer (pengecualian resmi dari token CSS).
 */
export function AvatarBitCat({
  ukuran = "sedang",
  className,
}: {
  ukuran?: "kecil" | "sedang";
  className?: string;
}) {
  const dimensi = ukuran === "kecil" ? "size-7" : "size-10";
  return (
    <span
      aria-hidden="true"
      className={cx(
        dimensi,
        "grid shrink-0 place-items-center rounded-full border border-border-strong bg-surface-sunken p-1",
        className,
      )}
    >
      <svg
        viewBox="0 0 10 9"
        width="32"
        height="32"
        xmlns="http://www.w3.org/2000/svg"
        className="pixel-crisp size-full"
        aria-hidden="true"
      >
        <rect x="3" y="1" width="1" height="2" fill="#0F172A" />
        <rect x="7" y="1" width="1" height="2" fill="#0F172A" />
        <rect x="3" y="2" width="6" height="4" fill="#0F172A" />
        <rect x="5" y="3" width="1" height="1" fill="#C6F64D" />
        <rect x="7" y="3" width="1" height="1" fill="#C6F64D" />
        <rect x="2" y="5" width="6" height="2" fill="#1D4ED8" />
        <rect x="1" y="3" width="1" height="2" fill="#C6F64D" />
        <rect x="2" y="7" width="2" height="2" fill="#0F172A" />
        <rect x="6" y="7" width="2" height="1" fill="#0F172A" />
      </svg>
    </span>
  );
}
