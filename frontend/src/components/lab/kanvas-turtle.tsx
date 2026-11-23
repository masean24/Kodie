"use client";

import { useEffect, useRef, useState } from "react";
import { Grid3x3, RotateCcw } from "lucide-react";
import type { Adegan, Pose, Primitif } from "@/lib/lab/turtle";
import { cx } from "@/lib/cx";

type Kecepatan = "lambat" | "normal" | "cepat" | "instan";

/** Kecepatan animasi dalam "piksel dunia" per detik (putaran dihitung 0,5 piksel per derajat). */
const LAJU: Record<Exclude<Kecepatan, "instan">, number> = { lambat: 150, normal: 500, cepat: 2000 };
const LABEL_KECEPATAN: Record<Kecepatan, string> = { lambat: "Lambat", normal: "Normal", cepat: "Cepat", instan: "Instan" };

/** Setengah lebar dunia minimum yang selalu terlihat (koordinat -250..250). */
const SETENGAH_MIN = 250;

function interpolasiSudut(a: number, b: number, t: number): number {
  const beda = ((b - a + 540) % 360) - 180;
  return a + beda * t;
}

/**
 * Kanvas Python Turtle / Blok. Menggambar ulang `adegan` dengan animasi setiap kali `putaran` berubah.
 * Koordinat dunia: (0, 0) di tengah, sumbu y ke atas, sama seperti modul turtle.
 */
export function KanvasTurtle({ adegan, putaran }: { adegan: Adegan | null; putaran: number }) {
  const kanvas = useRef<HTMLCanvasElement>(null);
  const [kecepatan, setKecepatan] = useState<Kecepatan>("normal");
  const [grid, setGrid] = useState(true);
  const [ulang, setUlang] = useState(0);
  const kecepatanRef = useRef(kecepatan);
  const gridRef = useRef(grid);
  const biayaRef = useRef(0);

  useEffect(() => {
    kecepatanRef.current = kecepatan;
  }, [kecepatan]);

  // Animasi baru setiap kali ada hasil baru (putaran) atau tombol Ulangi ditekan.
  useEffect(() => {
    const el = kanvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    gridRef.current = grid;
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = adegan?.totalBiaya ?? 0;
    biayaRef.current = kecepatanRef.current === "instan" || kurangiGerak ? total : 0;

    let raf = 0;
    let lalu = performance.now();

    const gambar = () => {
      const dpr = window.devicePixelRatio || 1;
      const lebar = el.clientWidth;
      const tinggi = el.clientHeight;
      if (el.width !== Math.round(lebar * dpr) || el.height !== Math.round(tinggi * dpr)) {
        el.width = Math.round(lebar * dpr);
        el.height = Math.round(tinggi * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lukis(ctx, lebar, tinggi, adegan, biayaRef.current, gridRef.current);
    };

    const langkah = (sekarang: number) => {
      const dt = Math.min(0.1, (sekarang - lalu) / 1000);
      lalu = sekarang;
      const k = kecepatanRef.current;
      biayaRef.current = k === "instan" ? total : Math.min(total, biayaRef.current + LAJU[k] * dt);
      gambar();
      if (biayaRef.current < total) raf = requestAnimationFrame(langkah);
    };

    gambar();
    if (biayaRef.current < total) raf = requestAnimationFrame(langkah);

    const ro = new ResizeObserver(gambar);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // `grid` sengaja hanya dibaca lewat ref di efek terpisah agar mengganti grid tidak mengulang animasi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adegan, putaran, ulang]);

  // Ganti grid: gambar ulang tanpa mengulang animasi.
  useEffect(() => {
    gridRef.current = grid;
    const el = kanvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lukis(ctx, el.clientWidth, el.clientHeight, adegan, biayaRef.current, grid);
  }, [grid, adegan]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
        <div role="radiogroup" aria-label="Kecepatan gambar" className="flex flex-wrap gap-1">
          {(Object.keys(LABEL_KECEPATAN) as Kecepatan[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kecepatan === k}
              onClick={() => setKecepatan(k)}
              className={cx(
                "min-h-[36px] rounded-full px-3 text-sm font-bold transition-colors",
                kecepatan === k ? "bg-primary text-primary-foreground" : "text-text-muted hover:bg-surface-sunken hover:text-text",
              )}
            >
              {LABEL_KECEPATAN[k]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-pressed={grid}
            onClick={() => setGrid((g) => !g)}
            className={cx(
              "inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-sm font-bold transition-colors",
              grid ? "bg-primary-subtle text-primary" : "text-text-muted hover:bg-surface-sunken hover:text-text",
            )}
          >
            <Grid3x3 aria-hidden className="size-4" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setUlang((u) => u + 1)}
            disabled={!adegan}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-sm font-bold text-text-muted transition-colors hover:bg-surface-sunken hover:text-text disabled:opacity-50"
          >
            <RotateCcw aria-hidden className="size-4" />
            Ulangi animasi
          </button>
        </div>
      </div>
      <canvas ref={kanvas} role="img" aria-label="Hasil gambar turtle" className="min-h-0 w-full flex-1 bg-white" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Penggambaran
// ---------------------------------------------------------------------------

type Terlihat = Extract<Primitif, { z: number }>;

function lukis(ctx: CanvasRenderingContext2D, lebar: number, tinggi: number, adegan: Adegan | null, biaya: number, grid: boolean) {
  ctx.clearRect(0, 0, lebar, tinggi);
  const setengah = Math.max(SETENGAH_MIN, (adegan?.batas ?? 0) + 20);
  const skala = Math.min(lebar, tinggi) / 2 / setengah;
  const cx = lebar / 2;
  const cy = tinggi / 2;
  const sx = (x: number) => cx + x * skala;
  const sy = (y: number) => cy - y * skala;

  // Kumpulkan primitif yang sudah "terungkap" sampai biaya animasi saat ini.
  let latar = "white";
  const terlihat: { p: Terlihat; i: number }[] = [];
  const bersihSampai = new Map<number, number>();
  const pose = new Map<number, Pose>();
  adegan?.poseAwal.forEach((p) => pose.set(p.t, p));
  let parsial: { x2: number; y2: number; garis: Extract<Primitif, { jenis: "garis" }> | null } | null = null;

  let akumulasi = 0;
  const daftar = adegan?.primitif ?? [];
  for (let i = 0; i < daftar.length; i += 1) {
    const p = daftar[i];
    const sisa = biaya - akumulasi;
    if (sisa <= 0 && p.biaya > 0) break;
    const selesai = sisa >= p.biaya;
    akumulasi += p.biaya;

    if (p.jenis === "latar") {
      latar = p.warna;
      continue;
    }
    if (p.jenis === "bersihkan") {
      bersihSampai.set(p.t, i);
      continue;
    }
    if (selesai) {
      if (p.jenis !== "gerak") terlihat.push({ p, i });
      pose.set(p.pose.t, p.pose);
      continue;
    }
    // Primitif yang sedang dianimasikan (sebagian).
    const t = sisa / p.biaya;
    const sebelum = pose.get(p.pose.t) ?? p.pose;
    const antara: Pose = {
      ...p.pose,
      x: sebelum.x + (p.pose.x - sebelum.x) * t,
      y: sebelum.y + (p.pose.y - sebelum.y) * t,
      arah: interpolasiSudut(sebelum.arah, p.pose.arah, t),
    };
    parsial = { x2: antara.x, y2: antara.y, garis: p.jenis === "garis" ? p : null };
    pose.set(p.pose.t, antara);
    break;
  }

  ctx.fillStyle = latar;
  ctx.fillRect(0, 0, lebar, tinggi);
  if (grid) gambarGrid(ctx, lebar, tinggi, cx, cy, skala);

  const aktif = terlihat
    .filter(({ p, i }) => {
      const t = p.pose.t;
      const batas = bersihSampai.get(t);
      return batas === undefined || i > batas;
    })
    .sort((a, b) => a.p.z - b.p.z || a.i - b.i);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const huruf = aktif.some(({ p }) => p.jenis === "tulis") ? getComputedStyle(document.body).fontFamily : "";
  for (const { p } of aktif) {
    switch (p.jenis) {
      case "garis":
        if (p.tebal <= 0) break;
        ctx.strokeStyle = p.warna;
        ctx.lineWidth = Math.max(1, p.tebal * skala);
        ctx.beginPath();
        ctx.moveTo(sx(p.x1), sy(p.y1));
        ctx.lineTo(sx(p.x2), sy(p.y2));
        ctx.stroke();
        break;
      case "isi":
        ctx.fillStyle = p.warna;
        ctx.beginPath();
        p.titik.forEach(([x, y], j) => (j === 0 ? ctx.moveTo(sx(x), sy(y)) : ctx.lineTo(sx(x), sy(y))));
        ctx.closePath();
        ctx.fill("evenodd");
        break;
      case "titik":
        ctx.fillStyle = p.warna;
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), Math.max(0.5, (p.ukuran * skala) / 2), 0, Math.PI * 2);
        ctx.fill();
        break;
      case "tulis":
        ctx.fillStyle = p.warna;
        ctx.font = `${Math.max(6, p.ukuran * skala * 1.3)}px ${huruf}`;
        ctx.textAlign = p.rata;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(p.teks, sx(p.x), sy(p.y));
        break;
    }
  }

  if (parsial?.garis && parsial.garis.tebal > 0) {
    const g = parsial.garis;
    ctx.strokeStyle = g.warna;
    ctx.lineWidth = Math.max(1, g.tebal * skala);
    ctx.beginPath();
    ctx.moveTo(sx(g.x1), sy(g.y1));
    ctx.lineTo(sx(parsial.x2), sy(parsial.y2));
    ctx.stroke();
  }

  pose.forEach((p) => {
    if (p.terlihat) gambarKepala(ctx, sx(p.x), sy(p.y), p.arah, p.warna);
  });
}

function gambarGrid(ctx: CanvasRenderingContext2D, lebar: number, tinggi: number, cx: number, cy: number, skala: number) {
  const jarak = 50 * skala;
  if (jarak < 8) return;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.beginPath();
  for (let x = cx % jarak; x < lebar; x += jarak) {
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, tinggi);
  }
  for (let y = cy % jarak; y < tinggi; y += jarak) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(lebar, Math.round(y) + 0.5);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
  ctx.beginPath();
  ctx.moveTo(Math.round(cx) + 0.5, 0);
  ctx.lineTo(Math.round(cx) + 0.5, tinggi);
  ctx.moveTo(0, Math.round(cy) + 0.5);
  ctx.lineTo(lebar, Math.round(cy) + 0.5);
  ctx.stroke();
}

/** Kepala turtle: panah klasik berwarna pena dengan garis tepi agar terlihat di latar apa pun. */
function gambarKepala(ctx: CanvasRenderingContext2D, x: number, y: number, arah: number, warna: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-arah * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(-7, 7);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-7, -7);
  ctx.closePath();
  ctx.fillStyle = warna;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.stroke();
  ctx.restore();
}
