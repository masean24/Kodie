import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { StatusPengguna } from "@/types/database";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { LABEL_STATUS, NAMA_PERAN } from "@/lib/peran";
import { Catatan, Kartu, Kontainer, Lencana } from "@/components/ui/dasar";

const NADA_STATUS: Record<StatusPengguna, "sukses" | "peringatan" | "bahaya" | "netral"> = {
  aktif: "sukses",
  terverifikasi: "sukses",
  menunggu_persetujuan: "peringatan",
  menunggu_verifikasi: "peringatan",
  ditolak_orang_tua: "bahaya",
  ditolak: "bahaya",
  nonaktif: "netral",
};

const IKON = { sukses: CheckCircle2, peringatan: Clock, bahaya: AlertTriangle, netral: AlertTriangle };

/**
 * Dashboard sementara (Prompt 2): sapaan dan status akun.
 * Isi lengkap tiap dashboard dikerjakan di Prompt 3–7.
 */
export async function DashboardSementara({ children }: { children?: ReactNode }) {
  const p = await ambilPenggunaSaya();
  if (!p) return null;
  const nada = NADA_STATUS[p.status];
  const Ikon = IKON[nada];
  return (
    <Kontainer className="flex flex-col gap-6 py-10 md:py-12">
      <Kartu className="md:p-10">
        <p className="text-text-muted">{NAMA_PERAN[p.peran]}</p>
        <h1 className="mt-1 text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">Halo, {p.nama}</h1>
        <p className="mt-4 flex items-center gap-2">
          <span>Status akun:</span>
          <Lencana nada={nada === "netral" ? "netral" : nada}>
            <Ikon aria-hidden className="size-4" />
            {LABEL_STATUS[p.status]}
          </Lencana>
        </p>
      </Kartu>
      {children}
      <Catatan judul="Dashboard sedang disiapkan">
        Ringkasan sesi, booking, dan laporan akan tampil di sini.
      </Catatan>
    </Kontainer>
  );
}
