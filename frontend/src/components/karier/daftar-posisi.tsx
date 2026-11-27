"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight, Clock, GraduationCap, MapPin } from "lucide-react";
import type { Bidang } from "@/types/database";
import type { Posisi } from "@/lib/karier";
import { NAMA_BIDANG, URUTAN_BIDANG } from "@/lib/tes-minat";
import { cx } from "@/lib/cx";
import { TagBidang } from "@/components/kategori";

type Filter = Bidang | "semua";

/** Daftar lowongan pengajar dengan filter bidang. Kartu bergeser halus saat filter berubah. */
function IsiDaftarPosisi({ posisi }: { posisi: Posisi[] }) {
  const [filter, setFilter] = useState<Filter>("semua");
  const terlihat = filter === "semua" ? posisi : posisi.filter((p) => p.bidang === filter);
  const pilihan: { nilai: Filter; label: string; jumlah: number }[] = [
    { nilai: "semua", label: "Semua", jumlah: posisi.length },
    ...URUTAN_BIDANG.map((b) => ({ nilai: b, label: NAMA_BIDANG[b], jumlah: posisi.filter((p) => p.bidang === b).length })),
  ];

  return (
    <div>
      <div role="group" aria-label="Saring posisi menurut bidang" className="flex flex-wrap gap-2">
        {pilihan.map((o) => {
          const aktif = o.nilai === filter;
          return (
            <button
              key={o.nilai}
              type="button"
              aria-pressed={aktif}
              onClick={() => setFilter(o.nilai)}
              className={cx(
                "relative flex min-h-touch items-center gap-2 rounded-full border-[1.5px] px-4 text-base font-bold transition-colors",
                aktif ? "border-primary text-primary-foreground" : "border-border-strong bg-surface text-text hover:bg-surface-sunken",
              )}
            >
              {aktif ? (
                <motion.span
                  layoutId="filter-posisi"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                />
              ) : null}
              <span className="relative">{o.label}</span>
              <span
                className={cx(
                  "relative rounded-full px-2 text-sm",
                  aktif ? "bg-white/20" : "bg-surface-sunken text-text-muted",
                )}
              >
                {o.jumlah}
              </span>
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        {terlihat.length} posisi ditampilkan.
      </p>

      <motion.ul layout className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {terlihat.map((p) => (
            <motion.li
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="flex"
            >
              <KartuPosisi p={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

function KartuPosisi({ p }: { p: Posisi }) {
  return (
    <article className="group relative flex w-full flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-kartu transition-shadow hover:shadow-kartu-hover">
      <div className="flex items-center justify-between gap-3">
        <TagBidang bidang={p.bidang} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-3 py-0.5 text-sm font-bold text-success">
          <span aria-hidden className="size-2 rounded-full bg-success" />
          Dibuka
        </span>
      </div>
      <h3 className="text-xl font-bold leading-snug">
        <Link
          href={`/karier/${p.slug}`}
          className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none after:focus-visible:outline-3 after:focus-visible:outline-focus"
        >
          {p.judul}
        </Link>
      </h3>
      <p className="leading-relaxed text-text-muted">{p.ringkas}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
        <li className="inline-flex items-center gap-1.5">
          <GraduationCap aria-hidden className="size-4" />
          {p.jenjang}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden className="size-4" />
          Daring
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Clock aria-hidden className="size-4" />
          Paruh waktu
        </li>
      </ul>
      <span aria-hidden className="mt-auto inline-flex items-center gap-2 pt-2 font-display font-semibold text-primary">
        Lihat detail dan lamar
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </article>
  );
}

/** Motion dipakai lokal di sini (bukan di root layout) agar tidak dimuat di setiap halaman. */
export function DaftarPosisi({ posisi }: { posisi: Posisi[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <IsiDaftarPosisi posisi={posisi} />
    </MotionConfig>
  );
}
