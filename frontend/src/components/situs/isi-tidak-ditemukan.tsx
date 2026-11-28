import { HalamanStatus } from "@/components/situs/halaman-status";
import { BarisKembali } from "@/components/situs/transisi-halaman";

/**
 * Isi halaman 404 tanpa kerangka situs. Dipakai `not-found.tsx` di dalam segmen yang layout-nya sudah
 * memasang `KerangkaSitus` (publik dan area peran), supaya header, footer, dan Kiko tidak tampil dua kali.
 * `app/not-found.tsx` (URL yang tidak cocok rute mana pun) tetap membungkusnya dengan kerangka sendiri.
 */
export function IsiTidakDitemukan() {
  return (
    <BarisKembali>
      <HalamanStatus
        kode="404"
        judul="Halaman tidak ditemukan"
        keterangan="Alamatnya mungkin salah ketik, atau halamannya sudah dipindah."
      />
    </BarisKembali>
  );
}
