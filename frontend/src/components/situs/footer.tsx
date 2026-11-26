"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Kontainer } from "@/components/ui/dasar";
import { cx } from "@/lib/cx";
import { SimbolKodie } from "./logo";

type TemaFooter = "day" | "night";

const PESAN_PIKSEL = {
  halo: "Halo dari Kiko! 👋",
  kiko: "Hello World! :)",
  pet: "Meow.exe! 🐾",
  student: "Otw kelas teknologi! 💻",
  girlHijab: "Seru banget bikin web pertama! ✨",
  girlPonytail: "Gas ke laboratorium Kodie! 🚀",
  kampus: "Kampus Kodie aktif! ⚡",
  halte: "Lagi baca materi seru! 📖",
  kafe: "Kopi + Kode = ☕💻",
  drone: "Paket kode terkirim! 📦",
  coding: "Yuk kuasai logika coding dasar! 💡",
  reguler: "Belajar konsisten tiap minggu! 📅",
  simulasi: "Cicipi kuliah jurusan IT! 🎓",
  tes: "Temukan jalur belajarmu! 🧭",
  katalog: "Pilih kelas favoritmu! 📚",
  pengajar: "Jadilah mentor inspiratif! 🌟",
  privasi: "Datamu aman bersama Kodie! 🔒",
  panduan: "Ikuti panduan belajar terarah! 📖",
  showcase: "Karya keren pelajar Kodie! 🚀",
  github: "Lihat kode & proyek pelajar! 🐙",
  instagram: "Ikuti keseruan belajar di IG! 📸",
  youtube: "Tonton kelas & showcase video! ▶️",
} as const;

type SumberEasterEgg = keyof typeof PESAN_PIKSEL;

const KOLOM_NAVIGASI: {
  judul: string;
  item: (
    | { jenis: "link"; href: string; label: string; sumber: SumberEasterEgg }
    | { jenis: "kiko"; label: string; sumber: SumberEasterEgg }
  )[];
}[] = [
  {
    judul: "Program",
    item: [
      { jenis: "link", href: "/program/coding-dasar", label: "Coding Dasar", sumber: "coding" },
      {
        jenis: "link",
        href: "/program/kelas-reguler-teknologi",
        label: "Kelas Reguler Teknologi",
        sumber: "reguler",
      },
      { jenis: "link", href: "/program/simulasi-jurusan-it", label: "Simulasi Jurusan IT", sumber: "simulasi" },
    ],
  },
  {
    judul: "Mulai",
    item: [
      { jenis: "link", href: "/tes-minat", label: "Tes minat", sumber: "tes" },
      { jenis: "link", href: "/kelas", label: "Katalog kelas", sumber: "katalog" },
      { jenis: "link", href: "/karier", label: "Karier pengajar", sumber: "pengajar" },
    ],
  },
  {
    judul: "Bantuan",
    item: [
      { jenis: "link", href: "/kebijakan-privasi", label: "Kebijakan privasi", sumber: "privasi" },
      { jenis: "link", href: "/program", label: "Panduan belajar", sumber: "panduan" },
    ],
  },
  {
    judul: "Komunitas",
    item: [
      { jenis: "kiko", label: "Tanya Kiko AI", sumber: "halo" },
      { jenis: "link", href: "/showcase", label: "Showcase Karya", sumber: "showcase" },
    ],
  },
];

function deteksiTemaSitus(): TemaFooter {
  if (typeof document === "undefined") return "day";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return "night";
  if (attr === "light") return "day";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

function LangitPiksel() {
  return (
    <>
      {/* Matahari / Bulan Sabit Piksel & Bintang */}
      <svg
        className="pixel-crisp absolute inset-x-0 top-1 w-full h-20 pointer-events-none"
        viewBox="0 0 240 34"
        height="80"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
      >
        {/* Matahari Mode Light */}
        <g style={{ opacity: "var(--sun-opacity)" }} className="transition-opacity duration-500">
          <rect x="206" y="4" width="6" height="6" fill="#FDE047" />
          <rect x="205" y="5" width="8" height="4" fill="#FDE047" />
          <rect x="207" y="3" width="4" height="8" fill="#FACC15" />
        </g>

        {/* Bulan Sabit Malam */}
        <g style={{ opacity: "var(--moon-opacity)" }} className="transition-opacity duration-500">
          <rect x="206" y="3" width="4" height="1" fill="#FEF08A" />
          <rect x="205" y="4" width="3" height="2" fill="#FEF08A" />
          <rect x="205" y="6" width="3" height="2" fill="#FEF08A" />
          <rect x="206" y="8" width="4" height="1" fill="#FEF08A" />
          <rect x="212" y="4" width="1" height="1" fill="#FEF08A" opacity="0.6" />
        </g>

        {/* Bintang Piksel, Rasi Kodie < > & Bintang Jatuh Malam */}
        <g style={{ opacity: "var(--star-opacity)" }} className="transition-opacity duration-500">
          <g className="twinkle-a">
            <rect x="22" y="4" width="1" height="3" fill="#E2E8F0" />
            <rect x="21" y="5" width="3" height="1" fill="#E2E8F0" />
            <rect x="148" y="3" width="1" height="3" fill="#C6F64D" />
            <rect x="147" y="4" width="3" height="1" fill="#C6F64D" />
          </g>
          <g className="twinkle-b">
            <rect x="76" y="3" width="1" height="3" fill="#93C5FD" />
            <rect x="75" y="4" width="3" height="1" fill="#93C5FD" />
            <rect x="186" y="8" width="1" height="3" fill="#E2E8F0" />
            <rect x="185" y="9" width="3" height="1" fill="#E2E8F0" />
          </g>

          {/* Rasi Bintang Mini Kodie (< >) di Langit Malam */}
          <g opacity="0.85">
            <rect x="114" y="4" width="1" height="1" fill="#C6F64D" />
            <rect x="112" y="6" width="1" height="1" fill="#E2E8F0" />
            <rect x="114" y="8" width="1" height="1" fill="#C6F64D" />
            <rect x="118" y="4" width="1" height="1" fill="#C6F64D" />
            <rect x="120" y="6" width="1" height="1" fill="#E2E8F0" />
            <rect x="118" y="8" width="1" height="1" fill="#C6F64D" />
          </g>

          {/* Titik Bintang Kecil */}
          <rect x="44" y="10" width="1" height="1" fill="#C6F64D" />
          <rect x="58" y="4" width="1" height="1" fill="#E2E8F0" />
          <rect x="95" y="9" width="1" height="1" fill="#93C5FD" />
          <rect x="134" y="11" width="1" height="1" fill="#E2E8F0" />
          <rect x="166" y="12" width="1" height="1" fill="#93C5FD" />
          <rect x="226" y="6" width="1" height="1" fill="#C6F64D" />

          {/* Bintang Jatuh 1 (Kanan) */}
          <g className="shooting-star">
            <rect x="176" y="4" width="2" height="2" fill="#C6F64D" />
            <rect x="178" y="3" width="3" height="1" fill="#93C5FD" />
            <rect x="181" y="2" width="3" height="1" fill="#E2E8F0" />
            <rect x="184" y="1" width="2" height="1" fill="#E2E8F0" opacity="0.5" />
          </g>

          {/* Bintang Jatuh 2 (Kiri-Tengah) */}
          <g className="shooting-star-2">
            <rect x="92" y="3" width="2" height="2" fill="#FEF08A" />
            <rect x="94" y="2" width="3" height="1" fill="#C6F64D" />
            <rect x="97" y="1" width="3" height="1" fill="#E2E8F0" opacity="0.7" />
          </g>
        </g>
      </svg>

      {/* Kunang-kunang Malam */}
      <div style={{ opacity: "var(--moon-opacity)" }} className="pointer-events-none transition-opacity duration-500" aria-hidden="true">
        <div className="firefly-1 absolute bottom-12 left-[28%] w-1.5 h-1.5 bg-[#C6F64D]" />
        <div className="firefly-2 absolute bottom-14 right-[34%] w-1.5 h-1.5 bg-[#C6F64D]" />
      </div>

      {/* Layer 1A: Taburan Bintang Piksel */}
      <div aria-hidden="true" className="pixel-night-stars absolute inset-x-0 top-0 h-14 pointer-events-none" />

      {/* Layer 1B: Awan Piksel Bergerak Pelan */}
      <div aria-hidden="true" className="pixel-clouds absolute inset-x-0 top-0 h-12 pointer-events-none transition-opacity duration-500" />
    </>
  );
}

function BangunanPiksel({ picuEasterEgg }: { picuEasterEgg: (sumber: SumberEasterEgg) => void }) {
  return (
    <>
      {/* Drone Piksel Pembawa Paket Kode di Langit */}
      <button
        type="button"
        onClick={() => picuEasterEgg("drone")}
        title="Klik Drone Kiko!"
        aria-label="Klik Drone Kiko!"
        className="sky-drone block appearance-none after:absolute after:-inset-2 after:content-[''] border-0 bg-transparent p-0 absolute top-7 left-0 w-12 h-9 cursor-pointer z-20 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 16 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g className="frame-1">
            <rect x="1" y="1" width="5" height="1" fill="#0F172A" />
            <rect x="10" y="1" width="5" height="1" fill="#0F172A" />
          </g>
          <g className="frame-2">
            <rect x="2" y="1" width="3" height="1" fill="#64748B" />
            <rect x="11" y="1" width="3" height="1" fill="#64748B" />
          </g>
          <rect x="3" y="2" width="1" height="1" fill="#0F172A" />
          <rect x="12" y="2" width="1" height="1" fill="#0F172A" />
          <rect x="4" y="3" width="8" height="3" fill="#1D4ED8" />
          <rect x="6" y="4" width="4" height="1" fill="#C6F64D" />
          <rect x="7" y="6" width="2" height="2" fill="#0F172A" />
          <rect x="5" y="8" width="6" height="4" fill="#C6F64D" />
          <rect x="7" y="9" width="2" height="2" fill="#0F172A" />
        </svg>
      </button>

      {/* Layer 2: Siluet Kota Digital */}
      <div aria-hidden="true" className="pixel-city-far absolute inset-x-0 bottom-4 h-[84px] pointer-events-none" />

      {/* Layer 3: Semak Hijau & Bunga Lime */}
      <div aria-hidden="true" className="pixel-bushes absolute inset-x-0 bottom-4 h-6 pointer-events-none" />

      {/* Landmark Kiri: Halte & Pohon */}
      <button
        type="button"
        onClick={() => picuEasterEgg("halte")}
        title="Halte Belajar Kodie"
        aria-label="Halte Belajar Kodie"
        className="hidden sm:block appearance-none border-0 bg-transparent p-0 absolute bottom-4 left-[6%] lg:left-[9%] w-36 h-28 cursor-pointer z-10 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="5" y="4" width="8" height="2" style={{ fill: "var(--foliage-light)" }} />
          <rect x="3" y="6" width="12" height="4" style={{ fill: "var(--foliage-mid)" }} />
          <rect x="4" y="6" width="5" height="2" style={{ fill: "var(--foliage-light)" }} />
          <rect x="2" y="10" width="14" height="4" style={{ fill: "var(--foliage-dark)" }} />
          <rect x="4" y="10" width="6" height="2" style={{ fill: "var(--foliage-mid)" }} />
          <rect x="8" y="14" width="2" height="14" fill="#78350F" />
          <rect x="7" y="26" width="4" height="2" fill="#78350F" />

          <rect x="17" y="12" width="17" height="2" fill="#0F172A" />
          <rect x="16" y="14" width="19" height="2" fill="#1D4ED8" />
          <rect x="19" y="14" width="3" height="2" style={{ fill: "var(--building-wall)" }} />
          <rect x="25" y="14" width="3" height="2" style={{ fill: "var(--building-wall)" }} />
          <rect x="31" y="14" width="3" height="2" style={{ fill: "var(--building-wall)" }} />
          <rect x="18" y="16" width="1" height="12" fill="#0F172A" />
          <rect x="32" y="16" width="1" height="12" fill="#0F172A" />
          <rect x="20" y="17" width="6" height="5" fill="#0F172A" />
          <rect x="21" y="18" width="4" height="3" fill="#C6F64D" />
          <rect x="26" y="23" width="6" height="1" fill="#92400E" />
          <rect x="27" y="24" width="1" height="4" fill="#0F172A" />
          <rect x="31" y="24" width="1" height="4" fill="#0F172A" />
          <rect x="28" y="17" width="3" height="2" fill="#78350F" />
          <rect x="31" y="18" width="1" height="2" fill="#78350F" />
          <rect x="30" y="17" width="1" height="1" fill="#C6F64D" />
          <rect x="28" y="19" width="3" height="2" fill="#FDBA74" />
          <rect x="28" y="21" width="3" height="3" fill="#1D4ED8" />
          <rect x="26" y="21" width="2" height="2" fill="#C6F64D" />
        </svg>
      </button>

      {/* Landmark Tengah-Kiri: Kodie Café */}
      <button
        type="button"
        onClick={() => picuEasterEgg("kafe")}
        title="Kodie Café - Klik untuk pesan kopi!"
        aria-label="Kodie Café - Klik untuk pesan kopi!"
        className="hidden md:block appearance-none border-0 bg-transparent p-0 absolute bottom-4 left-[36%] w-24 h-20 cursor-pointer z-10 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="9" y="1" width="6" height="4" fill="#0F172A" />
          <rect x="10" y="2" width="4" height="2" fill="#C6F64D" />
          <rect x="3" y="5" width="18" height="2" fill="#1D4ED8" />
          <rect x="5" y="5" width="2" height="2" style={{ fill: "var(--building-wall)" }} />
          <rect x="11" y="5" width="2" height="2" style={{ fill: "var(--building-wall)" }} />
          <rect x="17" y="5" width="2" height="2" style={{ fill: "var(--building-wall)" }} />
          <rect x="4" y="7" width="16" height="13" fill="#0F172A" />
          <rect x="5" y="7" width="14" height="13" style={{ fill: "var(--building-wall)" }} />
          <rect x="7" y="9" width="10" height="5" fill="#0F172A" />
          <rect x="10" y="10" width="4" height="3" fill="#1D4ED8" />
          <rect x="11" y="11" width="2" height="1" fill="#C6F64D" />
          <rect x="6" y="14" width="12" height="1" fill="#92400E" />
        </svg>
      </button>

      {/* Landmark Kanan: Gedung Kampus Kodie & Lampu Jalan */}
      <button
        type="button"
        onClick={() => picuEasterEgg("kampus")}
        title="Gedung Kampus Kodie - Klik untuk menyalakan tanda!"
        aria-label="Gedung Kampus Kodie - Klik untuk menyalakan tanda!"
        className="block appearance-none border-0 bg-transparent p-0 absolute bottom-4 right-[6%] sm:right-[11%] lg:right-[14%] w-52 h-36 cursor-pointer z-10 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 52 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon points="4,15 0,36 10,36 6,15" fill="#C6F64D" style={{ opacity: "var(--lamp-opacity)" }} />

          <rect x="4" y="14" width="2" height="2" fill="#C6F64D" />
          <rect x="3" y="13" width="4" height="1" fill="#0F172A" />
          <rect x="4" y="16" width="2" height="20" fill="#0F172A" />
          <rect x="3" y="34" width="4" height="2" fill="#0F172A" />

          <rect x="26" y="1" width="2" height="3" fill="#0F172A" />
          <rect x="20" y="4" width="14" height="6" fill="#0F172A" />
          <g className="neon-pulse">
            <rect x="22" y="6" width="1" height="2" fill="#C6F64D" />
            <rect x="23" y="5" width="1" height="1" fill="#C6F64D" />
            <rect x="23" y="8" width="1" height="1" fill="#C6F64D" />
            <rect x="31" y="6" width="1" height="2" fill="#C6F64D" />
            <rect x="30" y="5" width="1" height="1" fill="#C6F64D" />
            <rect x="30" y="8" width="1" height="1" fill="#C6F64D" />
            <rect x="26" y="6" width="2" height="2" fill="#FFFFFF" />
          </g>

          <rect x="13" y="10" width="28" height="2" fill="#0F172A" />
          <rect x="11" y="12" width="32" height="3" fill="#1D4ED8" />
          <rect x="11" y="14" width="32" height="1" fill="#0F172A" />

          <rect x="12" y="15" width="30" height="21" fill="#0F172A" />
          <rect x="13" y="15" width="28" height="21" style={{ fill: "var(--building-wall)" }} />
          <rect x="13" y="15" width="28" height="1" style={{ fill: "var(--building-shade)" }} />

          <rect x="16" y="18" width="4" height="4" style={{ fill: "var(--window-dim)" }} />
          <rect x="22" y="18" width="4" height="4" style={{ fill: "var(--window-lit)" }} />
          <rect x="28" y="18" width="4" height="4" style={{ fill: "var(--window-lit)" }} />
          <rect x="34" y="18" width="4" height="4" style={{ fill: "var(--window-dim)" }} />
          <path fill="#1D4ED8" d="M16 17h4v1h-4zm6 0h4v1h-4zm6 0h4v1h-4zm6 0h4v1h-4z" />

          <rect x="16" y="26" width="4" height="4" style={{ fill: "var(--window-lit)" }} />
          <rect x="34" y="26" width="4" height="4" style={{ fill: "var(--window-dim)" }} />
          <path fill="#1D4ED8" d="M16 25h4v1h-4zm18 0h4v1h-4z" />

          <rect x="23" y="25" width="8" height="11" fill="#0F172A" />
          <rect x="24" y="26" width="6" height="9" fill="#1D4ED8" />
          <rect x="26" y="26" width="2" height="9" fill="#93C5FD" />
          <rect x="22" y="35" width="10" height="1" fill="#0F172A" />

          <rect x="15" y="34" width="4" height="2" fill="#B45309" />
          <rect x="15" y="32" width="4" height="2" style={{ fill: "var(--foliage-mid)" }} />
          <rect x="16" y="31" width="1" height="1" fill="#C6F64D" />

          <rect x="35" y="34" width="4" height="2" fill="#B45309" />
          <rect x="35" y="32" width="4" height="2" style={{ fill: "var(--foliage-mid)" }} />
          <rect x="37" y="31" width="1" height="1" fill="#C6F64D" />
        </svg>
      </button>
    </>
  );
}

function KarakterBerjalanPiksel({
  bubbleTerlihat,
  pesanAktif,
  sedangLompat,
  picuEasterEgg,
}: {
  bubbleTerlihat: boolean;
  pesanAktif: string;
  sedangLompat: boolean;
  picuEasterEgg: (sumber: SumberEasterEgg) => void;
}) {
  return (
    <>
      {/* 1. KIKO MASCOT (16x18 Grid Piksel) */}
      <button
        id="sprite-kiko"
        type="button"
        onClick={() => picuEasterEgg("kiko")}
        title="Klik Kiko!"
        aria-label="Klik Kiko!"
        className="walker-kiko block appearance-none border-0 bg-transparent p-0 absolute bottom-4 left-0 w-12 h-14 cursor-pointer z-30 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <div
          id="pixel-bubble"
          role="status"
          aria-live="polite"
          className={cx(
            !bubbleTerlihat && "hidden",
            "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0F172A] text-[#C6F64D] border-2 border-[#C6F64D] px-2.5 py-0.5 text-[10px] font-mono-kodie font-bold shadow-xs",
          )}
        >
          {pesanAktif}
        </div>

        <svg
          id="sprite-kiko-svg"
          className={cx("pixel-crisp w-full h-full", sedangLompat && "do-hop")}
          viewBox="0 0 16 18"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="7" y="0" width="2" height="1" fill="#C6F64D" />
          <rect x="7" y="1" width="2" height="2" fill="#0F172A" />
          <rect x="3" y="3" width="10" height="7" fill="#1D4ED8" />
          <rect x="2" y="5" width="1" height="3" fill="#0F172A" />
          <rect x="13" y="5" width="1" height="3" fill="#0F172A" />
          <rect x="4" y="4" width="8" height="5" fill="#0F172A" />
          <rect x="5" y="5" width="2" height="2" fill="#C6F64D" />
          <rect x="9" y="5" width="2" height="2" fill="#C6F64D" />
          <rect x="6" y="8" width="4" height="1" fill="#C6F64D" />
          <rect x="4" y="10" width="8" height="5" fill="#1D4ED8" />
          <rect x="6" y="10" width="4" height="2" fill="#FFFFFF" />
          <rect x="7" y="11" width="2" height="3" fill="#0F172A" />
          <g className="frame-1">
            <rect x="2" y="11" width="2" height="3" fill="#FFFFFF" />
            <rect x="12" y="10" width="2" height="3" fill="#FFFFFF" />
            <rect x="4" y="15" width="3" height="3" fill="#0F172A" />
            <rect x="9" y="15" width="3" height="2" fill="#0F172A" />
          </g>
          <g className="frame-2">
            <rect x="2" y="10" width="2" height="3" fill="#FFFFFF" />
            <rect x="12" y="11" width="2" height="3" fill="#FFFFFF" />
            <rect x="5" y="15" width="3" height="2" fill="#0F172A" />
            <rect x="8" y="15" width="3" height="3" fill="#0F172A" />
          </g>
        </svg>
      </button>

      {/* 2. ROBO-CAT PENDAMPING KIKO (10x9 Grid Piksel) */}
      <button
        type="button"
        onClick={() => picuEasterEgg("pet")}
        title="Bit-Cat Kodie"
        aria-label="Bit-Cat Kodie"
        className="walker-pet block appearance-none after:absolute after:-inset-2 after:content-[''] border-0 bg-transparent p-0 absolute bottom-4 left-0 w-7 h-7 cursor-pointer z-20 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 10 9" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="1" width="1" height="2" fill="#0F172A" />
          <rect x="7" y="1" width="1" height="2" fill="#0F172A" />
          <rect x="3" y="2" width="6" height="4" fill="#0F172A" />
          <rect x="5" y="3" width="1" height="1" fill="#C6F64D" />
          <rect x="7" y="3" width="1" height="1" fill="#C6F64D" />
          <rect x="2" y="5" width="6" height="2" fill="#1D4ED8" />
          <g className="frame-1">
            <rect x="1" y="3" width="1" height="2" fill="#C6F64D" />
            <rect x="2" y="7" width="2" height="2" fill="#0F172A" />
            <rect x="6" y="7" width="2" height="1" fill="#0F172A" />
          </g>
          <g className="frame-2">
            <rect x="0" y="4" width="2" height="1" fill="#C6F64D" />
            <rect x="3" y="7" width="2" height="1" fill="#0F172A" />
            <rect x="5" y="7" width="2" height="2" fill="#0F172A" />
          </g>
        </svg>
      </button>

      {/* 3. PELAJAR KODIE DENGAN TAS & HEADPHONE (14x17 Grid Piksel) */}
      <button
        type="button"
        onClick={() => picuEasterEgg("student")}
        title="Pelajar Kodie"
        aria-label="Pelajar Kodie"
        className="walker-student block appearance-none after:absolute after:-inset-2 after:content-[''] border-0 bg-transparent p-0 absolute bottom-4 left-0 w-10 h-12 cursor-pointer z-20 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 14 17" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="1" width="6" height="2" fill="#0F172A" />
          <rect x="3" y="2" width="2" height="3" fill="#1D4ED8" />
          <rect x="4" y="3" width="6" height="4" fill="#FDBA74" />
          <rect x="8" y="4" width="1" height="1" fill="#0F172A" />
          <rect x="2" y="7" width="2" height="5" fill="#C6F64D" />
          <rect x="4" y="7" width="6" height="6" fill="#1D4ED8" />
          <rect x="6" y="8" width="2" height="4" fill="#FFFFFF" />
          <g className="frame-1">
            <rect x="4" y="13" width="2" height="4" fill="#0F172A" />
            <rect x="8" y="13" width="2" height="3" fill="#0F172A" />
          </g>
          <g className="frame-2">
            <rect x="5" y="13" width="2" height="3" fill="#0F172A" />
            <rect x="7" y="13" width="2" height="4" fill="#0F172A" />
          </g>
        </svg>
      </button>

      {/* 4. SISWI BERHIJAB DENGAN TABLET LIME (14x17 Grid Piksel) */}
      <button
        type="button"
        onClick={() => picuEasterEgg("girlHijab")}
        title="Siswi Kodie"
        aria-label="Siswi Kodie berhijab"
        className="walker-girl-hijab block appearance-none after:absolute after:-inset-2 after:content-[''] border-0 bg-transparent p-0 absolute bottom-4 left-0 w-10 h-12 cursor-pointer z-20 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 14 17" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="1" width="6" height="2" fill="#FFFFFF" />
          <rect x="3" y="2" width="8" height="6" fill="#FFFFFF" />
          <rect x="3" y="6" width="8" height="2" fill="#93C5FD" />
          <rect x="5" y="3" width="5" height="4" fill="#FDBA74" />
          <rect x="8" y="4" width="1" height="1" fill="#0F172A" />
          <rect x="4" y="8" width="6" height="6" fill="#1D4ED8" />
          <rect x="4" y="13" width="6" height="1" fill="#C6F64D" />
          <rect x="10" y="9" width="2" height="3" fill="#0F172A" />
          <rect x="10" y="10" width="1" height="1" fill="#C6F64D" />
          <g className="frame-1">
            <rect x="4" y="14" width="2" height="3" fill="#0F172A" />
            <rect x="8" y="14" width="2" height="2" fill="#0F172A" />
          </g>
          <g className="frame-2">
            <rect x="5" y="14" width="2" height="2" fill="#0F172A" />
            <rect x="7" y="14" width="2" height="3" fill="#0F172A" />
          </g>
        </svg>
      </button>

      {/* 5. SISWI BERKUNCIR DENGAN PITA LIME (14x17 Grid Piksel) */}
      <button
        type="button"
        onClick={() => picuEasterEgg("girlPonytail")}
        title="Siswi Kodie"
        aria-label="Siswi Kodie berkuncir"
        className="walker-girl-ponytail block appearance-none after:absolute after:-inset-2 after:content-[''] border-0 bg-transparent p-0 absolute bottom-4 left-0 w-10 h-12 cursor-pointer z-20 focus-visible:outline-2 focus-visible:outline-[#C6F64D]"
      >
        <svg className="pixel-crisp w-full h-full" viewBox="0 0 14 17" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="4" y="1" width="6" height="2" fill="#78350F" />
          <rect x="2" y="2" width="2" height="4" fill="#78350F" />
          <rect x="3" y="2" width="1" height="1" fill="#C6F64D" />
          <rect x="3" y="3" width="2" height="3" fill="#78350F" />
          <rect x="5" y="3" width="5" height="4" fill="#FDBA74" />
          <rect x="8" y="4" width="1" height="1" fill="#0F172A" />
          <rect x="3" y="7" width="1" height="4" fill="#C6F64D" />
          <rect x="4" y="7" width="6" height="3" fill="#FFFFFF" />
          <rect x="4" y="10" width="6" height="3" fill="#1D4ED8" />
          <g className="frame-1">
            <rect x="4" y="13" width="2" height="4" fill="#0F172A" />
            <rect x="8" y="13" width="2" height="3" fill="#0F172A" />
          </g>
          <g className="frame-2">
            <rect x="5" y="13" width="2" height="3" fill="#0F172A" />
            <rect x="7" y="13" width="2" height="4" fill="#0F172A" />
          </g>
        </svg>
      </button>
    </>
  );
}

/** Footer utama Kodie lengkap dengan kartu komunitas, pemilih suasana, dan lanskap piksel 8-bit interaktif. */
export function Footer() {
  const [temaFooter, setTemaFooter] = useState<TemaFooter>("day");
  const [pesanAktif, setPesanAktif] = useState<string>(PESAN_PIKSEL.kiko);
  const [bubbleTerlihat, setBubbleTerlihat] = useState(false);
  const [sedangLompat, setSedangLompat] = useState(false);

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sinkron = () => setTemaFooter(deteksiTemaSitus());
    sinkron();

    const observer = new MutationObserver(sinkron);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener("change", sinkron);

    return () => {
      observer.disconnect();
      media?.removeEventListener("change", sinkron);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
    };
  }, []);

  const picuEasterEgg = useCallback((sumber: SumberEasterEgg) => {
    setPesanAktif(PESAN_PIKSEL[sumber] || "Semangat belajar! :)");
    setBubbleTerlihat(true);

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      setBubbleTerlihat(false);
    }, 2600);

    setSedangLompat(false);
    if (hopTimerRef.current) clearTimeout(hopTimerRef.current);
    requestAnimationFrame(() => {
      setSedangLompat(true);
      hopTimerRef.current = setTimeout(() => setSedangLompat(false), 480);
    });
  }, []);

  const bukaWidgetKikoJikaTutup = () => {
    picuEasterEgg("halo");
    window.dispatchEvent(new Event("kodie:buka-kiko"));
  };

  return (
    <footer
      id="kodie-footer"
      data-situs
      data-footer-theme={temaFooter}
      style={{
        // Peralihan bergradasi dari warna halaman ke warna footer, menggantikan garis batas.
        // Tiga titik antara (ease-out) agar peralihan warna tidak terlihat sebagai pita.
        backgroundColor: "var(--footer-bg)",
        backgroundImage:
          "linear-gradient(180deg, var(--k-bg) 0px, color-mix(in oklab, var(--k-bg) 70%, var(--footer-bg)) 80px, color-mix(in oklab, var(--k-bg) 30%, var(--footer-bg)) 170px, var(--footer-bg) 260px)",
        color: "var(--footer-text)",
      }}
      className="mt-auto w-full transition-colors duration-300 relative overflow-hidden"
    >
      {/* Pendaran Langit Halus. Lapisan ini di-mask dari transparan di tepi atas: tanpa mask, pendaran radial
          masih punya warna tepat di garis atas footer dan membentuk garis patah dengan konten di atasnya. */}
      <div
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, transparent 0px, var(--sky-top) 260px, transparent 75%), radial-gradient(circle at 75% 85%, var(--sky-glow), transparent 60%)",
          maskImage: "linear-gradient(180deg, transparent 0px, #000 280px)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0px, #000 280px)",
        }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Bagian Atas Footer: Navigasi & Identitas Brand Kodie */}
      <Kontainer className="pt-12 pb-6 relative z-10">
        {/* Grid Navigasi 4 Kolom */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mb-12 text-sm">
          {KOLOM_NAVIGASI.map((kolom) => (
            <div key={kolom.judul}>
              <h2 className="font-display font-bold mb-2">{kolom.judul}</h2>
              <ul style={{ color: "var(--footer-link)" }} className="space-y-0.5 font-medium">
                {kolom.item.map((item) => (
                  <li key={item.label}>
                    {item.jenis === "kiko" ? (
                      <button
                        type="button"
                        onClick={bukaWidgetKikoJikaTutup}
                        onMouseEnter={() => picuEasterEgg(item.sumber)}
                        className="inline-flex min-h-[44px] items-center hover:underline text-left cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onMouseEnter={() => picuEasterEgg(item.sumber)}
                        onClick={() => picuEasterEgg(item.sumber)}
                        className="inline-flex min-h-[44px] items-center hover:underline"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Baris Brand, Sosial Media & Petunjuk Interaktif */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-3">
              <SimbolKodie
                className="h-10 w-auto sm:h-11"
                warnaKurung="var(--footer-bracket)"
                warnaMata="currentColor"
                warnaSenyum="#C6F64D"
              />
              <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Kodie</span>
            </div>
            <p className="font-mono-kodie font-bold text-sm tracking-wide">From Hello World to Hello Future</p>
            <p style={{ color: "var(--footer-muted)" }} className="text-sm pt-0.5">
              Karya lomba SEVENT X 2026 · SDG 4 dan SDG 8. Semua nama dan data di situs ini adalah contoh.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => picuEasterEgg("github")}
                aria-label="GitHub Kodie"
                style={{ borderColor: "var(--footer-btn-border)" }}
                className="w-11 h-11 rounded-xl border flex items-center justify-center hover:border-[#1D4ED8] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => picuEasterEgg("instagram")}
                aria-label="Instagram Kodie"
                style={{ borderColor: "var(--footer-btn-border)" }}
                className="w-11 h-11 rounded-xl border flex items-center justify-center hover:border-[#1D4ED8] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => picuEasterEgg("youtube")}
                aria-label="YouTube Kodie"
                style={{ borderColor: "var(--footer-btn-border)" }}
                className="w-11 h-11 rounded-xl border flex items-center justify-center hover:border-[#1D4ED8] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </button>
            </div>

            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium"
              style={{ borderColor: "var(--footer-btn-border)", color: "var(--footer-muted)" }}
            >
              <span className="w-2 h-2 rounded-full bg-[#C6F64D] ring-1 ring-[#0F172A]/30" aria-hidden="true" />
              <span>Klik karakter, kios, atau kampus di bawah</span>
            </div>
          </div>
        </div>
      </Kontainer>

      {/* Panggung Lanskap Piksel 8-Bit Multi-Layer (176px) */}
      <div id="pixel-stage" className="relative w-full h-[176px] select-none overflow-hidden mt-2">
        <LangitPiksel />
        <BangunanPiksel picuEasterEgg={picuEasterEgg} />
        <KarakterBerjalanPiksel
          bubbleTerlihat={bubbleTerlihat}
          pesanAktif={pesanAktif}
          sedangLompat={sedangLompat}
          picuEasterEgg={picuEasterEgg}
        />
        {/* Layer 4: Trotoar & Garis Tanah Piksel */}
        <div aria-hidden="true" className="pixel-ground absolute inset-x-0 bottom-0 h-4" />
      </div>
    </footer>
  );
}
