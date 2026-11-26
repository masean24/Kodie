import type { ReactNode } from "react";
import { Kontainer, Sorotan } from "@/components/ui/dasar";
import { ObjekBidang } from "@/components/kategori";
import { KataHero, RevealHero } from "@/components/situs/reveal-hero";
import { cx } from "@/lib/cx";
import { TombolKembali } from "@/components/situs/tombol-kembali";

/**
 * Band biru halaman publik dengan bahasa visual yang sama persis dengan hero beranda (`.hero-kodie`):
 * lebar dengan sisa tepi `sm:px-4 lg:px-6`, sudut bawah membulat, gradien navy ke biru, pola titik,
 * dan dua cahaya lembut. Isi diletakkan di atas lapisan dekorasi.
 *
 * `vt-band` memberi band nama view transition sendiri, jadi saat pindah halaman latar biru tetap diam
 * dan hanya konten yang beranimasi (lihat `globals.css`). Isi dibungkus `RevealHero`, sehingga elemen
 * bertanda `data-hero` dan kata `KataHero` muncul dengan animasi yang sama dengan hero beranda.
 */
export function BandKodie({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section aria-labelledby={labelledBy} className="px-0 sm:px-4 lg:px-6">
      <div className={cx("band-kodie vt-band on-block relative overflow-hidden rounded-b-[32px] shadow-mengambang md:rounded-b-block", className)}>
        <div aria-hidden className="pola-titik pointer-events-none absolute inset-0 opacity-80" />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-sky/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-10 size-[28rem] rounded-full bg-cyan/15 blur-3xl" />
        <Kontainer data-tanpa-animasi className="relative z-10 pt-4 md:pt-6">
          <TombolKembali diBlok />
        </Kontainer>
        <RevealHero className="contents">{children}</RevealHero>
      </div>
    </section>
  );
}

/** Lencana kecil di atas judul band, muncul pertama seperti lencana hero beranda. */
export function LencanaBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      data-hero="badge"
      className={cx("hero-muncul inline-flex rounded-full bg-white/15 px-4 py-1 text-sm font-bold ring-1 ring-white/40", className)}
    >
      {children}
    </p>
  );
}

/** Sorotan lime di judul band yang "meletup" setelah kata-kata judul, sama seperti pill "SD sampai SMA". */
export function SorotanBand({ children }: { children: string }) {
  return (
    <span data-hero="pil" className="hero-muncul inline-block">
      <Sorotan diBlok>{children}</Sorotan>
    </span>
  );
}

/** Band judul untuk halaman daftar (Program, Kelas, Tes minat). */
export function JudulHalaman({ judul, sorotan, keterangan }: { judul: string; sorotan?: string; keterangan?: string }) {
  return (
    <BandKodie>
      <ObjekBidang bidang="software" ukuran={112} miring={-8} className="absolute -left-4 top-[76px] hidden lg:block" />
      <ObjekBidang bidang="iot" ukuran={84} miring={6} className="absolute left-[8%] top-[110px] hidden xl:block" />
      <ObjekBidang bidang="jaringan" ukuran={92} miring={8} className="absolute right-[8%] top-4 hidden xl:block" />
      <ObjekBidang bidang="ai_data" ukuran={104} miring={4} className="absolute -right-2 top-[120px] hidden lg:block" />
      <Kontainer className="relative pb-12 pt-6 text-center md:pb-16 md:pt-8">
        <h1 className="text-32 leading-[40px] font-extrabold tracking-tight sm:text-40 sm:leading-[48px] md:text-48 md:leading-[58px]">
          <KataHero teks={judul} />
          {sorotan ? (
            <>
              {" "}
              <SorotanBand>{sorotan}</SorotanBand>
            </>
          ) : null}
        </h1>
        {keterangan ? (
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-ice md:text-lg">
            <KataHero teks={keterangan} />
          </p>
        ) : null}
      </Kontainer>
    </BandKodie>
  );
}
