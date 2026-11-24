"use client";

import { Fragment, useRef, type ReactNode } from "react";
import { gsap, kurangiGerak, useGSAP } from "@/lib/gsap";

/**
 * Pecah teks menjadi kata `.kata-hero` untuk reveal kata demi kata. Spasi tetap berupa teks biasa
 * agar pembaca layar membaca kalimat utuh dan baris bisa terlipat normal.
 */
export function KataHero({ teks }: { teks: string }) {
  const kata = teks.split(" ").filter(Boolean);
  return (
    <>
      {kata.map((k, i) => (
        <Fragment key={`${k}-${i}`}>
          {i > 0 ? " " : null}
          <span className="kata-hero inline-block">{k}</span>
        </Fragment>
      ))}
    </>
  );
}

/**
 * Entrance hero beranda dengan GSAP: badge muncul, judul terungkap kata demi kata, pill "SD sampai SMA"
 * meletup, paragraf menyusul kata demi kata, lalu tombol dan chip naik.
 *
 * Elemen `.kata-hero` dan `.hero-muncul` mulai transparan lewat CSS (`globals.css`, blok HERO REVEAL)
 * supaya tidak berkedip sebelum hidrasi. CSS juga punya cadangan: bila JavaScript tidak berjalan,
 * elemen tampil sendiri setelah ±2,6 detik; dengan `prefers-reduced-motion` semuanya langsung tampil.
 */
export function RevealHero({ children, className }: { children: ReactNode; className?: string }) {
  const akar = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (kurangiGerak()) return;
      const q = gsap.utils.selector(akar);
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(q("[data-hero='badge']"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45 })
        .fromTo(
          q("h1 .kata-hero"),
          { autoAlpha: 0, yPercent: 60, filter: "blur(8px)" },
          { autoAlpha: 1, yPercent: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.09, clearProps: "filter" },
          "-=0.15",
        )
        .fromTo(
          q("[data-hero='pil']"),
          { autoAlpha: 0, scale: 0.7, y: 10 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: "back.out(2)" },
          "-=0.3",
        )
        .fromTo(
          q("p .kata-hero"),
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.022 },
          "-=0.3",
        )
        .fromTo(
          q("[data-hero='aksi']"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 },
          "-=0.35",
        );
    },
    { scope: akar },
  );

  return (
    <div ref={akar} className={className}>
      {children}
    </div>
  );
}
