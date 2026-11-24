"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent as KeyboardEventReact } from "react";
import { Moon, Sun, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

type Tema = "light" | "dark";

const KUNCI_TEMA = "kodie:tema";
const EVENT_TEMA = "kodie:tema-ubah";

const OPSI_TEMA: { nilai: Tema; label: string; ikon: LucideIcon }[] = [
  { nilai: "light", label: "Terang", ikon: Sun },
  { nilai: "dark", label: "Gelap", ikon: Moon },
];

function bacaTema(): Tema {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(KUNCI_TEMA);
  if (v === "light" || v === "dark") return v;
  // Belum pernah memilih: pakai tema yang sudah dipasang skrip `<head>` (diambil sekali dari preferensi sistem).
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function langgananTema(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT_TEMA, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT_TEMA, callback);
  };
}

function terapkanTema(tema: Tema) {
  document.documentElement.setAttribute("data-theme", tema);
}

/**
 * Pemilih bahasa ID / EN (Figma `LanguageSwitch` 9:331). Disembunyikan dari Header untuk rilis lomba karena
 * EN belum tersedia (lihat `docs/KEPUTUSAN.md`); komponen disimpan untuk dipakai lagi setelah lomba.
 */
export function LanguageSwitch() {
  const [infoEn, setInfoEn] = useState(false);
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoEn) return;
    const klik = (e: MouseEvent) => {
      if (!akar.current?.contains(e.target as Node)) setInfoEn(false);
    };
    const tombol = (e: KeyboardEvent) => e.key === "Escape" && setInfoEn(false);
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", tombol);
    return () => {
      document.removeEventListener("mousedown", klik);
      document.removeEventListener("keydown", tombol);
    };
  }, [infoEn]);

  return (
    <div ref={akar} className="relative">
      <div
        role="group"
        aria-label="Pilih bahasa"
        className="flex items-center gap-1 rounded-full border-[1.5px] border-border-strong bg-surface p-[3px]"
      >
        <button
          type="button"
          aria-pressed="true"
          onClick={() => setInfoEn(false)}
          className="flex min-h-[38px] min-w-[44px] items-center justify-center rounded-full bg-primary px-3 text-base font-bold text-primary-foreground sm:min-w-[48px]"
        >
          ID
        </button>
        <button
          type="button"
          aria-pressed={false}
          aria-expanded={infoEn}
          onClick={() => setInfoEn((v) => !v)}
          className="flex min-h-[38px] min-w-[44px] items-center justify-center rounded-full px-3 text-base font-bold text-text hover:bg-surface-sunken sm:min-w-[48px]"
        >
          EN
        </button>
      </div>
      {infoEn ? (
        <div
          role="status"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-[10px] border border-border bg-surface-raised p-3 text-sm text-text shadow-lg"
        >
          Bahasa Inggris segera hadir (MVP menggunakan Bahasa Indonesia).
        </div>
      ) : null}
    </div>
  );
}

/** Jari-jari lingkaran reveal yang menutup seluruh layar dari titik klik. */
function jariJari(x: number, y: number) {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
}

function simpanTema(nilai: Tema) {
  localStorage.setItem(KUNCI_TEMA, nilai);
  terapkanTema(nilai);
  window.dispatchEvent(new Event(EVENT_TEMA));
}

/**
 * Ganti tema dengan reveal melingkar dari tombol yang diklik (View Transitions API).
 * Tanpa dukungan browser atau dengan `prefers-reduced-motion`, tema langsung berganti.
 */
function gantiTemaHalus(nilai: Tema, asal: HTMLElement) {
  const akar = document.documentElement;
  const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof document.startViewTransition !== "function" || kurangiGerak || document.hidden) {
    simpanTema(nilai);
    return;
  }
  const kotak = asal.getBoundingClientRect();
  const x = kotak.left + kotak.width / 2;
  const y = kotak.top + kotak.height / 2;
  akar.style.setProperty("--vt-x", `${x}px`);
  akar.style.setProperty("--vt-y", `${y}px`);
  akar.style.setProperty("--vt-r", `${jariJari(x, y)}px`);
  akar.dataset.vt = "tema";
  const transisi = document.startViewTransition(async () => {
    simpanTema(nilai);
    // Beri React waktu merender ulang komponen yang membaca tema (misalnya footer) sebelum snapshot baru.
    await new Promise((r) => setTimeout(r, 40));
  });
  // Transisi bisa dibatalkan browser (misalnya tab disembunyikan); tema tetap sudah tersimpan.
  transisi.ready.catch(() => {});
  transisi.finished
    .catch(() => {})
    .finally(() => {
      delete akar.dataset.vt;
    });
}

/** Toggle tema Terang / Gelap di Header. Pill aktif bergeser dengan Motion. */
export function ThemeSwitch({ penuh }: { penuh?: boolean }) {
  const tema = useSyncExternalStore(langgananTema, bacaTema, (): Tema => "light");
  const tombol = useRef<(HTMLButtonElement | null)[]>([]);
  const indeks = Math.max(
    0,
    OPSI_TEMA.findIndex((o) => o.nilai === tema),
  );

  useEffect(() => {
    terapkanTema(tema);
  }, [tema]);

  const pilih = (i: number) => {
    const o = OPSI_TEMA[i];
    const el = tombol.current[i];
    if (!o || !el || o.nilai === tema) return;
    gantiTemaHalus(o.nilai, el);
  };

  const keyboard = (e: KeyboardEventReact, i: number) => {
    const maju = e.key === "ArrowRight" || e.key === "ArrowDown";
    const mundur = e.key === "ArrowLeft" || e.key === "ArrowUp";
    if (!maju && !mundur) return;
    e.preventDefault();
    const n = (i + (maju ? 1 : -1) + OPSI_TEMA.length) % OPSI_TEMA.length;
    tombol.current[n]?.focus();
    pilih(n);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Tema tampilan"
      className={cx(
        "relative grid grid-cols-2 items-center rounded-full border-[1.5px] border-border-strong bg-surface p-[3px]",
        penuh ? "w-full" : "w-[88px] shrink-0",
      )}
    >
      {/* Pill aktif digeser dengan transisi CSS (easing pegas): posisinya ikut state, termasuk setelah hidrasi. */}
      <span
        aria-hidden
        className="absolute bottom-[3px] left-[3px] top-[3px] rounded-full bg-primary shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.34,1.36,0.64,1)] motion-reduce:transition-none"
        style={{ width: "calc((100% - 6px) / 2)", transform: `translateX(${indeks * 100}%)` }}
      />
      {OPSI_TEMA.map((o, i) => {
        const terpilih = i === indeks;
        const Ikon = o.ikon;
        return (
          <button
            key={o.nilai}
            ref={(el) => {
              tombol.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={terpilih}
            aria-label={o.label}
            title={o.label}
            tabIndex={terpilih ? 0 : -1}
            onClick={() => pilih(i)}
            onKeyDown={(e) => keyboard(e, i)}
            className={cx(
              "relative z-10 flex min-h-[38px] items-center justify-center gap-2 rounded-full px-2 text-sm font-bold transition-colors duration-300",
              terpilih ? "text-primary-foreground" : "text-text-muted hover:text-text",
            )}
          >
            <Ikon aria-hidden className="size-[18px] shrink-0" />
            {penuh ? <span className="whitespace-nowrap">{o.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

