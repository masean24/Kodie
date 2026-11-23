import { Kerangka, StatusMemuat } from "@/components/ui/dasar";

/**
 * Kerangka isi halaman area login. Dipakai `loading.tsx` di setiap folder halaman area, agar navigasi
 * antarhalaman di dalam layout area yang sama langsung menampilkan kerangka (Next.js instant navigation),
 * bukan menunggu server dulu.
 */
export function KerangkaHalamanArea() {
  return (
    <div className="flex flex-col gap-6">
      <StatusMemuat />
      <Kerangka className="h-12 w-64" />
      <Kerangka className="h-40" />
      <Kerangka className="h-64" />
    </div>
  );
}
