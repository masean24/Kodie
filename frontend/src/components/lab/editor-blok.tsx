"use client";

import { useEffect, useRef, useState } from "react";
import type * as BlocklyNS from "blockly";
import { StatusMemuat } from "@/components/ui/dasar";
import { daftarkanBlokKiko, temaKodie, TOOLBOX_KIKO } from "./blok-kiko";

/**
 * Papan blok Blockly. Komponen tidak dikontrol: `nilaiAwal` (JSON workspace) dibaca sekali saat mount,
 * perubahan dikirim lewat `onUbah`. Ganti `key` untuk memuat susunan lain (misalnya setelah "Kembalikan contoh").
 */
export function EditorBlok({ nilaiAwal, onUbah }: { nilaiAwal: string; onUbah: (json: string) => void }) {
  const wadah = useRef<HTMLDivElement>(null);
  const ubahRef = useRef(onUbah);
  const awalRef = useRef(nilaiAwal);
  const [status, setStatus] = useState<"memuat" | "siap" | "gagal">("memuat");

  useEffect(() => {
    ubahRef.current = onUbah;
  });

  useEffect(() => {
    let batal = false;
    let ws: BlocklyNS.WorkspaceSvg | null = null;
    const lepas: (() => void)[] = [];

    (async () => {
      try {
        const [B, bahasa] = await Promise.all([import("blockly"), import("blockly/msg/id")]);
        if (batal || !wadah.current) return;
        B.setLocale(bahasa as unknown as Record<string, string>);
        daftarkanBlokKiko(B);

        ws = B.inject(wadah.current, {
          toolbox: TOOLBOX_KIKO,
          renderer: "zelos",
          theme: temaKodie(B),
          trashcan: true,
          sounds: false,
          grid: { spacing: 24, length: 3, colour: "rgba(148, 163, 184, 0.35)", snap: true },
          zoom: { controls: true, wheel: false, startScale: 0.85, maxScale: 1.6, minScale: 0.5, scaleSpeed: 1.15 },
          move: { scrollbars: true, drag: true, wheel: true },
        });

        try {
          if (awalRef.current.trim()) B.serialization.workspaces.load(JSON.parse(awalRef.current), ws);
        } catch {
          // Data tersimpan rusak: mulai dari papan kosong.
        }

        // Event pemuatan dikirim Blockly secara asinkron; abaikan selama susunannya belum berubah.
        let terakhir = JSON.stringify(B.serialization.workspaces.save(ws));
        ws.addChangeListener((e) => {
          if (e.isUiEvent || !ws || ws.isDragging()) return;
          const json = JSON.stringify(B.serialization.workspaces.save(ws));
          if (json === terakhir) return;
          terakhir = json;
          ubahRef.current(json);
        });

        // Tema Blockly mengikuti toggle tema situs dan preferensi sistem.
        const perbaruiTema = () => ws?.setTheme(temaKodie(B));
        const mo = new MutationObserver(perbaruiTema);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", perbaruiTema);
        lepas.push(() => mo.disconnect(), () => mq.removeEventListener("change", perbaruiTema));

        const ro = new ResizeObserver(() => ws && B.svgResize(ws));
        ro.observe(wadah.current);
        lepas.push(() => ro.disconnect());

        setStatus("siap");
      } catch {
        if (!batal) setStatus("gagal");
      }
    })();

    return () => {
      batal = true;
      lepas.forEach((f) => f());
      ws?.dispose();
    };
  }, []);

  return (
    <div className="relative h-full min-h-0">
      <div ref={wadah} className="absolute inset-0" aria-label="Papan blok Kiko" />
      {status === "memuat" ? (
        <div className="absolute inset-0 grid place-items-center bg-surface-sunken">
          <StatusMemuat label="Menyiapkan papan blok…" />
          <p className="text-sm text-text-muted">Menyiapkan papan blok…</p>
        </div>
      ) : null}
      {status === "gagal" ? (
        <div className="absolute inset-0 grid place-items-center bg-surface-sunken p-6 text-center">
          <p className="max-w-sm text-text-muted">Papan blok gagal dimuat. Muat ulang halaman, lalu coba lagi.</p>
        </div>
      ) : null}
    </div>
  );
}
