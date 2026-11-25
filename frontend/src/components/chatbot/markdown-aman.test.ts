import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownAman } from "./markdown-aman";

const render = (teks: string) => renderToStaticMarkup(createElement(MarkdownAman, { teks }));

describe("MarkdownAman", () => {
  it("merender tautan biasa sebagai <a>", () => {
    const html = render("Silakan [Lihat Jadwal Kelas](/kelas).");
    expect(html).toContain('href="/kelas"');
    expect(html).not.toContain("](/kelas)");
  });

  it("merender tautan di dalam teks tebal dan miring", () => {
    const tebal = render("**[Lihat Jadwal Kelas](/daftar)**");
    expect(tebal).toContain('href="/daftar"');
    expect(tebal).not.toContain("](/daftar)");
    const miring = render("*cek [katalog](/kelas) ya*");
    expect(miring).toContain('href="/kelas"');
  });

  it("menolak skema URL berbahaya di dalam teks tebal", () => {
    const html = render("**[klik](javascript:alert(1))**");
    expect(html).not.toContain("javascript:");
  });
});
