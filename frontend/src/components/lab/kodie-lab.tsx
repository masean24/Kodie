"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Code2, Eraser, FileCode2, Loader2, Play, RotateCcw, Square, Terminal } from "lucide-react";
import { cx } from "@/lib/cx";
import { EditorKode, type BahasaLab } from "./editor-kode";
import { CONTOH_CSS, CONTOH_HTML, CONTOH_JS, CONTOH_PYTHON } from "./contoh-lab";

type Mode = "web" | "python";
type BerkasWeb = "html" | "css" | "js";
type Baris = { aliran: "stdout" | "stderr" | "warn" | "info"; teks: string };
type StatusPython = "belum" | "memuat" | "siap" | "jalan" | "gagal";

type Simpanan = {
  mode: Mode;
  web: Record<BerkasWeb, string>;
  python: string;
};

const KUNCI = "kodie:lab:v1";
const MAKS_BARIS = 500;

const NAMA_BERKAS: Record<BerkasWeb, string> = { html: "index.html", css: "style.css", js: "script.js" };

function contohAwal(): Simpanan {
  return { mode: "web", web: { html: CONTOH_HTML, css: CONTOH_CSS, js: CONTOH_JS }, python: CONTOH_PYTHON };
}

/** Komponen ini hanya dirender di browser (lihat `lab-klien.tsx`), jadi aman membaca localStorage. */
function bacaSimpanan(): Simpanan {
  try {
    const mentah = localStorage.getItem(KUNCI);
    if (!mentah) return contohAwal();
    const s = JSON.parse(mentah) as Partial<Simpanan>;
    const awal = contohAwal();
    return {
      mode: s.mode === "python" ? "python" : "web",
      web: {
        html: typeof s.web?.html === "string" ? s.web.html : awal.web.html,
        css: typeof s.web?.css === "string" ? s.web.css : awal.web.css,
        js: typeof s.web?.js === "string" ? s.web.js : awal.web.js,
      },
      python: typeof s.python === "string" ? s.python : awal.python,
    };
  } catch {
    return contohAwal();
  }
}

/** Skrip penghubung di iframe: meneruskan console.log dan galat ke panel Konsol. */
const JEMBATAN_KONSOL = `<script>
(function () {
  function teks(v) {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  function kirim(aliran, args) {
    try { parent.postMessage({ kodieLab: true, aliran: aliran, teks: Array.prototype.map.call(args, teks).join(" ") }, "*"); } catch (e) {}
  }
  var peta = { log: "stdout", info: "info", warn: "warn", error: "stderr" };
  Object.keys(peta).forEach(function (m) {
    var asli = console[m];
    console[m] = function () { kirim(peta[m], arguments); asli.apply(console, arguments); };
  });
  window.addEventListener("error", function (e) {
    kirim("stderr", [e.message + (e.lineno ? " (baris " + e.lineno + ")" : "")]);
  });
})();
</script>`;

function rakitDokumen(web: Record<BerkasWeb, string>, putaran: number) {
  // Cegah kode siswa menutup tag <script> pembungkus lebih awal.
  const js = web.js.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- putaran ${putaran} -->
${JEMBATAN_KONSOL}
<style>
${web.css}
</style>
</head>
<body>
${web.html}
<script>
${js}
</script>
</body>
</html>`;
}

export function KodieLab() {
  const [kode, setKode] = useState<Simpanan>(bacaSimpanan);
  const mode = kode.mode;
  const [berkas, setBerkas] = useState<BerkasWeb>("html");
  const [versiEditor, setVersiEditor] = useState(0);
  const [tersimpan, setTersimpan] = useState(true);
  // Salinan terbaru untuk handler yang dipanggil beruntun sebelum React merender ulang.
  const terbaru = useRef(kode);

  const [dokumen, setDokumen] = useState(() => rakitDokumen(kode.web, 0));
  const putaran = useRef(0);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [konsolWeb, setKonsolWeb] = useState<Baris[]>([]);

  const [keluaranPy, setKeluaranPy] = useState<Baris[]>([]);
  const [statusPy, setStatusPy] = useState<StatusPython>("belum");
  const [pesanGagal, setPesanGagal] = useState<string>();
  const [durasi, setDurasi] = useState<number>();
  const worker = useRef<Worker | null>(null);
  const timerSimpan = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Perbarui kode dan simpan ke localStorage (ditunda 400 ms agar tidak menulis di setiap ketukan). */
  const perbarui = (ubah: (k: Simpanan) => Simpanan) => {
    const baru = ubah(terbaru.current);
    terbaru.current = baru;
    setKode(baru);
    setTersimpan(false);
    if (timerSimpan.current) clearTimeout(timerSimpan.current);
    timerSimpan.current = setTimeout(() => {
      try {
        localStorage.setItem(KUNCI, JSON.stringify(baru));
        setTersimpan(true);
      } catch {
        // Penyimpanan penuh atau diblokir: kode tetap ada selama tab terbuka.
      }
    }, 400);
  };

  // Konsol dari iframe pratinjau.
  useEffect(() => {
    const terima = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow) return;
      const d = e.data as { kodieLab?: boolean; aliran?: Baris["aliran"]; teks?: string };
      if (!d?.kodieLab || typeof d.teks !== "string") return;
      const baris: Baris = { aliran: d.aliran ?? "stdout", teks: d.teks };
      setKonsolWeb((k) => [...k, baris].slice(-MAKS_BARIS));
    };
    window.addEventListener("message", terima);
    return () => window.removeEventListener("message", terima);
  }, []);

  const buatWorker = useCallback(() => {
    const w = new Worker("/lab/python-worker.js", { type: "module" });
    w.onmessage = (e: MessageEvent) => {
      const d = e.data as
        | { jenis: "status"; status: "memuat" | "siap" | "gagal"; pesan?: string }
        | { jenis: "keluaran"; aliran: "stdout" | "stderr"; teks: string }
        | { jenis: "selesai"; galat: boolean; durasi?: number };
      if (d.jenis === "status") {
        if (d.status === "gagal") {
          setStatusPy("gagal");
          setPesanGagal("Python gagal dimuat. Periksa koneksi internet, lalu coba lagi.");
        } else {
          setStatusPy((s) => (s === "jalan" ? s : d.status));
        }
      } else if (d.jenis === "keluaran") {
        const baris: Baris = { aliran: d.aliran, teks: d.teks };
        setKeluaranPy((k) => [...k, baris].slice(-MAKS_BARIS));
      } else if (d.jenis === "selesai") {
        setDurasi(d.durasi);
        setStatusPy((s) => (s === "gagal" ? s : "siap"));
      }
    };
    worker.current = w;
    return w;
  }, []);

  const pastikanWorker = useCallback(() => worker.current ?? buatWorker(), [buatWorker]);

  // Muat Python di latar begitu mode Python dibuka, supaya klik Jalankan pertama terasa cepat.
  useEffect(() => {
    if (mode !== "python" || worker.current) return;
    pastikanWorker().postMessage({ jenis: "muat" });
  }, [mode, pastikanWorker]);

  useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
      if (timerSimpan.current) clearTimeout(timerSimpan.current);
    },
    [],
  );

  const jalankan = useCallback(() => {
    if (mode === "web") {
      putaran.current += 1;
      setKonsolWeb([]);
      setDokumen(rakitDokumen(terbaru.current.web, putaran.current));
      return;
    }
    if (statusPy === "jalan") return;
    setPesanGagal(undefined);
    setKeluaranPy([]);
    setDurasi(undefined);
    setStatusPy("jalan");
    putaran.current += 1;
    pastikanWorker().postMessage({ jenis: "jalankan", id: putaran.current, kode: terbaru.current.python });
  }, [mode, statusPy, pastikanWorker]);

  const hentikan = () => {
    worker.current?.terminate();
    worker.current = null;
    setKeluaranPy((k) => [...k, { aliran: "warn", teks: "Program dihentikan." }]);
    setStatusPy("belum");
    pastikanWorker().postMessage({ jenis: "muat" });
  };

  const gantiMode = (m: Mode) => perbarui((k) => ({ ...k, mode: m }));

  const ubahKode = (b: BahasaLab, nilai: string) =>
    perbarui((k) => (b === "python" ? { ...k, python: nilai } : { ...k, web: { ...k.web, [b]: nilai } }));

  const kembalikanContoh = () => {
    const pesan =
      mode === "web"
        ? "Kembalikan HTML, CSS, dan JavaScript ke kode contoh? Kodemu di mode Web akan terhapus."
        : "Kembalikan kode Python ke contoh? Kodemu di mode Python akan terhapus.";
    if (!window.confirm(pesan)) return;
    const c = contohAwal();
    perbarui((k) => (mode === "web" ? { ...k, web: c.web } : { ...k, python: c.python }));
    setVersiEditor((v) => v + 1);
  };

  const bersihkan = () => (mode === "web" ? setKonsolWeb([]) : setKeluaranPy([]));

  const bahasaAktif: BahasaLab = mode === "python" ? "python" : berkas;
  const nilaiAktif = mode === "python" ? kode.python : kode.web[berkas];
  const sedangJalan = mode === "python" && statusPy === "jalan";
  const pyBelumSiap = mode === "python" && (statusPy === "belum" || statusPy === "memuat");

  return (
    <div className="lab flex flex-col gap-4">
      {/* Bilah alat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Bahasa" className="relative grid grid-cols-2 rounded-full border-[1.5px] border-border-strong bg-surface p-[3px]">
          {(
            [
              { nilai: "web", label: "HTML, CSS, JS", ikon: Code2 },
              { nilai: "python", label: "Python", ikon: FileCode2 },
            ] as const
          ).map((o) => {
            const aktif = mode === o.nilai;
            return (
              <button
                key={o.nilai}
                type="button"
                role="radio"
                aria-checked={aktif}
                onClick={() => gantiMode(o.nilai)}
                className={cx(
                  "relative flex min-h-[40px] items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition-colors sm:text-base",
                  aktif ? "text-primary-foreground" : "text-text-muted hover:text-text",
                )}
              >
                {aktif ? (
                  <motion.span
                    layoutId="mode-lab"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                ) : null}
                <o.ikon aria-hidden className="relative size-4" />
                <span className="relative whitespace-nowrap">{o.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span aria-live="polite" className="text-sm text-text-muted">
            {tersimpan ? "Tersimpan di browser ini" : "Menyimpan…"}
          </span>
          <button
            type="button"
            onClick={kembalikanContoh}
            className="flex min-h-touch items-center gap-2 rounded-full border-[1.5px] border-border-strong bg-surface px-4 text-sm font-bold hover:bg-surface-sunken"
          >
            <RotateCcw aria-hidden className="size-4" />
            Kembalikan contoh
          </button>
          {sedangJalan ? (
            <button
              type="button"
              onClick={hentikan}
              className="flex min-h-touch items-center gap-2 rounded-full bg-danger px-5 font-display font-semibold text-danger-foreground hover:bg-danger-hover"
            >
              <Square aria-hidden className="size-4 fill-current" />
              Hentikan
            </button>
          ) : (
            <motion.button
              type="button"
              onClick={jalankan}
              whileTap={{ scale: 0.96 }}
              aria-keyshortcuts="Control+Enter"
              title="Jalankan (Ctrl + Enter)"
              className="flex min-h-touch items-center gap-2 rounded-full bg-cta px-5 font-display font-semibold text-cta-foreground hover:bg-cta-hover"
            >
              <Play aria-hidden className="size-4 fill-current" />
              Jalankan
              <kbd className="hidden rounded bg-black/10 px-1.5 py-0.5 text-xs font-bold sm:inline">Ctrl + Enter</kbd>
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <section aria-label="Editor kode" className="flex h-[420px] flex-col overflow-hidden rounded-card border border-border bg-surface md:h-[520px] lg:h-[600px]">
          <div className="flex items-center gap-1 border-b border-border bg-surface-sunken px-2 pt-2">
            {mode === "web" ? (
              <div role="tablist" aria-label="Berkas" className="flex gap-1">
                {(Object.keys(NAMA_BERKAS) as BerkasWeb[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    role="tab"
                    aria-selected={berkas === b}
                    onClick={() => setBerkas(b)}
                    className={cx(
                      "min-h-[40px] rounded-t-[10px] px-3 font-mono text-sm font-bold transition-colors",
                      berkas === b ? "bg-surface text-primary" : "text-text-muted hover:text-text",
                    )}
                  >
                    {NAMA_BERKAS[b]}
                  </button>
                ))}
              </div>
            ) : (
              <span className="min-h-[40px] rounded-t-[10px] bg-surface px-3 py-2 font-mono text-sm font-bold text-primary">main.py</span>
            )}
          </div>
          <div className="min-h-0 flex-1">
            <EditorKode
              key={`${bahasaAktif}-${versiEditor}`}
              bahasa={bahasaAktif}
              nilaiAwal={nilaiAktif}
              label={mode === "python" ? "Kode Python" : `Kode ${NAMA_BERKAS[berkas]}`}
              onUbah={(v) => ubahKode(bahasaAktif, v)}
              onJalankan={jalankan}
            />
          </div>
        </section>

        {/* Hasil */}
        {mode === "web" ? (
          <div className="flex h-[520px] flex-col gap-4 lg:h-[600px]">
            <section aria-label="Pratinjau" className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-card border border-border bg-surface">
              <JudulPanel ikon={<Code2 aria-hidden className="size-4" />} judul="Pratinjau" />
              <iframe
                ref={iframe}
                title="Pratinjau hasil kode"
                sandbox="allow-scripts allow-modals"
                srcDoc={dokumen}
                className="min-h-0 w-full flex-1 bg-white"
              />
            </section>
            <PanelKonsol judul="Konsol" baris={konsolWeb} kosong="console.log() akan muncul di sini." onBersihkan={bersihkan} kecil />
          </div>
        ) : (
          <div className="flex h-[420px] flex-col md:h-[520px] lg:h-[600px]">
            <PanelKonsol
              judul="Keluaran"
              baris={keluaranPy}
              onBersihkan={bersihkan}
              kosong={
                pyBelumSiap
                  ? "Menyiapkan Python di browser… (sekitar 10 MB, hanya saat pertama)"
                  : statusPy === "gagal"
                    ? (pesanGagal ?? "Python gagal dimuat.")
                    : "Klik Jalankan untuk melihat hasil print() di sini."
              }
              status={
                statusPy === "jalan" ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                    <Loader2 aria-hidden className="size-4 animate-spin" /> Berjalan…
                  </span>
                ) : pyBelumSiap ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                    <Loader2 aria-hidden className="size-4 animate-spin" /> Memuat Python
                  </span>
                ) : durasi !== undefined ? (
                  <span className="text-sm text-text-muted">Selesai dalam {(durasi / 1000).toFixed(2).replace(".", ",")} detik</span>
                ) : null
              }
            />
          </div>
        )}
      </div>
      <p className="text-sm text-text-muted">
        Kode disimpan otomatis di browser ini saja. Kode web berjalan di bingkai terisolasi, dan Python berjalan langsung di browser
        dengan Pyodide. <code>input()</code> belum didukung.
      </p>
    </div>
  );
}

function JudulPanel({ ikon, judul, aksi }: { ikon: React.ReactNode; judul: string; aksi?: React.ReactNode }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-2 border-b border-border bg-surface-sunken px-4">
      <h2 className="inline-flex items-center gap-2 text-sm font-bold">
        {ikon}
        {judul}
      </h2>
      {aksi}
    </div>
  );
}

const WARNA_ALIRAN: Record<Baris["aliran"], string> = {
  stdout: "text-text",
  info: "text-info",
  warn: "text-warning",
  stderr: "text-danger",
};

function PanelKonsol({
  judul,
  baris,
  kosong,
  onBersihkan,
  status,
  kecil,
}: {
  judul: string;
  baris: Baris[];
  kosong: string;
  onBersihkan: () => void;
  status?: React.ReactNode;
  kecil?: boolean;
}) {
  const akhir = useRef<HTMLDivElement>(null);
  useEffect(() => {
    akhir.current?.scrollIntoView({ block: "nearest" });
  }, [baris]);

  return (
    <section aria-label={judul} className={cx("flex min-h-0 flex-col overflow-hidden rounded-card border border-border bg-surface", kecil ? "flex-[2]" : "flex-1")}>
      <JudulPanel
        ikon={<Terminal aria-hidden className="size-4" />}
        judul={judul}
        aksi={
          <div className="flex items-center gap-3">
            {status}
            <button
              type="button"
              onClick={onBersihkan}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2 text-sm font-bold text-text-muted hover:text-text"
            >
              <Eraser aria-hidden className="size-4" />
              Bersihkan
            </button>
          </div>
        }
      />
      <div role="log" aria-live="polite" className="min-h-0 flex-1 overflow-auto p-4 font-mono text-sm leading-6">
        {baris.length === 0 ? (
          <p className="text-text-muted">{kosong}</p>
        ) : (
          baris.map((b, i) => (
            <pre key={i} className={cx("whitespace-pre-wrap break-words", WARNA_ALIRAN[b.aliran])}>
              {b.teks}
            </pre>
          ))
        )}
        <div ref={akhir} />
      </div>
    </section>
  );
}
