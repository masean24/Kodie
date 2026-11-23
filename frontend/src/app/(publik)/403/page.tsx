import type { Metadata } from "next";
import { HalamanStatus } from "@/components/situs/halaman-status";

export const metadata: Metadata = { title: "Akses ditolak", robots: { index: false } };

export default function Halaman403() {
  return (
    <HalamanStatus
      kode="403"
      judul="Halaman ini bukan untuk akun Anda"
      keterangan="Anda tidak punya akses ke halaman ini. Kembali ke beranda atau masuk dengan akun yang sesuai."
    />
  );
}
