import type { Metadata } from "next";
import { ambilPengaturanAdmin } from "@/lib/api/admin";
import { FormPengaturanAdmin } from "@/components/admin/aksi-kelola";

export const metadata: Metadata = { title: "Pengaturan rekening & QRIS" };

export default async function HalamanPengaturanAdmin() {
  const awal = await ambilPengaturanAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[46px]">
          Pengaturan rekening & QRIS
        </h1>
        <p className="mt-2 text-text-muted">
          Rekening bank dan gambar QRIS ini tampil di halaman pembayaran orang tua dan siswa saat membuat booking.
        </p>
      </div>

      <FormPengaturanAdmin awal={awal} />
    </div>
  );
}
