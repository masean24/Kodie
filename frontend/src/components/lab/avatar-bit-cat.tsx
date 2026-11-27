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
  const dimensi = ukuran === "kecil" ? "size-8 p-1" : "size-12 p-1.5";
  return (
    <span
      aria-hidden="true"
      className={cx(
        dimensi,
        "grid shrink-0 place-items-center rounded-full border border-sky-soft bg-ice",
        className,
      )}
    >
      <svg
        viewBox="0 0 12 11"
        width="36"
        height="36"
        xmlns="http://www.w3.org/2000/svg"
        className="pixel-crisp size-full"
        aria-hidden="true"
      >
        {/* Telinga kucing runcing */}
        <rect x="3" y="0" width="1" height="1" fill="#0F172A" />
        <rect x="9" y="0" width="1" height="1" fill="#0F172A" />
        <rect x="3" y="1" width="2" height="1" fill="#0F172A" />
        <rect x="8" y="1" width="2" height="1" fill="#0F172A" />
        {/* Kepala gelap + mata lime menyala + hidung sky */}
        <rect x="3" y="2" width="7" height="4" fill="#0F172A" />
        <rect x="4" y="3" width="1" height="1" fill="#C6F64D" />
        <rect x="8" y="3" width="1" height="1" fill="#C6F64D" />
        <rect x="6" y="4" width="1" height="1" fill="#60A5FA" />
        {/* Badan royal blue + lencana dada lime */}
        <rect x="3" y="6" width="7" height="3" fill="#1D4ED8" />
        <rect x="6" y="7" width="1" height="1" fill="#C6F64D" />
        {/* Ekor melengkung berujung lime menyala */}
        <rect x="2" y="7" width="1" height="1" fill="#0F172A" />
        <rect x="1" y="6" width="1" height="1" fill="#0F172A" />
        <rect x="1" y="4" width="1" height="2" fill="#C6F64D" />
        {/* Dua kaki depan */}
        <rect x="3" y="9" width="2" height="2" fill="#0F172A" />
        <rect x="8" y="9" width="2" height="2" fill="#0F172A" />
      </svg>
    </span>
  );
}
