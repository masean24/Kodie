import type { ReactNode } from "react";
import { Kontainer } from "@/components/ui/dasar";
import { ObjekBidang } from "@/components/kategori";

/** Band judul biru untuk halaman daftar (Katalog di Figma). */
export function JudulHalaman({ judul, keterangan }: { judul: ReactNode; keterangan?: ReactNode }) {
  return (
    <section className="blok-merek on-block relative overflow-hidden rounded-b-[32px] md:rounded-b-block">
      <ObjekBidang bidang="software" ukuran={112} miring={-8} className="absolute -left-4 top-8 hidden lg:block" />
      <ObjekBidang bidang="iot" ukuran={84} miring={6} className="absolute left-[8%] top-[110px] hidden xl:block" />
      <ObjekBidang bidang="jaringan" ukuran={92} miring={8} className="absolute right-[8%] top-4 hidden xl:block" />
      <ObjekBidang bidang="ai_data" ukuran={104} miring={4} className="absolute -right-2 top-[120px] hidden lg:block" />
      <Kontainer className="relative py-12 text-center md:py-16">
        <h1 className="text-[30px] leading-[40px] font-extrabold tracking-tight sm:text-[38px] sm:leading-[48px] md:text-[46px] md:leading-[58px]">
          {judul}
        </h1>
        {keterangan ? <p className="mx-auto mt-3 max-w-2xl text-base leading-7 md:text-lg">{keterangan}</p> : null}
      </Kontainer>
    </section>
  );
}
