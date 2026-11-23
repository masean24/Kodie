import Link from "next/link";
import { LayoutGrid } from "lucide-react";

/** Logo sementara (KEPUTUSAN: logo belum final). */
export function Logo() {
  return (
    <Link href="/" className="flex min-h-touch items-center gap-2 rounded-md font-display text-xl font-semibold">
      <span aria-hidden className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
        <LayoutGrid className="size-5" />
      </span>
      Kodie
    </Link>
  );
}
