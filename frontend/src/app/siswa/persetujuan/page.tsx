import type { Metadata } from "next";
import { Catatan, Kartu, Kontainer } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Persetujuan orang tua" };

/** Sementara. Link persetujuan, salin, dan kirim via WhatsApp dikerjakan di Prompt 3 (F2). */
export default function HalamanPersetujuan() {
  return (
    <Kontainer className="max-w-[784px] py-10 md:py-12">
      <Kartu className="md:p-10">
        <h1 className="text-[32px] leading-[38px] font-extrabold">Minta persetujuan orang tua</h1>
        <p className="mt-3 text-lg">
          Akunmu aktif setelah orang tua menyetujui lewat link khusus. Kamu akan mengirim link itu sendiri, lewat WhatsApp
          atau salin link.
        </p>
      </Kartu>
      <div className="mt-6">
        <Catatan nada="peringatan" judul="Halaman ini sedang disiapkan">
          Tombol pembuat link persetujuan akan tersedia di sini.
        </Catatan>
      </div>
    </Kontainer>
  );
}
