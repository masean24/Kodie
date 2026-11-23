import type { ReactNode } from "react";
import { Kontainer } from "@/components/ui/dasar";
import { ObjekBidang } from "@/components/kategori";

/** Band judul biru untuk halaman daftar (Katalog di Figma). */
export function JudulHalaman({ judul, keterangan }: { judul: ReactNode; keterangan?: ReactNode }) {
  return (
    <section className="blok-merek on-block relative overflow-hidden rounded-b-[32px] md:rounded-b-block">
      <ObjekBidang bidang="software" ukuran={112} miring={-8} className="absolute -left-4 top-8 hidden lg:block" />
      <ObjekBidang bidang="iot" ukuran={84} miring={6} className="absolute left-[14%] top-[110px] hidden lg:block" />
      <ObjekBidang bidang="jaringan" ukuran={92} miring={8} className="absolute right-[12%] top-4 hidden lg:block" />
      <ObjekBidang bidang="ai_data" ukuran={104} miring={4} className="absolute -right-2 top-[120px] hidden lg:block" />
      <Kontainer className="relative py-12 text-center md:py-16">
        <h1 className="text-[36px] leading-[42px] font-extrabold md:text-[60px] md:leading-[64px]">{judul}</h1>
        {keterangan ? <p className="mx-auto mt-3 max-w-2xl text-lg">{keterangan}</p> : null}
      </Kontainer>
    </section>
  );
}
