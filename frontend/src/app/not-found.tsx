import { KerangkaSitus } from "@/components/situs/kerangka-situs";
import { HalamanStatus } from "@/components/situs/halaman-status";
import { BarisKembali } from "@/components/situs/transisi-halaman";

export default function TidakDitemukan() {
  return (
    <KerangkaSitus>
      <BarisKembali>
        <HalamanStatus
          kode="404"
          judul="Halaman tidak ditemukan"
          keterangan="Alamatnya mungkin salah ketik, atau halamannya sudah dipindah."
        />
      </BarisKembali>
    </KerangkaSitus>
  );
}
