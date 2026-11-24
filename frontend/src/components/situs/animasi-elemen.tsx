"use client";

import { useEffect } from "react";
import { gsap, kurangiGerak } from "@/lib/gsap";

/**
 * Elemen yang dianimasikan: blok konten "utuh" (judul, paragraf, item daftar, kartu, form, tabel, gambar,
 * tombol tautan). Bila sebuah elemen punya leluhur yang juga cocok, hanya leluhurnya yang dianimasikan,
 * jadi kartu bergerak sebagai satu kesatuan dan isinya tidak berkedip sendiri-sendiri.
 */
const PILIH = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "li",
  "dl",
  "article",
  "form",
  "table",
  "figure",
  "blockquote",
  "details",
  "img",
  ".lab",
  "[data-animasi]",
  "[class*='rounded-card']",
  "[class*='shadow-kartu']",
  "a[class*='rounded']",
  "button[class*='rounded']",
].join(",");

/** Wilayah yang punya animasi sendiri, berisi editor interaktif, atau harus diam (live region, dialog). */
const LUAR = [
  "[data-tanpa-animasi]",
  ".hero-kodie",
  ".cm-editor",
  ".injectionDiv",
  "#pixel-stage",
  "[role='dialog']",
  "[aria-live]",
  "[contenteditable='true']",
  "svg",
].join(",");

const AKAR = ["#konten", "#kodie-footer"];

/** Lama pemindaian ulang setelah halaman dimuat, menunggu bagian Suspense selesai dihidrasi React. */
const MASA_TUNGGU_HIDRASI = 8000;
/** Batas paling lama konten awal disembunyikan sebelum tetap ditampilkan. */
const BATAS_PRA = 900;

function kandidat(el: Element): boolean {
  return el.matches(PILIH) && !el.closest(LUAR) && !el.classList.contains("sr-only");
}

/**
 * React menandai node yang sudah dihidrasi dengan properti `__reactFiber$…`. Node yang belum dihidrasi
 * tidak boleh diubah gayanya, karena React akan melaporkan hydration mismatch dan isi node bisa tertinggal.
 */
function terhidrasi(el: Element): boolean {
  for (const k in el) if (k.startsWith("__reactFiber$")) return true;
  return false;
}

/** Leluhur yang sudah cocok, atau sudah dianimasikan Motion (`style` berisi opacity), menang. */
function punyaLeluhurBeranimasi(el: Element, akar: Element): boolean {
  let p = el.parentElement;
  while (p && p !== akar) {
    if (kandidat(p)) return true;
    const gaya = p.getAttribute("style");
    if (gaya && gaya.includes("opacity")) return true;
    p = p.parentElement;
  }
  return false;
}

type Hasil = "ya" | "tunggu" | "tidak";

function periksa(el: Element, akar: Element, sudah: WeakSet<Element>): Hasil {
  if (!(el instanceof HTMLElement) || sudah.has(el) || !kandidat(el)) return "tidak";
  // Elemen yang sudah punya opacity/transform inline (Motion, posisi manual) tidak disentuh: `clearProps`
  // di akhir animasi akan menghapus nilai aslinya.
  const gaya = el.getAttribute("style");
  if (gaya && (gaya.includes("opacity") || gaya.includes("transform"))) return "tidak";
  if (punyaLeluhurBeranimasi(el, akar)) return "tidak";
  if (el.getClientRects().length === 0) return "tidak";
  if (getComputedStyle(el).position === "fixed") return "tidak";
  return terhidrasi(el) ? "ya" : "tunggu";
}

function diLayar(el: Element) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

/**
 * Reveal elemen di seluruh situs dengan GSAP: setiap blok konten naik halus dan muncul saat masuk layar,
 * berurutan per kelompok yang masuk bersamaan. Dipasang sekali di `KerangkaSitus`, jadi berlaku untuk
 * semua halaman publik, auth, dan area login. Konten yang datang belakangan (Suspense, navigasi, daftar
 * realtime) ditangkap `MutationObserver` dan pemindaian ulang singkat setelah dimuat.
 *
 * `#konten` disembunyikan sebentar lewat `[data-gerak="pra"]` (skrip `<head>` di `app/layout.tsx`) agar
 * konten awal tidak berkedip; CSS punya cadangan yang menampilkannya sendiri bila skrip ini tidak berjalan.
 * Dengan `prefers-reduced-motion`, tidak ada yang dianimasikan.
 */
export function AnimasiElemen() {
  useEffect(() => {
    const html = document.documentElement;
    if (kurangiGerak()) {
      delete html.dataset.gerak;
      return;
    }

    const sudah = new WeakSet<Element>();
    /** Elemen yang sudah disembunyikan tetapi belum muncul; dikembalikan saat cleanup (StrictMode, unmount). */
    const menunggu = new Set<Element>();
    const akarAda = AKAR.map((s) => document.querySelector(s)).filter((x): x is Element => x !== null);

    const munculkan = (masuk: Element[]) => {
      if (masuk.length === 0) return;
      for (const el of masuk) {
        pengintai.unobserve(el);
        menunggu.delete(el);
      }
      masuk.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      gsap.to(masuk, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.06,
        overwrite: true,
        clearProps: "opacity,transform",
      });
    };

    const pengintai = new IntersectionObserver(
      (catatan) => munculkan(catatan.filter((c) => c.isIntersecting).map((c) => c.target)),
      { rootMargin: "0px 0px -6% 0px" },
    );

    /**
     * Pengaman: elemen yang sudah berada di layar tetapi belum dimunculkan IntersectionObserver
     * (misalnya browser menunda callback saat View Transition atau tab baru aktif) tetap dimunculkan,
     * supaya konten tidak pernah tertinggal transparan.
     */
    const amankan = () => {
      if (menunggu.size === 0) return;
      munculkan([...menunggu].filter((el) => diLayar(el)));
    };
    let bingkaiAman = 0;
    const saatGulir = () => {
      if (bingkaiAman) return;
      bingkaiAman = window.setTimeout(() => {
        bingkaiAman = 0;
        amankan();
      }, 400);
    };
    window.addEventListener("scroll", saatGulir, { passive: true });
    const timerAman = window.setInterval(amankan, 1500);
    const saatTerlihat = () => document.visibilityState === "visible" && amankan();
    document.addEventListener("visibilitychange", saatTerlihat);

    /** Siapkan elemen yang layak; kembalikan jumlah elemen di layar yang masih menunggu hidrasi. */
    const pindai = (dari: Element) => {
      const akar = akarAda.find((a) => a === dari || a.contains(dari));
      if (!akar) return 0;
      const calon = dari.matches(PILIH) ? [dari, ...dari.querySelectorAll(PILIH)] : [...dari.querySelectorAll(PILIH)];
      const siap: HTMLElement[] = [];
      let tertunda = 0;
      for (const el of calon) {
        const h = periksa(el, akar, sudah);
        if (h === "ya") siap.push(el as HTMLElement);
        else if (h === "tunggu" && diLayar(el)) tertunda++;
      }
      if (siap.length > 0) {
        for (const el of siap) sudah.add(el);
        gsap.set(siap, { opacity: 0, y: 18 });
        for (const el of siap) {
          menunggu.add(el);
          pengintai.observe(el);
        }
      }
      return tertunda;
    };

    const pindaiSemua = () => akarAda.reduce((n, akar) => n + pindai(akar), 0);

    const mulai = performance.now();
    let praAktif = "gerak" in html.dataset;
    const lepasPra = () => {
      if (!praAktif) return;
      praAktif = false;
      delete html.dataset.gerak;
    };

    if (pindaiSemua() === 0) lepasPra();

    // Pindai ulang sampai bagian Suspense selesai dihidrasi; hidrasi tidak memicu MutationObserver.
    const timer = window.setInterval(() => {
      const tertunda = pindaiSemua();
      const lama = performance.now() - mulai;
      if (tertunda === 0 || lama > BATAS_PRA) lepasPra();
      if (lama > MASA_TUNGGU_HIDRASI) window.clearInterval(timer);
    }, 120);

    const pengamat = new MutationObserver((catatan) => {
      for (const c of catatan) {
        for (const n of c.addedNodes) {
          if (n instanceof Element && !n.closest(LUAR)) pindai(n);
        }
      }
    });
    for (const akar of akarAda) pengamat.observe(akar, { childList: true, subtree: true });

    return () => {
      window.clearInterval(timer);
      window.clearInterval(timerAman);
      window.clearTimeout(bingkaiAman);
      window.removeEventListener("scroll", saatGulir);
      document.removeEventListener("visibilitychange", saatTerlihat);
      pengamat.disconnect();
      pengintai.disconnect();
      if (menunggu.size > 0) gsap.set([...menunggu], { clearProps: "opacity,transform" });
      menunggu.clear();
      lepasPra();
    };
  }, []);

  return null;
}
