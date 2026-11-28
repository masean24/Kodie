import { Suspense, type ReactNode } from "react";
import type { Peran } from "@/types/database";
import { Kerangka, Kontainer, StatusMemuat } from "@/components/ui/dasar";
import { cx } from "@/lib/cx";
import { KerangkaSitus } from "@/components/situs/kerangka-situs";
import { PenjagaArea } from "./penjaga-area";
import { ambilRingkasanAdmin } from "@/lib/api/admin";
import { hitungChatMenungguAdmin } from "@/lib/api/chatbot";
import { NavPeran, type AngkaNav } from "./nav-peran";
import { adaNavPeran } from "./menu-peran";

/** Sidebar admin dengan angka antrean. Gagal/ bukan admin → tanpa angka (penjaga area yang menangani akses). */
async function NavAdminBerangka() {
  let angka: AngkaNav | undefined;
  const [ringkasan, chat] = await Promise.allSettled([ambilRingkasanAdmin(), hitungChatMenungguAdmin()]);
  if (ringkasan.status === "fulfilled") {
    const r = ringkasan.value;
    angka = {
      booking_menunggu_verifikasi: r.booking_menunggu_verifikasi,
      pengajar_menunggu_verifikasi: r.pengajar_menunggu_verifikasi,
      laporan_masalah_baru: r.laporan_masalah_baru,
      honor_belum_dibayar: r.honor_belum_dibayar ?? 0,
    };
  }
  if (chat.status === "fulfilled") angka = { ...angka, chat_menunggu_admin: chat.value };
  return <NavPeran peran="admin" angka={angka} />;
}

/** Layout bersama area login: kerangka situs, menu peran, dan penjaga peran. */
export function LayoutArea({ peran, children }: { peran: Peran; children: ReactNode }) {
  const nav = adaNavPeran(peran);
  return (
    <KerangkaSitus ruangBawah={nav}>
      {/* Ruang bawah ekstra di /orang-tua dan /admin agar kartu terakhir tidak tertutup maskot Kiko. */}
      <Kontainer
        className={
          nav
            ? cx(
                "area-cetak grid gap-8 pb-24 lg:grid-cols-[260px_1fr] lg:items-start",
                peran === "orang_tua" || peran === "admin" ? "lg:pb-24" : "lg:pb-12",
              )
            : ""
        }
      >
        {nav ? (
          <>
            <nav aria-label="Menu akun" className="tanpa-cetak hidden pt-10 md:pt-12 lg:sticky lg:top-[84px] lg:block lg:self-start">
              {peran === "admin" ? (
                <Suspense fallback={<NavPeran peran={peran} />}>
                  <NavAdminBerangka />
                </Suspense>
              ) : (
                <NavPeran peran={peran} />
              )}
            </nav>
            <nav
              aria-label="Menu akun ponsel"
              className="tanpa-cetak fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
            >
              <NavPeran peran={peran} ponsel />
            </nav>
          </>
        ) : null}
        <div className="min-w-0 py-10 md:py-12">
          <Suspense
            fallback={
              <div className="flex flex-col gap-6">
                <StatusMemuat label="Memeriksa akun…" />
                <Kerangka className="h-40" />
                <Kerangka className="h-64" />
              </div>
            }
          >
            <PenjagaArea peran={peran}>{children}</PenjagaArea>
          </Suspense>
        </div>
      </Kontainer>
    </KerangkaSitus>
  );
}
