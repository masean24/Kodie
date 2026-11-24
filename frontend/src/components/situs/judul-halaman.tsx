import type { ReactNode } from "react";
import { Kontainer } from "@/components/ui/dasar";
import { ObjekBidang } from "@/components/kategori";
import { cx } from "@/lib/cx";

/**
 * Band biru halaman publik dengan bahasa visual yang sama persis dengan hero beranda (`.hero-kodie`):
 * lebar dengan sisa tepi `sm:px-4 lg:px-6`, sudut bawah membulat, gradien navy ke biru, pola titik,
 * dan dua cahaya lembut. Isi diletakkan di atas lapisan dekorasi.
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
      <div className={cx("band-kodie on-block relative overflow-hidden rounded-b-[32px] shadow-xl md:rounded-b-block", className)}>
        <div aria-hidden className="pola-titik pointer-events-none absolute inset-0 opacity-80" />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-[#60a5fa]/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-10 size-[28rem] rounded-full bg-[#22d3ee]/15 blur-3xl" />
        {children}
      </div>
    </section>
  );
}

/** Band judul untuk halaman daftar (Program, Kelas, Tes minat). */
export function JudulHalaman({ judul, keterangan }: { judul: ReactNode; keterangan?: ReactNode }) {
  return (
    <BandKodie>
      <ObjekBidang bidang="software" ukuran={112} miring={-8} className="absolute -left-4 top-8 hidden lg:block" />
      <ObjekBidang bidang="iot" ukuran={84} miring={6} className="absolute left-[8%] top-[110px] hidden xl:block" />
      <ObjekBidang bidang="jaringan" ukuran={92} miring={8} className="absolute right-[8%] top-4 hidden xl:block" />
      <ObjekBidang bidang="ai_data" ukuran={104} miring={4} className="absolute -right-2 top-[120px] hidden lg:block" />
      <Kontainer className="relative py-12 text-center md:py-16">
        <h1 className="text-[30px] leading-[40px] font-extrabold tracking-tight sm:text-[38px] sm:leading-[48px] md:text-[46px] md:leading-[58px]">
          {judul}
        </h1>
        {keterangan ? (
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#dbeafe] md:text-lg">{keterangan}</p>
        ) : null}
      </Kontainer>
    </BandKodie>
  );
}
