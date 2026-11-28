import Link from "next/link";
import { ArrowRight, Compass, Route } from "lucide-react";
import { CATATAN_JEDA, JALUR_BELAJAR } from "@/lib/jalur-belajar";
import { fiturLanjutan } from "@/lib/api/sumber";
import { TagProgram } from "@/components/kategori";
import { cx } from "@/lib/cx";

/**
 * Peta jalur belajar dari usia 5 sampai SMA: tiap program dibagi level (1 level = 1 paket = ±1 bulan), supaya
 * orang tua tahu langkah berikutnya setelah paket pertama selesai (saran pembimbing 2026-11-28).
 */
export function JalurBelajar({ slugTersedia }: { slugTersedia: string[] }) {
  const tahap = JALUR_BELAJAR.filter((t) => slugTersedia.includes(t.slug) && (!t.butuhFiturLanjutan || fiturLanjutan));
  if (tahap.length === 0) return null;
  const totalBulan = tahap.reduce((n, t) => n + t.level.length, 0);

  return (
    <section aria-labelledby="judul-jalur" className="mt-16" data-tanpa-animasi>
      <div className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-2 font-display text-sm font-bold text-primary">
          <Route aria-hidden className="size-4" /> Jalur belajar berkelanjutan
        </p>
        <h2 id="judul-jalur" className="font-display text-2xl font-extrabold md:text-32">
          Setelah 1 bulan, lanjut ke mana?
        </h2>
        <p className="max-w-3xl text-text-muted">
          Satu paket berisi 4 sesi (±1 bulan). Setiap program punya level berurutan, jadi setelah paket selesai, anak tinggal naik ke
          level berikutnya. Total {totalBulan} level dari usia 5 tahun sampai SMA. Dashboard orang tua menampilkan rekomendasi
          langkah berikutnya untuk setiap anak.
        </p>
      </div>

      <ol className="mt-8 flex flex-col gap-6">
        {tahap.map((t, i) => (
          <li key={t.slug} className="relative grid gap-4 rounded-card bg-surface p-6 shadow-kartu md:grid-cols-[260px_1fr] md:p-8">
            <div className="flex flex-col gap-2">
              <span className="font-display text-sm font-bold text-text-muted">Tahap {i + 1}</span>
              <TagProgram slug={t.slug}>{t.nama}</TagProgram>
              <p className="font-bold">{t.untuk}</p>
              <p className="text-sm text-text-muted">
                {t.level.length} level · ±{t.durasi}
              </p>
              <p className="text-sm leading-6">{t.tujuan}</p>
              <Link
                href={`/program/${t.slug}`}
                className="mt-1 inline-flex min-h-touch items-center gap-1.5 font-display font-semibold text-primary underline-offset-4 hover:underline"
              >
                Lihat program<span className="sr-only"> {t.nama}</span> <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ol className={cx("grid gap-3", t.level.length > 1 ? "sm:grid-cols-2 xl:grid-cols-3" : "")}>
              {t.level.map((l) => (
                <li key={l.level} className="flex flex-col gap-1 rounded-card-sm border border-border bg-surface-sunken p-4">
                  <span className="font-display text-sm font-bold text-primary">Level {l.level}</span>
                  <p className="font-display font-semibold">{l.judul}</p>
                  <p className="text-sm leading-6 text-text-muted">{l.fokus}</p>
                  <p className="mt-auto pt-1 text-sm">
                    <span className="font-bold">Hasil:</span> {l.hasil}
                  </p>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {tahap.some((t) => t.slug === "kenal-komputer") ? (
          <p className="rounded-card-sm bg-info-subtle p-5 text-sm leading-6">
            <span className="font-bold text-info">SD kelas 2–4: </span>
            {CATATAN_JEDA}{" "}
            <Link href="/lab" className="font-bold text-primary underline-offset-4 hover:underline">
              Buka Kodie Lab
            </Link>
          </p>
        ) : null}
        <p className="flex gap-3 rounded-card-sm bg-accent-subtle p-5 text-sm leading-6 text-text">
          <Compass aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>
            <span className="font-bold">Tertarik informatika tapi belum tahu bidangnya?</span> Kerjakan{" "}
            <Link href="/tes-minat" className="font-bold text-primary underline-offset-4 hover:underline">
              Tes Minat gratis
            </Link>
            , lalu ikuti Simulasi Jurusan IT. Rapornya menentukan level Kelas Reguler yang paling cocok untuk diperdalam.
          </span>
        </p>
      </div>
    </section>
  );
}
