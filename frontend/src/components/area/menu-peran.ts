import {
  AlertTriangle,
  Banknote,
  Blocks,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Peran } from "@/types/database";

export type ItemMenu = {
  href: string;
  label: string;
  labelPonsel?: string;
  utamaPonsel?: boolean;
  ikon: LucideIcon;
};

/**
 * Menu per peran (Figma `RoleNav` 9:849: sidebar di desktop, tab bar bawah di ponsel).
 * Modul biasa (bukan "use client") supaya bisa dibaca Server Component.
 */
export const MENU_PERAN: Partial<Record<Peran, ItemMenu[]>> = {
  orang_tua: [
    { href: "/orang-tua", label: "Ringkasan", ikon: LayoutDashboard },
    { href: "/orang-tua/anak", label: "Anak", ikon: Users },
    { href: "/orang-tua/booking", label: "Booking", ikon: Wallet },
    { href: "/orang-tua/rapor", label: "Rapor", ikon: FileText },
  ],
  siswa: [
    { href: "/siswa", label: "Ringkasan", ikon: LayoutDashboard },
    { href: "/siswa/persetujuan", label: "Persetujuan", ikon: ShieldCheck },
    { href: "/siswa/booking", label: "Booking", ikon: Wallet },
    { href: "/siswa/rapor", label: "Rapor", ikon: FileText },
  ],
  pengajar: [
    { href: "/mengajar", label: "Ringkasan", ikon: LayoutDashboard },
    { href: "/mengajar/kelas", label: "Kelas", ikon: BookOpen },
    { href: "/mengajar/profil", label: "Profil", ikon: User },
    { href: "/mengajar/penghasilan", label: "Penghasilan", ikon: Banknote },
  ],
  admin: [
    { href: "/admin", label: "Ringkasan", utamaPonsel: true, ikon: LayoutDashboard },
    { href: "/admin/pembayaran", label: "Pembayaran", labelPonsel: "Bayar", utamaPonsel: true, ikon: Wallet },
    { href: "/admin/pengajar", label: "Pengajar", utamaPonsel: true, ikon: Users },
    { href: "/admin/laporan-masalah", label: "Laporan masalah", labelPonsel: "Laporan", utamaPonsel: true, ikon: AlertTriangle },
    { href: "/admin/chat", label: "Live chat", ikon: MessageSquare },
    { href: "/admin/kelas", label: "Kelas", ikon: BookOpen },
    { href: "/admin/program", label: "Program", ikon: Blocks },
    { href: "/admin/honor", label: "Honor", ikon: Banknote },
    { href: "/admin/pengaturan", label: "Pengaturan", ikon: Settings },
    { href: "/admin/log", label: "Log aksi", ikon: ClipboardList },
  ],
};

export function adaNavPeran(peran: Peran) {
  return Boolean(MENU_PERAN[peran]?.length);
}
