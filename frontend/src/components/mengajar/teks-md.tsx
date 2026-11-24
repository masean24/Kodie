import type { ReactNode } from "react";

/**
 * Render Markdown inline yang aman untuk playbook: `kode`, **tebal**, dan *miring* / _miring_.
 * Teks dipecah menjadi elemen React (tanpa `dangerouslySetInnerHTML`), jadi tag HTML di dalam konten
 * seperti `<h1>` tampil sebagai teks biasa, bukan dieksekusi.
 */
const POLA = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

export function TeksMd({ teks }: { teks: string }) {
  const hasil: ReactNode[] = [];
  let akhir = 0;
  let i = 0;
  for (const m of teks.matchAll(POLA)) {
    const awal = m.index ?? 0;
    if (awal > akhir) hasil.push(teks.slice(akhir, awal));
    const t = m[0];
    if (t.startsWith("`")) {
      hasil.push(
        <code key={i++} className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.9em] text-primary">
          {t.slice(1, -1)}
        </code>,
      );
    } else if (t.startsWith("**")) {
      hasil.push(<strong key={i++}>{t.slice(2, -2)}</strong>);
    } else {
      hasil.push(<em key={i++}>{t.slice(1, -1)}</em>);
    }
    akhir = awal + t.length;
  }
  if (akhir < teks.length) hasil.push(teks.slice(akhir));
  return <>{hasil}</>;
}
