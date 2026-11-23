import { Kerangka, StatusMemuat } from "@/components/ui/dasar";

export default function MemuatMengajar() {
  return (
    <div className="flex flex-col gap-6">
      <StatusMemuat label="Memuat halaman pengajar…" />
      <Kerangka className="h-12 w-64" />
      <Kerangka className="h-44" />
      <Kerangka className="h-64" />
    </div>
  );
}
