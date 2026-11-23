"use client";

import { useEffect, useRef } from "react";
import { basicSetup } from "codemirror";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";

export type BahasaLab = "html" | "css" | "js" | "python";

const BAHASA = {
  html: () => html(),
  css: () => css(),
  js: () => javascript(),
  python: () => python(),
} satisfies Record<BahasaLab, () => unknown>;

/** Tema editor memakai token situs, jadi otomatis ikut mode terang/gelap. */
const temaKodie = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--k-surface)",
    color: "var(--k-text)",
    fontSize: "15px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    lineHeight: "1.65",
  },
  ".cm-content": { caretColor: "var(--k-primary)", padding: "12px 0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--k-primary)", borderLeftWidth: "2px" },
  ".cm-gutters": {
    backgroundColor: "var(--k-surface-sunken)",
    color: "var(--k-text-muted)",
    border: "none",
  },
  ".cm-activeLine": { backgroundColor: "var(--lab-sel)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--lab-sel)", color: "var(--k-text)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--lab-sel)" },
  ".cm-matchingBracket": { outline: "1px solid var(--k-primary)", backgroundColor: "transparent" },
  ".cm-tooltip": {
    backgroundColor: "var(--k-surface-raised)",
    color: "var(--k-text)",
    border: "1px solid var(--k-border)",
    borderRadius: "8px",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--k-primary)", color: "var(--k-primary-foreground)" },
});

const sorotanKodie = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.moduleKeyword, t.definitionKeyword], color: "var(--lab-kw)", fontWeight: "600" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--lab-str)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--lab-num)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--lab-com)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.className], color: "var(--lab-fn)" },
  { tag: [t.tagName, t.angleBracket], color: "var(--lab-tag)" },
  { tag: [t.attributeName, t.propertyName], color: "var(--lab-attr)" },
  { tag: [t.heading], fontWeight: "700" },
  { tag: t.invalid, color: "var(--k-danger)" },
]);

/**
 * Editor CodeMirror 6. Komponen ini tidak dikontrol: nilai awal dibaca sekali saat mount,
 * perubahan dikirim lewat `onUbah`. Ganti `key` untuk memuat dokumen lain.
 * Ctrl/Cmd + Enter menjalankan kode.
 */
export function EditorKode({
  bahasa,
  nilaiAwal,
  label,
  onUbah,
  onJalankan,
}: {
  bahasa: BahasaLab;
  nilaiAwal: string;
  label: string;
  onUbah: (nilai: string) => void;
  onJalankan: () => void;
}) {
  const wadah = useRef<HTMLDivElement>(null);
  const ubahRef = useRef(onUbah);
  const jalankanRef = useRef(onJalankan);

  useEffect(() => {
    ubahRef.current = onUbah;
    jalankanRef.current = onJalankan;
  });

  useEffect(() => {
    if (!wadah.current) return;
    const view = new EditorView({
      parent: wadah.current,
      state: EditorState.create({
        doc: nilaiAwal,
        extensions: [
          Prec.highest(
            keymap.of([
              {
                key: "Mod-Enter",
                run: () => {
                  jalankanRef.current();
                  return true;
                },
              },
            ]),
          ),
          basicSetup,
          BAHASA[bahasa](),
          temaKodie,
          syntaxHighlighting(sorotanKodie),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": label }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) ubahRef.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    return () => view.destroy();
    // Editor dibuat sekali per mount; dokumen lain dimuat dengan mengganti `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={wadah} className="h-full min-h-0 overflow-hidden" />;
}
