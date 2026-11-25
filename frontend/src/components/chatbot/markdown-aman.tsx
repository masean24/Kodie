"use client";

import Link from "next/link";
import { Fragment, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { bersihkanTeksKiko, sanitasiUrlAman, type SitasiChatbot } from "@/lib/chatbot";
import { cx } from "@/lib/cx";

function TombolSalinKode({ teks }: { teks: string }) {
  const [disalin, setDisalin] = useState(false);

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teks);
      setDisalin(true);
      setTimeout(() => setDisalin(false), 1600);
    } catch {
      // Abaikan jika clipboard ditolak browser
    }
  };

  return (
    <button
      type="button"
      onClick={salin}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-text-muted hover:bg-surface hover:text-text"
    >
      {disalin ? <Check aria-hidden className="size-3.5 text-success" /> : <Copy aria-hidden className="size-3.5" />}
      <span>{disalin ? "Disalin" : "Salin"}</span>
    </button>
  );
}

/** Render teks inline: kode, bold, italic, tautan aman, dan badge sitasi `[1]`. */
function renderInline(
  teks: string,
  sitasi: SitasiChatbot[],
  kunciPrefix: string,
): ReactNode[] {
  const pola = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[0-9]+\])/g;
  const hasil: ReactNode[] = [];
  let terakhir = 0;
  let kecocokan: RegExpExecArray | null;
  let nomor = 0;

  while ((kecocokan = pola.exec(teks)) !== null) {
    if (kecocokan.index > terakhir) {
      hasil.push(teks.slice(terakhir, kecocokan.index));
    }
    const token = kecocokan[0];
    const k = `${kunciPrefix}-${nomor++}`;

    // Isi tebal/miring diproses ulang agar tautan dan sitasi di dalamnya (mis. `**[Lihat jadwal](/kelas)**`)
    // tetap menjadi tautan, bukan teks mentah.
    if (token.startsWith("**") && token.endsWith("**")) {
      hasil.push(
        <strong key={k} className="font-bold">
          {renderInline(token.slice(2, -2), sitasi, k)}
        </strong>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      hasil.push(
        <em key={k} className="italic">
          {renderInline(token.slice(1, -1), sitasi, k)}
        </em>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      hasil.push(
        <code key={k} className="rounded bg-surface-sunken px-1 py-0.5 font-mono text-[13px] text-primary">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (/^\[[0-9]+\]$/.test(token)) {
      const idx = Number(token.slice(1, -1));
      const sumber = sitasi.find((s) => s.index === idx);
      const urlAman = sumber ? sanitasiUrlAman(sumber.url) : null;
      if (sumber && urlAman) {
        const internal = urlAman.startsWith("/");
        hasil.push(
          internal ? (
            <Link
              key={k}
              href={urlAman}
              title={sumber.title}
              className="mx-0.5 inline-flex items-center rounded-full bg-primary-subtle px-1.5 py-0.5 text-[11px] font-bold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {idx}
            </Link>
          ) : (
            <a
              key={k}
              href={urlAman}
              target="_blank"
              rel="noopener noreferrer"
              title={sumber.title}
              className="mx-0.5 inline-flex items-center rounded-full bg-primary-subtle px-1.5 py-0.5 text-[11px] font-bold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {idx}
            </a>
          ),
        );
      } else {
        hasil.push(
          <span
            key={k}
            className="mx-0.5 inline-flex items-center rounded-full bg-neutral-subtle px-1.5 py-0.5 text-[11px] font-semibold text-text-muted"
          >
            {idx}
          </span>,
        );
      }
    } else {
      const mLink = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (mLink) {
        const [, label, rawHref] = mLink;
        const urlAman = sanitasiUrlAman(rawHref);
        if (urlAman) {
          const internal = urlAman.startsWith("/");
          hasil.push(
            internal ? (
              <Link key={k} href={urlAman} className="font-semibold text-primary underline hover:text-primary-hover">
                {label}
              </Link>
            ) : (
              <a
                key={k}
                href={urlAman}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-semibold text-primary underline hover:text-primary-hover"
              >
                <span>{label}</span>
                <ExternalLink aria-hidden className="size-3" />
              </a>
            ),
          );
        } else {
          hasil.push(label);
        }
      } else {
        hasil.push(token);
      }
    }

    terakhir = kecocokan.index + token.length;
  }

  if (terakhir < teks.length) {
    hasil.push(teks.slice(terakhir));
  }
  return hasil;
}

/**
 * Renderer Markdown aman berbasis AST baris (tanpa `dangerouslySetInnerHTML`).
 * Mendukung heading, list, code block + copy, tabel sederhana, tautan aman, dan badge sitasi `[n]`.
 */
export function MarkdownAman({
  teks,
  sitasi = [],
  className,
}: {
  teks: string;
  sitasi?: SitasiChatbot[];
  className?: string;
}) {
  // Penanda konteks prompt internal yang kadang ikut tertulis model dibuang sebelum dirender.
  const baris = bersihkanTeksKiko(teks).replace(/\r\n/g, "\n").split("\n");
  const elemen: ReactNode[] = [];
  let i = 0;

  while (i < baris.length) {
    const b = baris[i] ?? "";

    // Blok kode ```
    if (b.trim().startsWith("```")) {
      const bahasa = b.trim().slice(3).trim();
      const isiKode: string[] = [];
      i++;
      while (i < baris.length && !(baris[i] ?? "").trim().startsWith("```")) {
        isiKode.push(baris[i] ?? "");
        i++;
      }
      i++;
      const kodeGabung = isiKode.join("\n");
      elemen.push(
        <div key={`code-${i}`} className="my-2 overflow-hidden rounded-md border border-border bg-surface-sunken">
          <div className="flex items-center justify-between border-b border-border px-2.5 py-1 text-xs text-text-muted">
            <span>{bahasa || "kode"}</span>
            <TombolSalinKode teks={kodeGabung} />
          </div>
          <pre className="overflow-x-auto p-2.5 font-mono text-[13px] leading-5">
            <code>{kodeGabung}</code>
          </pre>
        </div>,
      );
      continue;
    }

    // Tabel Markdown sederhana | a | b |
    if (b.trim().startsWith("|") && i + 1 < baris.length && /^\s*\|[\s:-]+\|/.test(baris[i + 1] ?? "")) {
      const parseRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      const headerCols = parseRow(b);
      i += 2;
      const bodyRows: string[][] = [];
      while (i < baris.length && (baris[i] ?? "").trim().startsWith("|")) {
        bodyRows.push(parseRow(baris[i] ?? ""));
        i++;
      }
      elemen.push(
        <div key={`tbl-${i}`} className="my-2 overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="bg-surface-sunken">
                {headerCols.map((h, hi) => (
                  <th key={hi} className="border-b border-border px-2.5 py-1.5 font-bold">
                    {renderInline(h, sitasi, `th-${i}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-b-0">
                  {headerCols.map((_, ci) => (
                    <td key={ci} className="px-2.5 py-1.5">
                      {renderInline(row[ci] ?? "", sitasi, `td-${i}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Heading
    const mH = /^(#{1,3})\s+(.+)$/.exec(b.trim());
    if (mH) {
      const level = mH[1].length;
      const isi = mH[2];
      elemen.push(
        <p
          key={`h-${i}`}
          className={cx("font-display font-bold", level === 1 ? "text-base" : "text-[15px]", "mt-2 first:mt-0")}
        >
          {renderInline(isi, sitasi, `h-${i}`)}
        </p>,
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*•]\s+/.test(b)) {
      const items: string[] = [];
      while (i < baris.length && /^\s*[-*•]\s+/.test(baris[i] ?? "")) {
        items.push((baris[i] ?? "").replace(/^\s*[-*•]\s+/, ""));
        i++;
      }
      elemen.push(
        <ul key={`ul-${i}`} className="my-1.5 flex list-disc flex-col gap-1 pl-5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, sitasi, `ul-${i}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(b)) {
      const items: string[] = [];
      while (i < baris.length && /^\s*\d+\.\s+/.test(baris[i] ?? "")) {
        items.push((baris[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      elemen.push(
        <ol key={`ol-${i}`} className="my-1.5 flex list-decimal flex-col gap-1 pl-5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, sitasi, `ol-${i}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Baris kosong
    if (b.trim() === "") {
      i++;
      continue;
    }

    // Paragraf
    const para: string[] = [b];
    i++;
    while (
      i < baris.length &&
      (baris[i] ?? "").trim() !== "" &&
      !(baris[i] ?? "").trim().startsWith("```") &&
      !/^\s*([-*•]|\d+\.|#{1,3})\s+/.test(baris[i] ?? "") &&
      !(baris[i] ?? "").trim().startsWith("|")
    ) {
      para.push(baris[i] ?? "");
      i++;
    }
    elemen.push(
      <p key={`p-${i}`} className="my-1.5 leading-[22px] first:mt-0 last:mb-0">
        {para.map((line, li) => (
          <Fragment key={li}>
            {li > 0 ? <br /> : null}
            {renderInline(line, sitasi, `p-${i}-${li}`)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div className={cx("text-[14px] leading-[22px] break-words", className)}>{elemen}</div>;
}
