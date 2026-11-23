import { KerangkaSitus } from "@/components/situs/kerangka-situs";
import { HalamanStatus } from "@/components/situs/halaman-status";

export default function TidakDitemukan() {
  return (
    <KerangkaSitus>
      <HalamanStatus
        kode="404"
        judul="Halaman tidak ditemukan"
        keterangan="Alamatnya mungkin salah ketik, atau halamannya sudah dipindah."
      />
    </KerangkaSitus>
  );
}
