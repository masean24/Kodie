import Link from "next/link";
import { LayoutGrid } from "lucide-react";

/** Logo sementara (KEPUTUSAN: logo belum final). */
export function Logo({ ringkasSaatMasukPonsel = false }: { ringkasSaatMasukPonsel?: boolean }) {
  return (
    <Link href="/" className="flex min-h-[44px] items-center gap-2 rounded-md font-display text-xl font-semibold text-text">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-primary text-primary-foreground">
        <LayoutGrid className="size-5" />
      </span>
      <span className={ringkasSaatMasukPonsel ? "max-sm:group-has-[[data-masuk]]/hdr:sr-only" : undefined}>Kodie</span>
    </Link>
  );
}
