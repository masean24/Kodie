import { HalamanStatus } from "@/components/situs/halaman-status";

/** 404 khusus profil pengajar: tautan lama bisa mati setelah pengajar mengganti username tautan profilnya. */
export default function PengajarTidakDitemukan() {
  return (
    <HalamanStatus
      kode="404"
      judul="Profil pengajar tidak ditemukan"
      keterangan="Pengajar mungkin sudah mengganti username tautan profilnya, atau profilnya belum terverifikasi. Cari pengajarnya lewat katalog kelas, atau minta tautan terbaru ke pengajar."
    />
  );
}
