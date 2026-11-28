import type { MetadataRoute } from "next";
import { POSISI } from "@/lib/karier";
import { fiturLanjutan } from "@/lib/api/sumber";

const SITUS = (process.env.NEXT_PUBLIC_SITE_URL || "https://kodie.xevora.me").replace(/\/$/, "");

/**
 * Program tetap sesuai PRD (slug sama dengan tabel `program`). Kenal Komputer (2026-11-28) baru masuk peta situs
 * setelah barisnya ada di backend, supaya mesin pencari tidak diarahkan ke halaman 404.
 */
const SLUG_PROGRAM = [
  ...(fiturLanjutan ? ["kenal-komputer"] : []),
  "coding-dasar",
  "kelas-reguler-teknologi",
  "simulasi-jurusan-it",
];

/** Peta situs halaman publik. Area login, persetujuan, dan API tidak dimasukkan. */
export default function sitemap(): MetadataRoute.Sitemap {
  const rute: { path: string; prioritas: number }[] = [
    { path: "", prioritas: 1 },
    { path: "/program", prioritas: 0.9 },
    ...SLUG_PROGRAM.map((s) => ({ path: `/program/${s}`, prioritas: 0.8 })),
    { path: "/kelas", prioritas: 0.9 },
    { path: "/tes-minat", prioritas: 0.8 },
    { path: "/lab", prioritas: 0.8 },
    { path: "/showcase", prioritas: 0.6 },
    { path: "/karier", prioritas: 0.6 },
    ...POSISI.map((p) => ({ path: `/karier/${p.slug}`, prioritas: 0.5 })),
    { path: "/kebijakan-privasi", prioritas: 0.4 },
    { path: "/daftar", prioritas: 0.5 },
    { path: "/masuk", prioritas: 0.3 },
  ];
  return rute.map((r) => ({ url: `${SITUS}${r.path}`, changeFrequency: "weekly", priority: r.prioritas }));
}
