import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TeksMd } from "./teks-md";

const render = (teks: string) => renderToStaticMarkup(createElement(TeksMd, { teks }));

describe("TeksMd", () => {
  it("merender kode, tebal, dan miring", () => {
    const html = render("Pakai `html` dan **body**, uji *share screen*.");
    expect(html).toContain('<code class="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.9em] text-primary">html</code>');
    expect(html).toContain("<strong>body</strong>");
    expect(html).toContain("<em>share screen</em>");
    expect(html).not.toContain("`");
    expect(html).not.toContain("**");
  });

  it("tag HTML di konten tampil sebagai teks, bukan elemen", () => {
    const html = render("Menulis `<h1>` dan <script>alert(1)</script>");
    expect(html).toContain("&lt;h1&gt;");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
