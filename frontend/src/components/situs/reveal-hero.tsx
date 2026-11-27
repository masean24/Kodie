import { Fragment, type CSSProperties, type ReactNode } from "react";

/** Jumlah kata dalam teks, dipakai untuk menghitung jadwal reveal (`RevealHero`). */
export function jumlahKata(teks: string): number {
  return teks.split(" ").filter(Boolean).length;
}

/**
 * Pecah teks menjadi kata `.kata-hero` untuk reveal kata demi kata. Spasi tetap berupa teks biasa
 * agar pembaca layar membaca kalimat utuh dan baris bisa terlipat normal.
 *
 * `mulaiDari`: urutan kata pertama bila satu judul/paragraf dipecah ke beberapa `KataHero`
 * (mis. judul dengan sorotan di tengah), supaya jeda antarkata tetap berurutan.
 */
export function KataHero({ teks, mulaiDari = 0 }: { teks: string; mulaiDari?: number }) {
  const kata = teks.split(" ").filter(Boolean);
  return (
    <>
      {kata.map((k, i) => (
        <Fragment key={`${k}-${i}`}>
          {i > 0 ? " " : null}
          <span className="kata-hero inline-block" style={{ "--i": mulaiDari + i } as CSSProperties}>
            {k}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/**
 * Jadwal reveal hero/band, sama dengan timeline GSAP sebelumnya (detik, relatif terhadap paint pertama):
 * lencana 0–0,45 → kata judul mulai 0,30 (0,6 dtk per kata, jeda 0,09) → sorotan meletup 0,3 dtk sebelum
 * judul selesai → kata paragraf menyusul (0,4 dtk, jeda 0,022) → tombol aksi (jeda 0,1).
 */
function jadwal(kataJudul: number, kataTeks: number) {
  const judul = 0.3;
  const judulSelesai = judul + Math.max(kataJudul - 1, 0) * 0.09 + 0.6;
  const pil = judulSelesai - 0.3;
  const teks = pil + 0.55 - 0.3;
  const teksSelesai = teks + Math.max(kataTeks - 1, 0) * 0.022 + 0.4;
  const aksi = teksSelesai - 0.35;
  const dtk = (n: number) => `${Math.round(n * 1000)}ms`;
  return {
    "--rh-judul": dtk(judul),
    "--rh-pil": dtk(pil),
    "--rh-teks": dtk(teks),
    "--rh-aksi": dtk(aksi),
  } as CSSProperties;
}

/**
 * Entrance hero beranda dan band halaman: lencana muncul, judul terungkap kata demi kata, sorotan meletup,
 * paragraf menyusul kata demi kata, lalu tombol naik. Di beranda, ilustrasi kanan ikut masuk (orbit, empat
 * ubin, dua lencana).
 *
 * Animasi memakai CSS murni (blok HERO REVEAL di `globals.css`), bukan GSAP: berjalan sejak paint pertama
 * tanpa menunggu JavaScript dan hidrasi, sehingga teks hero (elemen LCP) tampil jauh lebih cepat.
 * Dengan `prefers-reduced-motion`, semuanya langsung tampil.
 */
export function RevealHero({
  children,
  className,
  kataJudul,
  kataTeks,
}: {
  children: ReactNode;
  className?: string;
  /** Jumlah kata `KataHero` di dalam `h1` (tanpa sorotan). */
  kataJudul: number;
  /** Jumlah kata `KataHero` di dalam paragraf. */
  kataTeks: number;
}) {
  return (
    <div className={className ? `reveal-hero ${className}` : "reveal-hero"} style={jadwal(kataJudul, kataTeks)}>
      {children}
    </div>
  );
}
