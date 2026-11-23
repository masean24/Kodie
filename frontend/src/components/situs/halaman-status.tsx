import { Kontainer } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { ObjekBidang } from "@/components/kategori";

/** Halaman 404 dan 403. */
export function HalamanStatus({ kode, judul, keterangan }: { kode: string; judul: string; keterangan: string }) {
  return (
    <Kontainer className="flex flex-col items-center py-16 text-center md:py-24">
      <div aria-hidden className="flex gap-4">
        <ObjekBidang bidang="software" ukuran={72} miring={-8} />
        <ObjekBidang bidang="iot" ukuran={72} miring={6} />
      </div>
      <p className="mt-8 font-display text-6xl font-extrabold text-primary">{kode}</p>
      <h1 className="mt-4 text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">{judul}</h1>
      <p className="mt-3 max-w-xl text-lg text-text-muted">{keterangan}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <TombolTautan href="/">Ke beranda</TombolTautan>
        <TombolTautan href="/kelas" varian="kedua">
          Lihat katalog kelas
        </TombolTautan>
      </div>
    </Kontainer>
  );
}
