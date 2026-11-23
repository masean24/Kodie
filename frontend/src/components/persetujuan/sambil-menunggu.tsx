import Link from "next/link";
import { Check } from "lucide-react";
import type { HasilMinat } from "@/types/database";
import { NAMA_BIDANG } from "@/lib/tes-minat";

/** Kartu "Sambil menunggu, kamu bisa:" (Figma 8. Dashboard siswa). */
export function SambilMenunggu({ hasil }: { hasil?: HasilMinat }) {
  return (
    <section aria-labelledby="judul-sambil" className="rounded-card bg-surface p-6 md:p-8">
      <h2 id="judul-sambil" className="text-xl font-semibold">
        Sambil menunggu, kamu bisa:
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        <li className="flex gap-2">
          <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
          <Link href="/kelas" className="text-primary underline-offset-4 hover:underline">
            Melihat katalog kelas dan jadwal
          </Link>
        </li>
        <li className="flex gap-2">
          <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
          <span>
            <Link href="/tes-minat" className="text-primary underline-offset-4 hover:underline">
              Mengerjakan tes minat
            </Link>
            {hasil ? `. Hasil terakhirmu: ${NAMA_BIDANG[hasil.bidang_teratas]}` : ""}
          </span>
        </li>
      </ul>
      <p className="mt-3 text-sm text-text-muted">Tombol Pesan kelas aktif setelah orang tuamu menyetujui.</p>
    </section>
  );
}
