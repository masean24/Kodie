import type { Metadata } from "next";
import { ambilDaftarProgramAdmin } from "@/lib/api/admin";
import { FormProgramAdmin } from "@/components/admin/aksi-kelola";
import { StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Program & tarif" };

export default async function HalamanProgramAdmin() {
  const daftar = await ambilDaftarProgramAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-40 md:leading-[46px]">
          Program & tarif honor
        </h1>
        <p className="mt-2 text-text-muted">
          Sesuaikan harga paket, tarif honor pengajar per sesi, durasi, jumlah sesi, dan status aktif program.
        </p>
      </div>

      {daftar.length === 0 ? (
        <StateKosong judul="Belum ada data program" />
      ) : (
        <div className="flex flex-col gap-4">
          {daftar.map((program) => (
            <FormProgramAdmin key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
}
