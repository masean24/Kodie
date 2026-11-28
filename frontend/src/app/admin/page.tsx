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
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ambilRingkasanAdmin, ambilStatistikAdmin } from "@/lib/api/admin";
import { persenKonversiTrial } from "@/lib/admin";
import { sapaan } from "@/components/area/kartu-dashboard";
import { TagProgram } from "@/components/kategori";
import { Lencana } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { cx } from "@/lib/cx";
import { formatRupiah, formatTanggalJam, labelKelas } from "@/lib/format";
import { NAMA_PERAN } from "@/lib/peran";

export const metadata: Metadata = { title: "Dashboard admin" };

export default async function DashboardAdmin() {
  const [ringkasan, statistik] = await Promise.all([ambilRingkasanAdmin(), ambilStatistikAdmin()]);
  const adaSesiTanpaMeet = (ringkasan.sesi_tanpa_meet ?? 0) > 0;
  const adaHonorBelumDibayar = (ringkasan.honor_belum_dibayar ?? 0) > 0;

  const omzetKotor = statistik.pendapatan.omzet_kotor;
  const persenPlatform =
    omzetKotor > 0 ? Math.round((statistik.pendapatan.pendapatan_bersih_platform / omzetKotor) * 100) : 0;
  const persenPengajar = omzetKotor > 0 ? Math.max(0, 100 - persenPlatform) : 0;
  const konversiPersen = persenKonversiTrial(statistik.trial.konversi_paket, statistik.trial.total);

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

      <section aria-labelledby="judul-statistik" className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="judul-statistik" className="text-lg font-semibold">
            Statistik platform &amp; pendapatan
          </h2>
          <span className="text-sm text-text-muted">Ringkasan akun, bagi hasil 30–40%, dan trial gratis</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="kodie-kartu-lime flex flex-col justify-between gap-4 rounded-card bg-surface p-5 md:p-6 lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted">
                  <TrendingUp aria-hidden className="size-4 text-primary" />
                  Pendapatan bersih platform (60–70%)
                </p>
                <p className="kodie-teks-sorot-lime mt-1.5 font-display text-32 leading-tight font-extrabold tabular-nums">
                  {formatRupiah(statistik.pendapatan.pendapatan_bersih_platform)}
                </p>
              </div>
              <Lencana nada="info">{statistik.pendapatan.booking_lunas} paket lunas</Lencana>
            </div>

            <div>
              <div
                aria-label={`Proporsi platform ${persenPlatform}% dan pengajar ${persenPengajar}%`}
                className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken"
              >
                <div className="bg-primary transition-all" style={{ width: `${persenPlatform}%` }} />
                <div className="bg-success transition-all" style={{ width: `${persenPengajar}%` }} />
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Porsi platform {persenPlatform}% · Porsi pengajar {persenPengajar}% · Honor sudah dibayar{" "}
                <strong className="font-semibold text-text tabular-nums">
                  {formatRupiah(statistik.pendapatan.honor_dibayar)}
                </strong>
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-card-sm bg-surface-sunken p-3.5">
                <p className="text-xs font-medium text-text-muted">Omzet kotor</p>
                <p className="mt-1 font-display text-lg font-bold tabular-nums">
                  {formatRupiah(statistik.pendapatan.omzet_kotor)}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">Setelah potongan referral</p>
              </div>
              <div className="rounded-card-sm bg-surface-sunken p-3.5">
                <p className="text-xs font-medium text-text-muted">Bagian pengajar (30–40%)</p>
                <p className="mt-1 font-display text-lg font-bold tabular-nums">
                  {formatRupiah(statistik.pendapatan.bagian_pengajar)}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Honor tercatat {formatRupiah(statistik.pendapatan.honor_tercatat)}
                </p>
              </div>
              <div className="rounded-card-sm bg-surface-sunken p-3.5">
                <p className="inline-flex items-center gap-1 text-xs font-medium text-text-muted">
                  <Tag aria-hidden className="size-3.5" />
                  Kode referral dipakai
                </p>
                <p className="mt-1 font-display text-lg font-bold tabular-nums">
                  {statistik.pendapatan.booking_referral} paket
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  Diskon siswa {formatRupiah(statistik.pendapatan.total_potongan_referral)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-card bg-surface p-5 md:p-6 lg:col-span-5">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted">
                    <UserPlus aria-hidden className="size-4 text-primary" />
                    Pengguna terdaftar
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold tabular-nums">{statistik.pengguna.total} akun</p>
                </div>
                <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-semibold text-text-muted tabular-nums">
                  {statistik.pengguna.profil_siswa} profil siswa
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <div className="rounded-card-sm bg-surface-sunken p-3">
                  <p className="text-xs text-text-muted">Orang tua</p>
                  <p className="mt-0.5 font-display text-xl font-bold tabular-nums">
                    {statistik.pengguna.orang_tua}
                  </p>
                </div>
                <div className="rounded-card-sm bg-surface-sunken p-3">
                  <p className="text-xs text-text-muted">Siswa</p>
                  <p className="mt-0.5 font-display text-xl font-bold tabular-nums">
                    {statistik.pengguna.siswa_mandiri}
                  </p>
                </div>
                <div className="rounded-card-sm bg-surface-sunken p-3">
                  <p className="text-xs text-text-muted">Pengajar</p>
                  <p className="mt-0.5 font-display text-xl font-bold tabular-nums">
                    {statistik.pengguna.pengajar_terverifikasi}
                  </p>
                  {statistik.pengguna.pengajar_menunggu > 0 ? (
                    <p className="text-[11px] font-medium text-warning">
                      +{statistik.pengguna.pengajar_menunggu} antre
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted">
                  <Sparkles aria-hidden className="size-4 text-primary" />
                  Trial gratis Sesi 1
                </p>
                <Lencana nada={statistik.trial.konversi_paket > 0 ? "sukses" : "netral"}>
                  {konversiPersen}% lanjut paket
                </Lencana>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-2xl font-bold tabular-nums">{statistik.trial.total} peserta</p>
                <p className="text-sm text-text-muted">
                  {statistik.trial.konversi_paket} konversi · {statistik.trial.aktif} terjadwal ·{" "}
                  {statistik.trial.selesai} selesai
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-card bg-surface p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold">Pendaftar trial gratis terbaru</h3>
              <p className="text-sm text-text-muted">
                Siswa yang mencoba Sesi 1 gratis beserta status kelanjutan ke paket reguler.
              </p>
            </div>
            <Link
              href="/admin/kelas"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Kelola kelas <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>

          {statistik.trial.daftar_terbaru.length === 0 ? (
            <div className="mt-4 rounded-card-sm bg-surface-sunken p-4 text-sm text-text-muted">
              Belum ada pendaftar trial gratis Sesi 1 saat ini.
            </div>
          ) : (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-card-sm border border-border/60 md:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-surface-sunken text-text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Siswa</th>
                      <th className="px-4 py-3 font-semibold">Pemesan</th>
                      <th className="px-4 py-3 font-semibold">Kelas &amp; pengajar</th>
                      <th className="px-4 py-3 font-semibold">Jadwal Sesi 1</th>
                      <th className="px-4 py-3 text-right font-semibold">Status &amp; konversi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {statistik.trial.daftar_terbaru.map((item) => (
                      <tr key={item.booking_id} className="align-middle hover:bg-surface-sunken/50">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold">{item.siswa_nama}</p>
                          <p className="text-xs text-text-muted">
                            {labelKelas(item.siswa_jenjang, item.siswa_kelas)} · {item.kode}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium">{item.pemesan_nama}</p>
                          <p className="text-xs text-text-muted">{NAMA_PERAN[item.pemesan_peran]}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <TagProgram slug={item.program_slug}>{item.program_nama}</TagProgram>
                            <span className="text-xs text-text-muted">
                              Level {item.kelas_level} · {item.pengajar_nama}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-text-muted">
                          {item.sesi_1_mulai_pada ? formatTanggalJam(item.sesi_1_mulai_pada) : "Belum terjadwal"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            <Lencana nada={item.status === "selesai" ? "netral" : "info"}>
                              {item.status === "selesai" ? "Trial selesai" : "Terjadwal"}
                            </Lencana>
                            {item.sudah_lanjut_paket ? <Lencana nada="sukses">Lanjut paket</Lencana> : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:hidden">
                {statistik.trial.daftar_terbaru.map((item) => (
                  <div key={item.booking_id} className="flex flex-col gap-2 rounded-card-sm bg-surface-sunken p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.siswa_nama}</p>
                        <p className="text-xs text-text-muted">
                          {labelKelas(item.siswa_jenjang, item.siswa_kelas)} · Pemesan: {item.pemesan_nama} (
                          {NAMA_PERAN[item.pemesan_peran]})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Lencana nada={item.status === "selesai" ? "netral" : "info"}>
                          {item.status === "selesai" ? "Trial selesai" : "Terjadwal"}
                        </Lencana>
                        {item.sudah_lanjut_paket ? <Lencana nada="sukses">Lanjut paket</Lencana> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TagProgram slug={item.program_slug}>{item.program_nama}</TagProgram>
                      <span className="text-xs text-text-muted">
                        Level {item.kelas_level} · {item.pengajar_nama}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Sesi 1: {item.sesi_1_mulai_pada ? formatTanggalJam(item.sesi_1_mulai_pada) : "Belum terjadwal"} ·{" "}
                      {item.kode}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
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
