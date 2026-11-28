import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import type { Bidang, Siswa } from "@/types/database";
import type { BookingRinci } from "@/lib/api/booking";
import { CATATAN_JEDA, JALUR_BELAJAR, langkahBerikutnya, type LangkahBerikutnya } from "@/lib/jalur-belajar";
import { TagProgram } from "@/components/kategori";
import { KartuBagian } from "./kartu-dashboard";
import { ChipAnak } from "./chip-anak";

type Saran = { anak: Pick<Siswa, "id" | "nama">; selesai: string; langkah: LangkahBerikutnya | null };

/**
 * Rekomendasi kelas lanjutan per anak setelah paket (atau trial) selesai, mengikuti jalur level di
 * `lib/jalur-belajar.ts` (saran pembimbing 2026-11-28: siswa tidak bingung harus ikut kelas apa).
 */
export function hitungSaranLanjutan(
  anak: Pick<Siswa, "id" | "nama" | "jenjang" | "kelas">[],
  booking: BookingRinci[],
  bidangRapor: Record<string, Bidang | undefined>,
): Saran[] {
  const hasil: Saran[] = [];
  for (const a of anak) {
    const terakhir = booking
      .filter((r) => r.booking.siswa_id === a.id && r.booking.status === "selesai" && r.kelas)
      .sort((x, y) => (y.kelas!.mulai_pada ?? "").localeCompare(x.kelas!.mulai_pada ?? ""))[0];
    if (!terakhir?.kelas) continue;
    const slug = terakhir.kelas.program_slug;
    const level = terakhir.kelas.level;
    if (!JALUR_BELAJAR.some((t) => t.slug === slug)) continue;
    // Selesai trial: langkah berikutnya adalah paket penuh di program dan level yang sama.
    const langkah =
      terakhir.booking.jenis === "trial"
        ? (() => {
            const t = JALUR_BELAJAR.find((x) => x.slug === slug)!;
            const l = t.level.find((x) => x.level === level) ?? t.level[0]!;
            return { slug, nama: t.nama, level: l.level, judul: l.judul, alasan: "Trial Sesi 1 selesai. Lanjutkan dengan paket 4 sesi penuh." };
          })()
        : langkahBerikutnya({ slug, level }, { jenjang: a.jenjang, kelas: a.kelas }, bidangRapor[a.id] ?? null);
    hasil.push({
      anak: { id: a.id, nama: a.nama },
      selesai: `${terakhir.kelas.program_nama} Level ${level}${terakhir.booking.jenis === "trial" ? " (trial)" : ""}`,
      langkah,
    });
  }
  return hasil;
}

export function KartuLangkahBerikutnya({ saran }: { saran: Saran[] }) {
  if (saran.length === 0) return null;
  return (
    <KartuBagian
      judul="Langkah berikutnya"
      id="judul-langkah"
      aksi={
        <Link href="/program#judul-jalur" className="inline-flex min-h-touch items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          <Route aria-hidden className="size-4" /> Lihat jalur belajar
        </Link>
      }
    >
      <ul className="flex flex-col gap-3">
        {saran.map((s) => (
          <li key={s.anak.id} className="flex flex-col gap-2 rounded-card-sm bg-surface-sunken p-4">
            <ChipAnak id={s.anak.id} nama={s.anak.nama} className="self-start" />
            <p className="text-sm text-text-muted">Selesai: {s.selesai}</p>
            {s.langkah ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <TagProgram slug={s.langkah.slug}>{s.langkah.nama}</TagProgram>
                  <p className="font-display font-semibold">
                    Level {s.langkah.level}: {s.langkah.judul}
                  </p>
                </div>
                <p className="text-sm">{s.langkah.alasan}</p>
                <Link
                  href={`/kelas?program=${s.langkah.slug}`}
                  className="inline-flex min-h-touch items-center gap-1.5 self-start font-display font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Cari jadwal {s.langkah.nama}
                  <span className="sr-only"> untuk {s.anak.nama}</span> <ArrowRight aria-hidden className="size-4" />
                </Link>
              </>
            ) : (
              <p className="text-sm">{CATATAN_JEDA}</p>
            )}
          </li>
        ))}
      </ul>
    </KartuBagian>
  );
}
