import { Kerangka, StatusMemuat } from "@/components/ui/dasar";

export default function MemuatAdmin() {
  return (
    <div className="flex flex-col gap-6">
      <StatusMemuat label="Memuat halaman admin…" />
      <Kerangka className="h-12 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kerangka className="h-28" />
        <Kerangka className="h-28" />
        <Kerangka className="h-28" />
        <Kerangka className="h-28" />
        <Kerangka className="h-28" />
      </div>
      <Kerangka className="h-64" />
    </div>
  );
}
