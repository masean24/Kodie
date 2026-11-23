import { Wallet } from "lucide-react";
import type { BookingRinci } from "@/lib/api/booking";
import { formatTanggalJam } from "@/lib/format";
import { TombolTautan } from "@/components/ui/tombol";

/** Kartu "booking perlu dibayar" di dashboard (Figma 7). Tidak tampil jika tidak ada. */
export function KartuPerluBayar({ daftar, basePath }: { daftar: BookingRinci[]; basePath: string }) {
  const perlu = daftar.filter((r) => r.booking.status === "menunggu_pembayaran");
  if (perlu.length === 0) return null;
  const r = [...perlu].sort((a, b) => a.booking.batas_bayar_pada.localeCompare(b.booking.batas_bayar_pada))[0];
  const kelas = r.kelas ? r.kelas.program_nama : "kelas";
  return (
    <section
      aria-labelledby="judul-perlu-bayar"
      className="flex flex-col gap-4 rounded-card bg-warning-subtle p-6 md:flex-row md:items-center"
    >
      <Wallet aria-hidden className="size-7 shrink-0 text-warning" />
      <div className="flex-1">
        <h2 id="judul-perlu-bayar" className="font-display text-lg font-semibold text-warning">
          {perlu.length} booking perlu dibayar
        </h2>
        <p className="mt-1">
          {kelas} untuk {r.siswa?.nama ?? "siswa"}. Bayar sebelum {formatTanggalJam(r.booking.batas_bayar_pada)}.
        </p>
      </div>
      <TombolTautan href={perlu.length === 1 ? `${basePath}/${r.booking.id}` : basePath}>Bayar sekarang</TombolTautan>
    </section>
  );
}
