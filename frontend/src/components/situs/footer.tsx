import Link from "next/link";
import { Kontainer } from "@/components/ui/dasar";

const KOLOM = [
  {
    judul: "Program",
    tautan: [
      { href: "/program/coding-dasar", label: "Coding Dasar" },
      { href: "/program/kelas-reguler-teknologi", label: "Kelas Reguler Teknologi" },
      { href: "/program/simulasi-jurusan-it", label: "Simulasi Jurusan IT" },
    ],
  },
  {
    judul: "Mulai",
    tautan: [
      { href: "/tes-minat", label: "Tes minat" },
      { href: "/kelas", label: "Katalog kelas" },
      { href: "/daftar", label: "Daftar jadi pengajar" },
    ],
  },
  {
    judul: "Bantuan",
    tautan: [{ href: "/kebijakan-privasi", label: "Kebijakan privasi" }],
  },
];

export function Footer() {
  return (
    <footer data-situs className="mt-auto bg-surface-sunken pt-16 pb-10">
      <Kontainer>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {KOLOM.map((k) => (
            <div key={k.judul}>
              <h2 className="font-display text-sm font-semibold">{k.judul}</h2>
              <ul className="mt-2">
                {k.tautan.map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className="flex min-h-touch items-center text-text-muted hover:text-primary hover:underline">
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p aria-hidden className="mt-12 font-display text-6xl font-extrabold tracking-tight text-primary md:text-8xl">
          Kodie
        </p>
        <p className="mt-6 text-sm text-text-muted">
          Karya lomba SEVENT X 2026 · SDG 4 dan SDG 8. Semua nama dan data di situs ini adalah contoh.
        </p>
      </Kontainer>
    </footer>
  );
}
