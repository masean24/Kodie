"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Clock, ExternalLink, Eye } from "lucide-react";
import type { Playbook } from "@/types/database";
import { uraiKontenPlaybook } from "@/lib/mengajar";
import { cx } from "@/lib/cx";
import { Catatan } from "@/components/ui/dasar";
import { TeksMd } from "./teks-md";

/**
 * Konten 2-kolom Teaching Playbook (PRD F9, Figma "Pengajar · playbook").
 * Kunci jawaban berupa disclosure di layar, dan selalu tampil saat dicetak/simpan PDF.
 */
export function TampilanPlaybook({ playbook, durasiMenit }: { playbook: Playbook; durasiMenit: number }) {
  const [lihatKunci, setLihatKunci] = useState(false);
  const bagian = uraiKontenPlaybook(playbook.konten_md);

  return (
    // Saat dicetak, kolom samping (persiapan, alat, catatan keamanan) turun ke bawah selebar halaman
    // supaya materi utama tidak menyempit (AUD-NFN-01). Isinya tetap ikut tercetak.
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] print:grid-cols-1">
      <div className="flex flex-col gap-5">
        {bagian.tujuan ? (
          <section aria-labelledby="pb-tujuan" className="rounded-card bg-surface p-6">
            <h2 id="pb-tujuan" className="text-xl font-semibold">
              Tujuan sesi
            </h2>
            {bagian.tujuanBaris.filter((b) => !b.nomor).map((b, i) => (
              <p key={i} className="mt-3 text-lg leading-[29px]">
                <TeksMd teks={b.teks} />
              </p>
            ))}
            {bagian.tujuanBaris.some((b) => b.nomor) ? (
              <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-6 text-lg leading-[29px]">
                {bagian.tujuanBaris
                  .filter((b) => b.nomor)
                  .map((b, i) => (
                    <li key={i}>
                      <TeksMd teks={b.teks} />
                    </li>
                  ))}
              </ol>
            ) : null}
          </section>
        ) : null}

        {bagian.alur.length > 0 ? (
          <section aria-labelledby="pb-alur" className="rounded-card bg-surface p-6">
            <h2 id="pb-alur" className="flex items-center gap-3 text-xl font-semibold">
              <Clock aria-hidden className="size-6 shrink-0 text-primary" />
              Alur sesi ({durasiMenit} menit)
            </h2>
            <ol className="mt-4 flex flex-col gap-4">
              {bagian.alur.map((seg, idx) => (
                <li key={`${seg.waktu}-${idx}`} className="flex items-start gap-4">
                  <span
                    className={cx(
                      "w-20 shrink-0 rounded-md px-2 py-2 text-center font-bold tabular-nums",
                      seg.utama ? "bg-primary text-primary-foreground" : "bg-primary-subtle text-primary",
                    )}
                  >
                    {seg.waktu}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      <TeksMd teks={seg.judul} />
                    </p>
                    {seg.deskripsi ? (
                      <p className="mt-0.5 text-text-muted">
                        <TeksMd teks={seg.deskripsi} />
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {bagian.tantangan || bagian.kunciJawaban ? (
          <section aria-labelledby="pb-tantangan" className="rounded-card bg-surface p-6">
            <h2 id="pb-tantangan" className="text-xl font-semibold">
              Tantangan untuk siswa
            </h2>
            {bagian.tantangan ? (
              <p className="mt-3">
                <TeksMd teks={bagian.tantangan} />
              </p>
            ) : null}
            {bagian.kunciJawaban ? (
              <div className="mt-4">
                <button
                  type="button"
                  aria-expanded={lihatKunci}
                  aria-controls="isi-kunci-jawaban"
                  onClick={() => setLihatKunci((v) => !v)}
                  className="tanpa-cetak flex min-h-control w-full items-center gap-3 rounded-md bg-surface-sunken px-4 py-3 text-left font-bold transition-colors hover:bg-primary-subtle"
                >
                  <Eye aria-hidden className="size-5 shrink-0 text-primary" />
                  <span className="flex-1">{lihatKunci ? "Sembunyikan kunci jawaban" : "Tampilkan kunci jawaban"}</span>
                  {lihatKunci ? <ChevronUp aria-hidden className="size-5 shrink-0" /> : <ChevronDown aria-hidden className="size-5 shrink-0" />}
                </button>
                <div
                  id="isi-kunci-jawaban"
                  className={cx("mt-3 rounded-md border border-border bg-surface-sunken p-4", !lihatKunci && "hanya-cetak")}
                >
                  <p className="text-sm font-bold text-primary">Kunci jawaban</p>
                  <ul className="mt-1 flex flex-col gap-1.5">
                    {bagian.kunciJawaban.split("\n").map((b, i) => (
                      <li key={i}>
                        <TeksMd teks={b} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {bagian.tambahan.map((t) => (
          <section key={t.judul} className="rounded-card bg-surface p-6">
            <h2 className="text-xl font-semibold">{t.judul}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {t.baris.map((b, i) => (
                <li key={i}>
                  <TeksMd teks={b} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="flex flex-col gap-5">
        {bagian.persiapan.length > 0 ? (
          <section aria-labelledby="pb-persiapan" className="rounded-card bg-surface p-6">
            <h2 id="pb-persiapan" className="text-xl font-semibold">
              Persiapan sebelum kelas
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {bagian.persiapan.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-1 size-5 shrink-0 text-success" />
                  <span>
                    <TeksMd teks={item} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {bagian.alat.length > 0 || playbook.starter_url ? (
          <section aria-labelledby="pb-alat" className="rounded-card bg-surface p-6">
            <h2 id="pb-alat" className="text-xl font-semibold">
              Alat dan starter
            </h2>
            {bagian.alat.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {bagian.alat.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <ExternalLink aria-hidden className="mt-1 size-4 shrink-0 text-primary" />
                    <span>
                      <TeksMd teks={a} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {playbook.starter_url ? (
              <a
                href={playbook.starter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="tanpa-cetak mt-4 inline-flex min-h-touch items-center gap-2 font-display font-semibold text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink aria-hidden className="size-4" /> Buka tautan starter
              </a>
            ) : null}
          </section>
        ) : null}

        <Catatan nada="peringatan" judul="Catatan keamanan">
          <p>
            <TeksMd
              teks={
                bagian.catatanKeamanan ||
                "Jangan minta nomor HP atau akun media sosial siswa. Semua komunikasi lewat kelas dan laporan."
              }
            />
          </p>
        </Catatan>
      </aside>
    </div>
  );
}
