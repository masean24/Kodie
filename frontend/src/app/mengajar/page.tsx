import type { Metadata } from "next";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { DashboardSementara } from "@/components/area/dashboard-sementara";
import { Catatan } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Dashboard pengajar" };

export default async function DashboardPengajar() {
  const p = await ambilPenggunaSaya();
  return (
    <DashboardSementara>
      {p?.status === "menunggu_verifikasi" ? (
        <Catatan nada="peringatan" judul="Akun Anda sedang diverifikasi admin">
          Lengkapi foto profil, kartu identitas (KTP atau KTM), SKCK, dan program yang ingin diajar di halaman profil.
          Admin juga akan menjadwalkan wawancara. Setelah disetujui, Anda bisa membuka kelas.
        </Catatan>
      ) : null}
      {p?.status === "ditolak" ? (
        <Catatan nada="peringatan" judul="Pendaftaran pengajar ditolak">
          Alasan penolakan dari admin akan tampil di halaman profil.
        </Catatan>
      ) : null}
    </DashboardSementara>
  );
}
