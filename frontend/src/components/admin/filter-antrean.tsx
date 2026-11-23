"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, UserCheck, Wallet } from "lucide-react";
import type { AdminRingkasan } from "@/types/database";
import { Pilihan } from "@/components/ui/formulir";

/** Ringkasan 3 antrean utama di atas halaman antrean admin (Figma 11). */
export function RingkasanAntreanPills({ ringkasan }: { ringkasan: AdminRingkasan }) {
  const items = [
    {
      href: "/admin/pembayaran",
      jumlah: ringkasan.booking_menunggu_verifikasi,
      label: "Pembayaran menunggu",
      ikon: Wallet,
    },
    {
      href: "/admin/pengajar",
      jumlah: ringkasan.pengajar_menunggu_verifikasi,
      label: "Pengajar menunggu",
      ikon: UserCheck,
    },
    {
      href: "/admin/laporan-masalah",
      jumlah: ringkasan.laporan_masalah_baru,
      label: "Laporan masalah baru",
      ikon: AlertTriangle,
    },
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex min-h-[52px] items-center gap-3 rounded-md bg-surface px-4 py-2.5 transition-colors hover:bg-surface-sunken"
        >
          <item.ikon aria-hidden className="size-5 shrink-0 text-primary" />
          <span className="font-display text-2xl font-semibold tabular-nums">{item.jumlah}</span>
          <span className="text-sm text-text-muted">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

/** Kontrol saring status dan urutkan (PRD F14, Figma 11). */
export function FilterAntrean({
  status,
  urutan,
  opsiStatus,
  sembunyikanUrutan = false,
}: {
  status: string;
  urutan: string;
  opsiStatus: { nilai: string; label: string }[];
  sembunyikanUrutan?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const perbarui = (statusBaru: string, urutanBaru: string) => {
    const q = new URLSearchParams();
    if (statusBaru) q.set("status", statusBaru);
    if (!sembunyikanUrutan && urutanBaru) q.set("urutan", urutanBaru);
    router.push(`${pathname}?${q.toString()}`);
  };

  return (
    <div className="grid gap-4 sm:flex sm:flex-wrap">
      <Pilihan
        id="filter-status"
        label="Status"
        value={status}
        onChange={(e) => perbarui(e.target.value, urutan)}
        className="w-full sm:w-[260px]"
      >
        {opsiStatus.map((o) => (
          <option key={o.nilai} value={o.nilai}>
            {o.label}
          </option>
        ))}
      </Pilihan>
      {!sembunyikanUrutan ? (
        <Pilihan
          id="filter-urutan"
          label="Urutkan"
          value={urutan}
          onChange={(e) => perbarui(status, e.target.value)}
          className="w-full sm:w-[260px]"
        >
          <option value="terlama">Paling lama menunggu</option>
          <option value="terbaru">Terbaru</option>
        </Pilihan>
      ) : null}
    </div>
  );
}
