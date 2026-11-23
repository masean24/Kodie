"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, CheckCheck, Info, X } from "lucide-react";
import type { Notifikasi } from "@/types/database";
import { aksiAmbilNotifikasi, aksiBacaNotifikasi, aksiBacaSemuaNotifikasi } from "@/lib/aksi/sesi";
import { pakaiMock } from "@/lib/api/sumber";
import { cx } from "@/lib/cx";
import { formatTanggalJam } from "@/lib/format";
import { jumlahBelumDibaca } from "@/lib/sesi";
import { buatClientBrowser } from "@/lib/supabase/browser";

const EVENT_NOTIF = "kodie:notifikasi-sinkron";

function siarkan(daftar: Notifikasi[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Notifikasi[]>(EVENT_NOTIF, { detail: daftar }));
}

/**
 * Lonceng notifikasi di header (PRD bagian 9, Figma HeaderControls).
 * Mode Supabase: langganan Realtime `INSERT` + fallback polling 30 detik jika terputus.
 * Mode mock: polling ringan agar perubahan antar-tab muncul tanpa refresh manual.
 */
export function LoncengNotifikasi({
  penggunaId,
  awal,
  pantau = false,
  ponsel = false,
}: {
  penggunaId: string;
  awal: Notifikasi[];
  pantau?: boolean;
  ponsel?: boolean;
}) {
  const router = useRouter();
  const [daftar, setDaftar] = useState<Notifikasi[]>(awal);
  const [buka, setBuka] = useState(false);
  const [toast, setToast] = useState<Notifikasi | null>(null);
  const [, mulai] = useTransition();

  const akar = useRef<HTMLDivElement>(null);
  const diketahui = useRef(new Set(awal.map((n) => n.id)));
  const realtimeTerhubung = useRef(false);

  // Sinkronkan perubahan notifikasi antar-instance lonceng (desktop & ponsel).
  useEffect(() => {
    const dengar = (e: Event) => {
      const baru = (e as CustomEvent<Notifikasi[]>).detail;
      if (Array.isArray(baru)) {
        for (const x of baru) diketahui.current.add(x.id);
        setDaftar(baru);
      }
    };
    window.addEventListener(EVENT_NOTIF, dengar);
    return () => window.removeEventListener(EVENT_NOTIF, dengar);
  }, []);

  // Tutup dropdown saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!buka) return;
    const klik = (e: MouseEvent) => {
      if (!akar.current?.contains(e.target as Node)) setBuka(false);
    };
    const tombol = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", tombol);
    return () => {
      document.removeEventListener("mousedown", klik);
      document.removeEventListener("keydown", tombol);
    };
  }, [buka]);

  // Langganan Supabase Realtime + fallback polling.
  useEffect(() => {
    if (!pantau) return;

    const prosesDaftarBaru = (terbaru: Notifikasi[]) => {
      const notifBaru = terbaru.find((n) => !diketahui.current.has(n.id));
      for (const n of terbaru) diketahui.current.add(n.id);
      setDaftar(terbaru);
      siarkan(terbaru);
      if (notifBaru) {
        setToast(notifBaru);
        router.refresh();
      }
    };

    const muatUlang = async () => {
      const terbaru = await aksiAmbilNotifikasi();
      if (terbaru.length > 0 || daftar.length > 0) {
        prosesDaftarBaru(terbaru);
      }
    };

    if (pakaiMock) {
      const timer = setInterval(() => {
        void muatUlang();
      }, 5_000);
      return () => clearInterval(timer);
    }

    const supabase = buatClientBrowser();
    const channel = supabase
      .channel(`notifikasi-${penggunaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifikasi",
          filter: `pengguna_id=eq.${penggunaId}`,
        },
        (payload) => {
          const baru = payload.new as Notifikasi;
          if (!baru?.id) return;
          diketahui.current.add(baru.id);
          setDaftar((prev) => {
            const hasil = prev.some((x) => x.id === baru.id) ? prev : [baru, ...prev].slice(0, 20);
            siarkan(hasil);
            return hasil;
          });
          setToast(baru);
          router.refresh();
        },
      )
      .subscribe((status) => {
        realtimeTerhubung.current = status === "SUBSCRIBED";
      });

    const fallback = setInterval(() => {
      if (!realtimeTerhubung.current) {
        void muatUlang();
      }
    }, 30_000);

    return () => {
      clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pantau hanya bergantung pada penggunaId & router
  }, [pantau, penggunaId, router]);

  const belumDibaca = jumlahBelumDibaca(daftar);

  const bacaSatu = (n: Notifikasi) => {
    setBuka(false);
    if (!n.dibaca_pada) {
      const waktu = new Date().toISOString();
      const diperbarui = daftar.map((x) => (x.id === n.id ? { ...x, dibaca_pada: waktu } : x));
      setDaftar(diperbarui);
      siarkan(diperbarui);
      mulai(async () => {
        await aksiBacaNotifikasi(n.id);
      });
    }
  };

  const bacaSemua = () => {
    const waktu = new Date().toISOString();
    const diperbarui = daftar.map((x) => (x.dibaca_pada ? x : { ...x, dibaca_pada: waktu }));
    setDaftar(diperbarui);
    siarkan(diperbarui);
    mulai(async () => {
      await aksiBacaSemuaNotifikasi();
    });
  };

  return (
    <>
      <div ref={akar} className="relative">
        <button
          type="button"
          aria-expanded={buka}
          aria-controls={ponsel ? "panel-notif-ponsel" : "panel-notif-desktop"}
          onClick={() => setBuka((v) => !v)}
          className={cx(
            "flex min-h-touch items-center gap-2 rounded-full px-3 font-display font-semibold hover:bg-surface-sunken",
            ponsel && "w-full justify-between border-[1.5px] border-border-strong",
          )}
        >
          <span className="flex items-center gap-2">
            <Bell aria-hidden className="size-5" />
            <span>Notifikasi</span>
          </span>
          {belumDibaca > 0 ? (
            <span className="grid min-h-[22px] min-w-[22px] place-items-center rounded-full bg-danger px-1.5 text-xs font-bold text-danger-foreground tabular-nums">
              {belumDibaca}
              <span className="sr-only"> belum dibaca</span>
            </span>
          ) : null}
        </button>

        <div
          id={ponsel ? "panel-notif-ponsel" : "panel-notif-desktop"}
          hidden={!buka}
          className={cx(
            "z-40 mt-2 rounded-card-sm border border-border bg-surface-raised p-3 shadow-lg",
            ponsel ? "w-full" : "absolute right-0 top-full w-[360px]",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <p className="font-display font-semibold">Notifikasi</p>
            {belumDibaca > 0 ? (
              <button
                type="button"
                onClick={bacaSemua}
                className="inline-flex min-h-[36px] items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                <CheckCheck aria-hidden className="size-4" /> Tandai dibaca
              </button>
            ) : null}
          </div>

          {daftar.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-text-muted">Belum ada notifikasi.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {daftar.map((n) => {
                const belum = !n.dibaca_pada;
                const isiItem = (
                  <div
                    className={cx(
                      "rounded-md p-3 text-left transition-colors",
                      belum ? "bg-primary-subtle" : "hover:bg-surface-sunken",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold">{n.judul}</p>
                      {belum ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
                    </div>
                    <p className="mt-0.5 text-sm text-text-muted">{n.isi}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatTanggalJam(n.dibuat_pada)}</p>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.tautan ? (
                      <Link href={n.tautan} onClick={() => bacaSatu(n)} className="block">
                        {isiItem}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => bacaSatu(n)} className="w-full">
                        {isiItem}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {pantau ? (
        <div aria-live="polite" className="tanpa-cetak pointer-events-none fixed inset-x-4 bottom-20 z-50 flex justify-end lg:bottom-auto lg:top-20">
          {toast ? (
            <div
              role="status"
              className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-card-sm border border-border bg-surface-raised p-4 shadow-lg"
            >
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-info-subtle text-info">
                <Info className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{toast.judul}</p>
                <p className="text-sm text-text-muted">{toast.isi}</p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setToast(null)}
                className="grid size-touch shrink-0 place-items-center rounded-full hover:bg-surface-sunken"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
