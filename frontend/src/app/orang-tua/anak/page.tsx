import type { Metadata } from "next";
import { ambilDaftarAnak, ambilHasilMinatTerbaru } from "@/lib/api/siswa";
import { ManajerAnak } from "@/components/anak/manajer-anak";

export const metadata: Metadata = { title: "Anak" };

export default async function HalamanAnak() {
  const anak = await ambilDaftarAnak();
  const hasilMinat = await ambilHasilMinatTerbaru(anak.map((a) => a.id));
  return (
    <div className="flex max-w-[864px] flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">Anak Anda</h1>
        <p className="mt-2 text-text-muted">
          Siswa SD dibuat dari sini. Siswa SMP dan SMA yang mendaftar sendiri muncul otomatis setelah Anda menyetujui link
          persetujuannya.
        </p>
      </div>
      <ManajerAnak anak={anak} hasilMinat={hasilMinat} />
    </div>
  );
}
