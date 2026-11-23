import { LayoutGrid, ShieldCheck, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Peran } from "@/types/database";

export type ItemMenu = { href: string; label: string; ikon: LucideIcon };

/**
 * Menu per peran (Figma: sidebar di desktop, tab bar bawah di ponsel).
 * Item Rapor ditambahkan saat halamannya dibuat (Prompt 6).
 * Modul biasa (bukan "use client") supaya bisa dibaca Server Component.
 */
export const MENU_PERAN: Partial<Record<Peran, ItemMenu[]>> = {
  orang_tua: [
    { href: "/orang-tua", label: "Ringkasan", ikon: LayoutGrid },
    { href: "/orang-tua/anak", label: "Anak", ikon: Users },
    { href: "/orang-tua/booking", label: "Booking", ikon: Wallet },
  ],
  siswa: [
    { href: "/siswa", label: "Ringkasan", ikon: LayoutGrid },
    { href: "/siswa/persetujuan", label: "Persetujuan", ikon: ShieldCheck },
    { href: "/siswa/booking", label: "Booking", ikon: Wallet },
  ],
};

export function adaNavPeran(peran: Peran) {
  return Boolean(MENU_PERAN[peran]?.length);
}
