"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, ChevronDown, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";

type Tema = "light" | "dark" | "system";

const KUNCI_TEMA = "kodie:tema";
const EVENT_TEMA = "kodie:tema-ubah";

const OPSI_TEMA: { nilai: Tema; label: string; ikon: LucideIcon }[] = [
  { nilai: "light", label: "Terang", ikon: Sun },
  { nilai: "dark", label: "Gelap", ikon: Moon },
  { nilai: "system", label: "Ikuti sistem", ikon: Monitor },
];

function bacaTema(): Tema {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(KUNCI_TEMA);
  return v === "light" || v === "dark" ? v : "system";
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
  if (tema === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", tema);
}

/** Pemilih bahasa ID / EN di Header (Figma `LanguageSwitch` 9:331). */
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

/** Pemilih tema Terang / Gelap / Ikuti sistem di Header (Figma `ThemeSwitch` 9:401). */
export function ThemeSwitch({ penuh }: { penuh?: boolean }) {
  const menuId = useId();
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  const tema = useSyncExternalStore(langgananTema, bacaTema, (): Tema => "system");

  useEffect(() => {
    terapkanTema(tema);
  }, [tema]);

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

  const pilih = (nilai: Tema) => {
    localStorage.setItem(KUNCI_TEMA, nilai);
    terapkanTema(nilai);
    window.dispatchEvent(new Event(EVENT_TEMA));
    setBuka(false);
  };

  const aktif = OPSI_TEMA.find((o) => o.nilai === tema) ?? OPSI_TEMA[2];
  const IkonAktif = aktif.ikon;

  return (
    <div ref={akar} className={cx("relative", penuh && "w-full")}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={buka}
        aria-controls={menuId}
        aria-label={`Tema tampilan: ${aktif.label}`}
        onClick={() => setBuka((v) => !v)}
        className={cx(
          "flex min-h-[44px] items-center justify-between gap-2 rounded-full border-[1.5px] border-border-strong bg-surface px-3 py-2 text-base font-bold text-text transition-colors hover:bg-surface-sunken",
          buka && "border-focus ring-2 ring-focus/30",
          penuh && "w-full",
        )}
      >
        <span className="flex items-center gap-2 whitespace-nowrap">
          <IkonAktif aria-hidden className="size-5 shrink-0" />
          <span>{aktif.label}</span>
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0" />
      </button>

      <div
        id={menuId}
        role="menu"
        hidden={!buka}
        className={cx(
          "z-40 mt-2 rounded-[10px] border border-border bg-surface-raised p-2 shadow-lg",
          penuh ? "w-full" : "absolute right-0 top-full w-[220px]",
        )}
      >
        {OPSI_TEMA.map((o) => {
          const terpilih = o.nilai === tema;
          const Ikon = o.ikon;
          return (
            <button
              key={o.nilai}
              type="button"
              role="menuitemradio"
              aria-checked={terpilih}
              onClick={() => pilih(o.nilai)}
              className={cx(
                "flex min-h-[44px] w-full items-center gap-3 rounded-[6px] px-3 py-2 text-left text-[17px] leading-[27px] transition-colors",
                terpilih ? "bg-primary-subtle font-bold text-primary" : "text-text hover:bg-surface-sunken",
              )}
            >
              <Ikon aria-hidden className="size-5 shrink-0" />
              <span className="flex-1">{o.label}</span>
              {terpilih ? <Check aria-hidden className="size-5 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
