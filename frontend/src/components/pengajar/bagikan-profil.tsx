"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Tombol } from "@/components/ui/tombol";
import { simpanKodeReferral } from "@/lib/referral";

/**
 * Tombol bagikan profil pengajar. Memakai menu bagikan bawaan perangkat bila ada (ponsel), selain itu menyalin
 * tautan ke clipboard. `kode` (opsional) menempelkan kode referral pengajar ke tautan.
 */
export function TombolBagikanProfil({ path, nama, kode }: { path: string; nama: string; kode?: string | null }) {
  const [status, setStatus] = useState<"" | "tersalin" | "gagal">("");

  const bagikan = async () => {
    const url = new URL(path, window.location.origin);
    if (kode) url.searchParams.set("ref", kode);
    const tautan = url.toString();
    const data = { title: `${nama} · Pengajar Kodie`, text: `Lihat profil ${nama}, pengajar terverifikasi di Kodie.`, url: tautan };
    try {
      if (typeof navigator.share === "function" && navigator.canShare?.(data) !== false) {
        await navigator.share(data);
        return;
      }
    } catch (e) {
      // Pengguna menutup menu bagikan: tidak perlu pesan apa pun.
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(tautan);
      setStatus("tersalin");
    } catch {
      setStatus("gagal");
    }
  };

  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(""), 3000);
    return () => window.clearTimeout(t);
  }, [status]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tombol varian="kedua" onClick={bagikan}>
        <Share2 aria-hidden className="size-5" /> Bagikan profil
      </Tombol>
      <span role="status" aria-live="polite" className="text-sm font-bold">
        {status === "tersalin" ? (
          <span className="inline-flex items-center gap-1.5 text-success">
            <Check aria-hidden className="size-4" /> Tautan profil disalin
          </span>
        ) : status === "gagal" ? (
          <span className="inline-flex items-center gap-1.5 text-danger">
            <Copy aria-hidden className="size-4" /> Salin manual dari bilah alamat
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Menyimpan `?ref=KODE` dari tautan yang dibagikan pengajar, supaya kode terisi otomatis saat orang tua memesan
 * kelas pengajar tersebut. Tidak merender apa pun.
 */
export function TangkapReferral({ pengajarId }: { pengajarId: string }) {
  useEffect(() => {
    const kode = new URLSearchParams(window.location.search).get("ref");
    if (kode) simpanKodeReferral(kode, pengajarId);
  }, [pengajarId]);
  return null;
}
