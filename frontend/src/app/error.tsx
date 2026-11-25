"use client";

import { Kontainer, StateError } from "@/components/ui/dasar";
import { Tombol, TombolTautan } from "@/components/ui/tombol";

/**
 * Cadangan terakhir di bawah root layout: menangkap galat yang lolos dari error boundary grup
 * (misalnya galat di layout grup), sehingga pengguna tidak melihat layar kosong.
 */
export default function ErrorRoot({ retry }: { error: unknown; retry: () => void }) {
  return (
    <Kontainer className="py-16">
      <StateError
        judul="Halaman belum bisa dimuat"
        aksi={
          <div className="flex flex-wrap justify-center gap-3">
            <Tombol onClick={() => retry()}>Coba lagi</Tombol>
            <TombolTautan href="/" varian="kedua">
              Ke beranda
            </TombolTautan>
          </div>
        }
      />
    </Kontainer>
  );
}
