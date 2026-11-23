import { Header } from "@/components/situs/header";
import { Footer } from "@/components/situs/footer";
import { HalamanStatus } from "@/components/situs/halaman-status";

export default function TidakDitemukan() {
  return (
    <>
      <Header />
      <main id="konten" tabIndex={-1} className="flex-1 focus:outline-none">
        <HalamanStatus
          kode="404"
          judul="Halaman tidak ditemukan"
          keterangan="Alamatnya mungkin salah ketik, atau halamannya sudah dipindah."
        />
      </main>
      <Footer />
    </>
  );
}
