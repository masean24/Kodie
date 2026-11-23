import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CreditCard,
  GraduationCap,
  History,
  Settings,
  UserCheck,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { ambilRingkasanAdmin } from "@/lib/api/admin";
import { sapaan } from "@/components/area/kartu-dashboard";
import { Catatan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Dashboard admin" };

export default async function DashboardAdmin() {
  const ringkasan = await ambilRingkasanAdmin();
  const adaSesiTanpaMeet = (ringkasan.sesi_tanpa_meet ?? 0) > 0;
  const adaHonorBelumDibayar = (ringkasan.honor_belum_dibayar ?? 0) > 0;

  const statUtama = [
    {
      label: "Siswa aktif",
      nilai: ringkasan.siswa_aktif,
      ikon: Users,
      href: "/admin/kelas",
      ket: "Lihat kelas berjalan",
      sorot: false,
    },
    {
      label: "Kelas berjalan",
      nilai: ringkasan.kelas_berjalan,
      ikon: CalendarClock,
      href: "/admin/kelas",
      ket: "Kelola kelas & sesi",
      sorot: false,
    },
    {
      label: "Pembayaran menunggu",
      nilai: ringkasan.booking_menunggu_verifikasi,
      ikon: Wallet,
      href: "/admin/pembayaran",
      ket: "Periksa bukti bayar",
      sorot: ringkasan.booking_menunggu_verifikasi > 0,
    },
    {
      label: "Pengajar menunggu",
      nilai: ringkasan.pengajar_menunggu_verifikasi,
      ikon: UserCheck,
      href: "/admin/pengajar",
      ket: "Verifikasi dokumen",
      sorot: ringkasan.pengajar_menunggu_verifikasi > 0,
    },
    {
      label: "Laporan masalah baru",
      nilai: ringkasan.laporan_masalah_baru,
      ikon: AlertTriangle,
      href: "/admin/laporan-masalah",
      ket: "Tangani laporan masuk",
      sorot: ringkasan.laporan_masalah_baru > 0,
    },
  ];

  const menuCepat = [
    {
      href: "/admin/pembayaran",
      judul: "Verifikasi pembayaran",
      isi: "Periksa bukti transfer dan setujui atau tolak booking siswa.",
      ikon: CreditCard,
    },
    {
      href: "/admin/pengajar",
      judul: "Verifikasi pengajar",
      isi: "Tinjau KTP/KTM, SKCK, wawancara, dan program yang diajukan.",
      ikon: UserCheck,
    },
    {
      href: "/admin/laporan-masalah",
      judul: "Laporan masalah",
      isi: "Kategori perilaku tidak pantas diprioritaskan di paling atas.",
      ikon: AlertTriangle,
    },
    {
      href: "/admin/honor",
      judul: "Honor pengajar",
      isi: `${ringkasan.honor_belum_dibayar ?? 0} catatan honor menunggu ditandai dibayar.`,
      ikon: Wallet,
    },
    {
      href: "/admin/kelas",
      judul: "Kelas & link Meet",
      isi: "Ubah status/kapasitas kelas dan buat ulang link Meet yang gagal.",
      ikon: GraduationCap,
    },
    {
      href: "/admin/program",
      judul: "Program & tarif",
      isi: "Atur harga paket, tarif honor pengajar per sesi, dan status aktif.",
      ikon: BookOpen,
    },
    {
      href: "/admin/pengaturan",
      judul: "Rekening & QRIS",
      isi: "Perbarui bank tujuan transfer dan unggah gambar QRIS pembayaran.",
      ikon: Settings,
    },
    {
      href: "/admin/log",
      judul: "Log aksi admin",
      isi: "Riwayat 50 tindakan terbaru admin pada pembayaran, pengajar, dan data.",
      ikon: History,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">
          {sapaan(new Date())}, Admin
        </h1>
        <p className="mt-2 text-text-muted">
          Ringkasan operasional Kodie: verifikasi pembayaran, seleksi pengajar, laporan masalah, dan honor.
        </p>
      </div>

      {adaSesiTanpaMeet ? (
        <Catatan nada="peringatan" judul={`${ringkasan.sesi_tanpa_meet} sesi terjadwal belum punya link Google Meet`}>
          <p>Buka halaman Kelola kelas untuk membuat ulang link Meet bagi sesi yang terdampak.</p>
          <TombolTautan href="/admin/kelas" varian="kedua" className="mt-3">
            <Video aria-hidden className="size-4" /> Buka kelola kelas
          </TombolTautan>
        </Catatan>
      ) : null}

      {adaHonorBelumDibayar ? (
        <Catatan nada="info" judul={`${ringkasan.honor_belum_dibayar} honor pengajar siap diproses`}>
          <p>Tinjau daftar honor dari sesi yang telah dilaporkan dan tandai jika sudah ditransfer.</p>
          <TombolTautan href="/admin/honor" varian="kedua" className="mt-3">
            Kelola honor pengajar
          </TombolTautan>
        </Catatan>
      ) : null}

      <section aria-labelledby="judul-ringkasan" className="flex flex-col gap-3">
        <h2 id="judul-ringkasan" className="text-xl font-semibold">
          Ringkasan saat ini
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statUtama.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="group flex flex-col justify-between gap-3 rounded-card bg-surface p-5 transition-colors hover:bg-surface-sunken"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-text-muted">{s.label}</span>
                <s.ikon
                  aria-hidden
                  className={s.sorot ? "size-5 shrink-0 text-warning" : "size-5 shrink-0 text-primary"}
                />
              </div>
              <p className="font-display text-3xl font-bold tabular-nums">{s.nilai}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                {s.ket} <ArrowRight aria-hidden className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="judul-kelola" className="flex flex-col gap-3">
        <h2 id="judul-kelola" className="text-xl font-semibold">
          Pusat pengelolaan
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {menuCepat.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex flex-col justify-between gap-3 rounded-card bg-surface p-5 transition-colors hover:bg-surface-sunken"
            >
              <div className="flex flex-col gap-2">
                <m.ikon aria-hidden className="size-5 text-primary" />
                <h3 className="font-display text-lg font-semibold group-hover:underline">{m.judul}</h3>
                <p className="text-sm text-text-muted">{m.isi}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                Buka <ArrowRight aria-hidden className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
