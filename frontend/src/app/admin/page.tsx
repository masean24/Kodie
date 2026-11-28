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
  type LucideIcon,
} from "lucide-react";
import { ambilRingkasanAdmin } from "@/lib/api/admin";
import { sapaan } from "@/components/area/kartu-dashboard";
import { TombolTautan } from "@/components/ui/tombol";
import { cx } from "@/lib/cx";

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
    <div data-akar-area className="flex flex-col gap-6">
      <div className="kodie-blok-sorot rounded-card p-6 md:px-7 md:py-6">
        <span aria-hidden className="mb-2 inline-block h-1.5 w-8 rounded-full bg-lime" />
        <h1 className="text-32 leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">
          {sapaan(new Date())}, Admin
        </h1>
        <p className="mt-1.5 text-white/85">
          Ringkasan operasional Kodie: verifikasi pembayaran, seleksi pengajar, laporan masalah, dan honor.
        </p>
      </div>

      {adaSesiTanpaMeet || adaHonorBelumDibayar ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {adaSesiTanpaMeet ? (
            <StripPeringatan
              nada="peringatan"
              ikon={Video}
              judul={`${ringkasan.sesi_tanpa_meet} sesi belum punya link Meet`}
              isi="Buat ulang tautan Google Meet di halaman Kelola kelas."
              href="/admin/kelas"
              aksi="Kelola kelas"
            />
          ) : null}
          {adaHonorBelumDibayar ? (
            <StripPeringatan
              nada="info"
              ikon={Wallet}
              judul={`${ringkasan.honor_belum_dibayar} honor pengajar siap diproses`}
              isi="Tinjau daftar honor sesi dan tandai yang sudah ditransfer."
              href="/admin/honor"
              aksi="Kelola honor"
            />
          ) : null}
        </div>
      ) : null}

      <section aria-labelledby="judul-ringkasan" className="flex flex-col gap-3">
        <h2 id="judul-ringkasan" className="text-lg font-semibold">
          Ringkasan saat ini
        </h2>
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-6 xl:grid-cols-5">
          {statUtama.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className={cx(
                "group flex flex-col justify-between gap-2.5 rounded-card bg-surface p-4 transition-colors hover:bg-surface-sunken xl:col-span-1",
                i < 2 ? "lg:col-span-3" : "lg:col-span-2",
                i === statUtama.length - 1 && "col-span-2 sm:col-span-1",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm leading-snug font-medium text-text-muted">{s.label}</span>
                <span
                  aria-hidden
                  data-sorot={s.sorot ? "" : undefined}
                  className="kodie-kpi-ikon grid size-8 shrink-0 place-items-center rounded-lg"
                >
                  <s.ikon className="size-4" />
                </span>
              </div>
              <p className="font-display text-3xl font-bold tabular-nums">{s.nilai}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                {s.ket} <ArrowRight aria-hidden className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="judul-kelola" className="flex flex-col gap-3">
        <h2 id="judul-kelola" className="text-lg font-semibold">
          Pusat pengelolaan
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {menuCepat.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex flex-col justify-between gap-3 rounded-card bg-surface p-4 transition-colors hover:bg-surface-sunken"
            >
              <div className="flex flex-col gap-2">
                <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary-subtle text-primary">
                  <m.ikon className="size-4" />
                </span>
                <h3 className="font-display text-base font-semibold group-hover:underline">{m.judul}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{m.isi}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Buka <ArrowRight aria-hidden className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Strip pemberitahuan ringkas (gaya explorer Soft): ikon, judul berwarna, keterangan, dan tombol kecil. */
function StripPeringatan({
  nada,
  ikon: Ikon,
  judul,
  isi,
  href,
  aksi,
}: {
  nada: "peringatan" | "info";
  ikon: LucideIcon;
  judul: string;
  isi: string;
  href: string;
  aksi: string;
}) {
  const warna =
    nada === "peringatan"
      ? { kotak: "border-warning/25 bg-warning-subtle", ikon: "bg-warning/15 text-warning", judul: "text-warning" }
      : { kotak: "border-info/25 bg-info-subtle", ikon: "bg-info/15 text-info", judul: "text-info" };
  return (
    <div
      className={cx("flex flex-wrap items-center justify-between gap-3 rounded-card-sm border px-4 py-3.5", warna.kotak)}
    >
      <div className="flex min-w-[min(100%,240px)] flex-1 items-start gap-3">
        <span aria-hidden className={cx("grid size-8 shrink-0 place-items-center rounded-lg", warna.ikon)}>
          <Ikon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className={cx("font-display text-[15px] font-semibold", warna.judul)}>{judul}</p>
          <p className="mt-0.5 text-sm text-text-muted">{isi}</p>
        </div>
      </div>
      <TombolTautan href={href} varian="kedua" className="shrink-0 px-4 text-sm">
        {aksi}
      </TombolTautan>
    </div>
  );
}
