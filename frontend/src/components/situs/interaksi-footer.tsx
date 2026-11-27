"use client";

import { useEffect } from "react";

function deteksiTemaSitus(): "day" | "night" {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return "night";
  if (attr === "light") return "day";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "day";
}

/**
 * Interaksi footer piksel tanpa menghidrasi footer-nya. Elemen pemicu memakai `data-easter="<sumber>"`
 * (klik), ditambah `data-easter-hover` untuk tautan navigasi (saat kursor masuk), dan `data-buka-kiko` untuk
 * membuka widget Kiko. Gelembung `#pixel-bubble` dan lompatan `.do-hop` diubah langsung di DOM.
 */
export function InteraksiFooter({ pesan }: { pesan: Record<string, string> }) {
  useEffect(() => {
    const footer = document.getElementById("kodie-footer");
    if (!footer) return;

    const sinkronTema = () => {
      footer.dataset.footerTheme = deteksiTemaSitus();
    };
    sinkronTema();
    const pengamat = new MutationObserver(sinkronTema);
    pengamat.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener("change", sinkronTema);

    let timerGelembung: ReturnType<typeof setTimeout> | undefined;
    let timerLompat: ReturnType<typeof setTimeout> | undefined;
    let bingkai = 0;

    const picu = (sumber: string) => {
      const gelembung = document.getElementById("pixel-bubble");
      if (gelembung) {
        gelembung.textContent = pesan[sumber] || "Semangat belajar! :)";
        gelembung.classList.remove("hidden");
      }
      clearTimeout(timerGelembung);
      timerGelembung = setTimeout(() => gelembung?.classList.add("hidden"), 2600);

      const sprite = document.getElementById("sprite-kiko-svg");
      if (!sprite) return;
      sprite.classList.remove("do-hop");
      clearTimeout(timerLompat);
      cancelAnimationFrame(bingkai);
      // Satu frame tanpa kelas supaya animasi lompat diulang dari awal saat diklik berturut-turut.
      bingkai = requestAnimationFrame(() => {
        sprite.classList.add("do-hop");
        timerLompat = setTimeout(() => sprite.classList.remove("do-hop"), 480);
      });
    };

    const pemicu = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>("[data-easter]") : null;

    const saatKlik = (e: MouseEvent) => {
      const el = pemicu(e.target);
      if (!el || !footer.contains(el)) return;
      picu(el.dataset.easter ?? "");
      if (el.hasAttribute("data-buka-kiko")) window.dispatchEvent(new Event("kodie:buka-kiko"));
    };

    // Setara `mouseenter`: hanya saat kursor masuk dari luar elemen pemicu, bukan berpindah antar-anaknya.
    const saatMasuk = (e: MouseEvent) => {
      const el = pemicu(e.target);
      if (!el || !el.hasAttribute("data-easter-hover")) return;
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      picu(el.dataset.easter ?? "");
    };

    footer.addEventListener("click", saatKlik);
    footer.addEventListener("mouseover", saatMasuk);

    return () => {
      pengamat.disconnect();
      media?.removeEventListener("change", sinkronTema);
      footer.removeEventListener("click", saatKlik);
      footer.removeEventListener("mouseover", saatMasuk);
      clearTimeout(timerGelembung);
      clearTimeout(timerLompat);
      cancelAnimationFrame(bingkai);
    };
  }, [pesan]);

  return null;
}
