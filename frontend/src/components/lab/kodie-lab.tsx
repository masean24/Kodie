"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as KeyboardEventReact, type ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import { Code2, Copy, Eraser, FileCode2, Lightbulb, Loader2, Play, Puzzle, RotateCcw, Square, Terminal, Turtle, X } from "lucide-react";
import { cx } from "@/lib/cx";
import { blokKePython, CONTOH_BLOK, jalankanBlok } from "@/lib/lab/blok";
import { mintaPetunjukLab, type BerkasTemuan, type ResponsLabMentor, type TemuanLab } from "@/lib/lab/mentor";
import { jalankanPerintah, type Adegan, type PerintahTurtle } from "@/lib/lab/turtle";
import { AvatarBitCat } from "./avatar-bit-cat";
import dynamic from "next/dynamic";
import { StatusMemuat } from "@/components/ui/dasar";
import type { BahasaLab, FokusBaris, PenandaBaris } from "./editor-kode";
import { EditorBlok } from "./editor-blok";
import { KanvasTurtle } from "./kanvas-turtle";
import { PanelBitCat } from "./panel-bit-cat";
import { CONTOH_CSS, CONTOH_HTML, CONTOH_JS, CONTOH_PYTHON, CONTOH_TURTLE } from "./contoh-lab";

/**
 * CodeMirror (beserta paket bahasa HTML/CSS/JS/Python) hanya dimuat saat mode teks dipakai, dan dimuat di
 * latar saat browser lengang supaya pindah ke tab teks tetap instan. Mode Blok tidak memerlukannya.
 */
const muatEditorKode = () => import("./editor-kode");
const EditorKode = dynamic(() => muatEditorKode().then((m) => m.EditorKode), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <StatusMemuat label="Menyiapkan editor kode…" />
    </div>
  ),
});

type Mode = "blok" | "turtle" | "web" | "python";
type ModePython = "python" | "turtle";
type BerkasWeb = "html" | "css" | "js";
type Baris = { aliran: "stdout" | "stderr" | "warn" | "info"; teks: string };
type StatusPython = "belum" | "memuat" | "siap" | "jalan" | "gagal";

type Simpanan = {
  mode: Mode;
  web: Record<BerkasWeb, string>;
  python: string;
  turtle: string;
  /** JSON workspace Blockly. */
  blok: string;
};

const KUNCI = "kodie:lab:v1";
const MAKS_BARIS = 500;
const MODE_SAH: Mode[] = ["blok", "turtle", "web", "python"];

const NAMA_BERKAS: Record<BerkasWeb, string> = { html: "index.html", css: "style.css", js: "script.js" };

const PILIHAN_MODE: { nilai: Mode; label: string; ikon: typeof Code2 }[] = [
  { nilai: "blok", label: "Blok", ikon: Puzzle },
  { nilai: "turtle", label: "Python Turtle", ikon: Turtle },
  { nilai: "web", label: "HTML, CSS, JS", ikon: Code2 },
  { nilai: "python", label: "Python", ikon: FileCode2 },
];

const PESAN_KEMBALIKAN: Record<Mode, string> = {
  blok: "Kembalikan papan blok ke contoh? Susunan blokmu akan terhapus.",
  turtle: "Kembalikan kode Python Turtle ke contoh? Kodemu di mode Python Turtle akan terhapus.",
  web: "Kembalikan HTML, CSS, dan JavaScript ke kode contoh? Kodemu di mode Web akan terhapus.",
  python: "Kembalikan kode Python ke contoh? Kodemu di mode Python akan terhapus.",
};

function contohAwal(): Simpanan {
  return {
    mode: "blok",
    web: { html: CONTOH_HTML, css: CONTOH_CSS, js: CONTOH_JS },
    python: CONTOH_PYTHON,
    turtle: CONTOH_TURTLE,
    blok: JSON.stringify(CONTOH_BLOK),
  };
}

/** Komponen ini hanya dirender di browser (lihat `lab-klien.tsx`), jadi aman membaca localStorage. */
function bacaSimpanan(): Simpanan {
  const awal = contohAwal();
  try {
    const mentah = localStorage.getItem(KUNCI);
    if (!mentah) return awal;
    const s = JSON.parse(mentah) as Partial<Simpanan>;
    const teks = (v: unknown, cadangan: string) => (typeof v === "string" ? v : cadangan);
    return {
      mode: MODE_SAH.includes(s.mode as Mode) ? (s.mode as Mode) : awal.mode,
      web: {
        html: teks(s.web?.html, awal.web.html),
        css: teks(s.web?.css, awal.web.css),
        js: teks(s.web?.js, awal.web.js),
      },
      python: teks(s.python, awal.python),
      turtle: teks(s.turtle, awal.turtle),
      blok: teks(s.blok, awal.blok),
    };
  } catch {
    return awal;
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

const tambahBaris = (lama: Baris[], baru: Baris) => [...lama, baru].slice(-MAKS_BARIS);

function IsiKodieLab() {
  const [kode, setKode] = useState<Simpanan>(bacaSimpanan);
  const mode = kode.mode;
  const [berkas, setBerkas] = useState<BerkasWeb>("html");
  const [versiEditor, setVersiEditor] = useState(0);
  const [tersimpan, setTersimpan] = useState(true);
  // Salinan terbaru untuk handler yang dipanggil beruntun sebelum React merender ulang.
  const terbaru = useRef(kode);

  // Web
  const [dokumen, setDokumen] = useState(() => rakitDokumen(kode.web, 0));
  const putaran = useRef(0);
  const iframe = useRef<HTMLIFrameElement>(null);
  const [konsolWeb, setKonsolWeb] = useState<Baris[]>([]);

  // Python dan Python Turtle (berbagi satu Web Worker Pyodide)
  const [keluaran, setKeluaran] = useState<Record<ModePython, Baris[]>>({ python: [], turtle: [] });
  const [statusPy, setStatusPy] = useState<StatusPython>("belum");
  const [pesanGagal, setPesanGagal] = useState<string>();
  const [durasi, setDurasi] = useState<Partial<Record<ModePython, number>>>({});
  const modeJalan = useRef<ModePython>("python");
  const worker = useRef<Worker | null>(null);
  const timerSimpan = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gambar (mode Blok dan Python Turtle)
  const [adegan, setAdegan] = useState<{ blok: Adegan | null; turtle: Adegan | null }>({ blok: null, turtle: null });
  const [putaranKanvas, setPutaranKanvas] = useState(0);
  const [keluaranBlok, setKeluaranBlok] = useState<Baris[]>([]);
  const [intipPython, setIntipPython] = useState(false);

  // Bit-Cat Mentor (pemeriksa kode Socratic)
  const [panelMentorBuka, setPanelMentorBuka] = useState(false);
  const [tujuanMentor, setTujuanMentor] = useState("");
  const [memuatMentor, setMemuatMentor] = useState(false);
  const [galatMentor, setGalatMentor] = useState<string | null>(null);
  const [hasilMentor, setHasilMentor] = useState<ResponsLabMentor | null>(null);
  const [adaGalatTerbaru, setAdaGalatTerbaru] = useState(false);
  const [ajakanGalatTutup, setAjakanGalatTutup] = useState(false);
  const [fokusBaris, setFokusBaris] = useState<FokusBaris | null>(null);
  const mentorAbortRef = useRef<AbortController | null>(null);
  const seqFokusRef = useRef(0);

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

  // Muat CodeMirror di latar setelah lab tampil, supaya pindah ke mode teks tidak menunggu unduhan.
  useEffect(() => {
    const muat = () => void muatEditorKode();
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(muat, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(muat, 1500);
    return () => window.clearTimeout(id);
  }, []);

  // Konsol dari iframe pratinjau.
  useEffect(() => {
    const terima = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow) return;
      const d = e.data as { kodieLab?: boolean; aliran?: Baris["aliran"]; teks?: string };
      if (!d?.kodieLab || typeof d.teks !== "string") return;
      const baris: Baris = { aliran: d.aliran ?? "stdout", teks: d.teks };
      setKonsolWeb((k) => tambahBaris(k, baris));
      if (baris.aliran === "stderr") {
        setAdaGalatTerbaru(true);
        setAjakanGalatTutup(false);
      }
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
        | { jenis: "turtle"; perintah: PerintahTurtle[] }
        | { jenis: "selesai"; galat: boolean; durasi?: number };
      const target = modeJalan.current;
      if (d.jenis === "status") {
        if (d.status === "gagal") {
          setStatusPy("gagal");
          setPesanGagal("Python gagal dimuat. Periksa koneksi internet, lalu coba lagi.");
        } else {
          setStatusPy((s) => (s === "jalan" ? s : d.status));
        }
      } else if (d.jenis === "keluaran") {
        const baris: Baris = { aliran: d.aliran, teks: d.teks };
        setKeluaran((k) => ({ ...k, [target]: tambahBaris(k[target], baris) }));
        if (d.aliran === "stderr") {
          setAdaGalatTerbaru(true);
          setAjakanGalatTutup(false);
        }
      } else if (d.jenis === "turtle") {
        setAdegan((a) => ({ ...a, turtle: jalankanPerintah(Array.isArray(d.perintah) ? d.perintah : []) }));
        setPutaranKanvas((p) => p + 1);
      } else if (d.jenis === "selesai") {
        setDurasi((x) => ({ ...x, [target]: d.durasi }));
        setStatusPy((s) => (s === "gagal" ? s : "siap"));
      }
    };
    worker.current = w;
    return w;
  }, [setAjakanGalatTutup]);

  const pastikanWorker = useCallback(() => worker.current ?? buatWorker(), [buatWorker]);

  // Muat Python di latar begitu mode Python atau Python Turtle dibuka, supaya Jalankan pertama terasa cepat.
  useEffect(() => {
    if ((mode !== "python" && mode !== "turtle") || worker.current) return;
    pastikanWorker().postMessage({ jenis: "muat" });
  }, [mode, pastikanWorker]);

  useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
      mentorAbortRef.current?.abort();
      mentorAbortRef.current = null;
      if (timerSimpan.current) clearTimeout(timerSimpan.current);
    },
    [],
  );

  const resetMentor = () => {
    mentorAbortRef.current?.abort();
    mentorAbortRef.current = null;
    setPanelMentorBuka(false);
    setMemuatMentor(false);
    setGalatMentor(null);
    setHasilMentor(null);
    setAdaGalatTerbaru(false);
    setAjakanGalatTutup(false);
    setFokusBaris(null);
  };

  const jalankanBlokSekarang = () => {
    const h = jalankanBlok(terbaru.current.blok);
    setAdegan((a) => ({ ...a, blok: jalankanPerintah(h.perintah) }));
    setPutaranKanvas((p) => p + 1);
    const baris: Baris[] = h.keluaran.map((teks) => ({ aliran: "stdout", teks }));
    if (h.catatan) baris.push({ aliran: "warn", teks: h.catatan });
    if (h.galat) {
      baris.push({ aliran: "stderr", teks: h.galat });
      setAdaGalatTerbaru(true);
      setAjakanGalatTutup(false);
    } else {
      setAdaGalatTerbaru(false);
    }
    setKeluaranBlok(baris);
  };

  const jalankan = () => {
    setAdaGalatTerbaru(false);
    setAjakanGalatTutup(false);
    if (mode === "web") {
      putaran.current += 1;
      setKonsolWeb([]);
      setDokumen(rakitDokumen(terbaru.current.web, putaran.current));
      return;
    }
    if (mode === "blok") {
      jalankanBlokSekarang();
      return;
    }
    if (statusPy === "jalan") return;
    modeJalan.current = mode;
    setPesanGagal(undefined);
    setKeluaran((k) => ({ ...k, [mode]: [] }));
    setDurasi((x) => ({ ...x, [mode]: undefined }));
    setStatusPy("jalan");
    putaran.current += 1;
    pastikanWorker().postMessage({
      jenis: mode === "turtle" ? "jalankan-turtle" : "jalankan",
      id: putaran.current,
      kode: mode === "turtle" ? terbaru.current.turtle : terbaru.current.python,
    });
  };

  const hentikan = () => {
    const target = modeJalan.current;
    worker.current?.terminate();
    worker.current = null;
    setKeluaran((k) => ({ ...k, [target]: tambahBaris(k[target], { aliran: "warn", teks: "Program dihentikan." }) }));
    setStatusPy("belum");
    pastikanWorker().postMessage({ jenis: "muat" });
  };

  const gantiMode = (m: Mode) => {
    setIntipPython(false);
    resetMentor();
    perbarui((k) => ({ ...k, mode: m }));
  };

  const ubahKode = (b: BahasaLab, nilai: string) =>
    perbarui((k) => {
      if (b === "python") return mode === "turtle" ? { ...k, turtle: nilai } : { ...k, python: nilai };
      return { ...k, web: { ...k.web, [b]: nilai } };
    });

  const kembalikanContoh = () => {
    if (!window.confirm(PESAN_KEMBALIKAN[mode])) return;
    const c = contohAwal();
    resetMentor();
    perbarui((k) => {
      if (mode === "web") return { ...k, web: c.web };
      if (mode === "blok") return { ...k, blok: c.blok };
      if (mode === "turtle") return { ...k, turtle: c.turtle };
      return { ...k, python: c.python };
    });
    setVersiEditor((v) => v + 1);
  };

  const pythonDariBlok = useMemo(() => (intipPython ? blokKePython(kode.blok) : ""), [intipPython, kode.blok]);

  const salinKeTurtle = () => {
    if (terbaru.current.turtle.trim() && !window.confirm("Ganti kode di mode Python Turtle dengan hasil terjemahan blok ini?")) return;
    const hasil = blokKePython(terbaru.current.blok);
    setIntipPython(false);
    resetMentor();
    perbarui((k) => ({ ...k, turtle: hasil, mode: "turtle" }));
    setVersiEditor((v) => v + 1);
  };

  const bersihkan = () => {
    setAdaGalatTerbaru(false);
    if (mode === "web") setKonsolWeb([]);
    else if (mode === "blok") setKeluaranBlok([]);
    else setKeluaran((k) => ({ ...k, [mode]: [] }));
  };

  const ambilGalatAktif = (): string[] => {
    const daftar = mode === "web" ? konsolWeb : mode === "blok" ? keluaranBlok : keluaran[mode];
    return daftar
      .filter((b) => b.aliran === "stderr")
      .map((b) => b.teks)
      .slice(-10);
  };

  const periksaKodeDenganBitCat = async (level: 1 | 2 = 1) => {
    mentorAbortRef.current?.abort();
    const controller = new AbortController();
    mentorAbortRef.current = controller;

    setPanelMentorBuka(true);
    setAjakanGalatTutup(true);
    setMemuatMentor(true);
    setGalatMentor(null);

    const cur = terbaru.current;
    const modeAktif = cur.mode;
    const berkasUntukMode: BerkasTemuan =
      modeAktif === "web"
        ? berkas
        : modeAktif === "turtle"
          ? "turtle.py"
          : modeAktif === "blok"
            ? "blok"
            : "main.py";

    const payloadKode =
      modeAktif === "web"
        ? cur.web
        : modeAktif === "turtle"
          ? cur.turtle
          : modeAktif === "blok"
            ? blokKePython(cur.blok)
            : cur.python;

    try {
      const resp = await mintaPetunjukLab(
        {
          mode: modeAktif,
          level,
          berkas_aktif: berkasUntukMode,
          kode: payloadKode,
          galat: ambilGalatAktif(),
          tujuan: tujuanMentor.trim() || undefined,
        },
        controller.signal,
      );
      if (mentorAbortRef.current === controller) {
        setHasilMentor(resp);
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError" && mentorAbortRef.current === controller) {
        setGalatMentor("Tidak dapat menghubungi Bit-Cat Mentor saat ini. Coba lagi sebentar ya.");
      }
    } finally {
      if (mentorAbortRef.current === controller) {
        setMemuatMentor(false);
      }
    }
  };

  const berkasEditorSaatIni: BerkasTemuan =
    mode === "web" ? berkas : mode === "turtle" ? "turtle.py" : mode === "blok" ? "blok" : "main.py";

  const penandaAktif = useMemo<PenandaBaris[]>(() => {
    if (!hasilMentor) return [];
    return hasilMentor.temuan
      .filter((t): t is TemuanLab & { baris: number } => t.berkas === berkasEditorSaatIni && t.baris !== null)
      .map((t) => ({ baris: t.baris, tingkat: t.tingkat }));
  }, [berkasEditorSaatIni, hasilMentor]);

  const pilihTemuan = (t: TemuanLab) => {
    if (t.berkas === "blok" || t.baris === null) return;
    if (mode === "web" && (t.berkas === "html" || t.berkas === "css" || t.berkas === "js")) {
      setBerkas(t.berkas);
    }
    seqFokusRef.current += 1;
    setFokusBaris({ berkas: t.berkas, baris: t.baris, seq: seqFokusRef.current });
  };

  // Ctrl/Cmd + Enter juga berlaku di papan blok (editor kode sudah menanganinya sendiri).
  const pintasanBlok = (e: KeyboardEventReact) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      jalankanBlokSekarang();
    }
  };

  const modePython = mode === "python" || mode === "turtle";
  const bahasaAktif: BahasaLab = modePython ? "python" : mode === "web" ? berkas : "python";
  const nilaiAktif = mode === "python" ? kode.python : mode === "turtle" ? kode.turtle : kode.web[berkas];
  const sedangJalan = modePython && statusPy === "jalan";
  const pyBelumSiap = modePython && (statusPy === "belum" || statusPy === "memuat");

  const statusPanelPython: ReactNode =
    statusPy === "jalan" ? (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
        <Loader2 aria-hidden className="size-4 animate-spin" /> Berjalan…
      </span>
    ) : pyBelumSiap ? (
      <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
        <Loader2 aria-hidden className="size-4 animate-spin" /> Memuat Python
      </span>
    ) : modePython && durasi[mode] !== undefined ? (
      <span className="text-sm text-text-muted">Selesai dalam {((durasi[mode] ?? 0) / 1000).toFixed(2).replace(".", ",")} detik</span>
    ) : null;

  const kosongPython = pyBelumSiap
    ? "Menyiapkan Python di browser… (sekitar 10 MB, hanya saat pertama)"
    : statusPy === "gagal"
      ? (pesanGagal ?? "Python gagal dimuat.")
      : mode === "turtle"
        ? "Hasil print() dan pesan galat muncul di sini."
        : "Klik Jalankan untuk melihat hasil print() di sini.";

  return (
    <div className="lab flex flex-col gap-4">
      {/* Bilah alat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="radiogroup"
          aria-label="Mode Kodie Lab"
          className="relative grid w-full grid-cols-2 gap-[3px] rounded-[22px] border-[1.5px] border-border-strong bg-surface p-[3px] sm:w-auto sm:grid-cols-4 sm:rounded-full"
        >
          {PILIHAN_MODE.map((o) => {
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
            {tersimpan ? "Tersimpan sementara di browser perangkat ini" : "Menyimpan…"}
          </span>
          <button
            type="button"
            onClick={() => void periksaKodeDenganBitCat(1)}
            aria-expanded={panelMentorBuka}
            data-tanpa-animasi
            className={cx(
              "flex min-h-touch items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-bold transition-colors",
              panelMentorBuka
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border-strong bg-surface text-text hover:bg-surface-sunken",
            )}
          >
            <AvatarBitCat ukuran="kecil" />
            <span>Periksa kode</span>
            {hasilMentor && hasilMentor.temuan.length > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-cta px-2 py-0.5 text-sm font-bold text-cta-foreground">
                {hasilMentor.temuan.length}
              </span>
            ) : null}
          </button>
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
              <kbd className="hidden rounded bg-black/10 px-1.5 py-0.5 text-sm font-bold sm:inline">Ctrl + Enter</kbd>
            </motion.button>
          )}
        </div>
      </div>

      {adaGalatTerbaru && !ajakanGalatTutup && !panelMentorBuka ? (
        <div
          role="status"
          data-tanpa-animasi
          className="flex flex-wrap items-center justify-between gap-3 rounded-card-sm border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-text shadow-kartu"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Lightbulb aria-hidden="true" className="size-5 shrink-0 text-warning" />
            <p className="font-medium">Ada pesan galat di keluaran. Mau Bit-Cat bantu cari petunjuk letak masalahnya?</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void periksaKodeDenganBitCat(1)}
              className="inline-flex min-h-touch items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover"
            >
              <AvatarBitCat ukuran="kecil" />
              Minta petunjuk
            </button>
            <button
              type="button"
              aria-label="Tutup ajakan petunjuk Bit-Cat"
              onClick={() => setAjakanGalatTutup(true)}
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border border-border-strong bg-surface text-text-muted hover:bg-surface-sunken hover:text-text"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <section
          aria-label={mode === "blok" ? "Papan blok" : "Editor kode"}
          onKeyDownCapture={mode === "blok" ? pintasanBlok : undefined}
          className="relative flex h-[460px] flex-col overflow-hidden rounded-card border border-border bg-surface md:h-[520px] lg:h-[600px]"
        >
          <div className="flex min-h-[48px] items-center justify-between gap-2 border-b border-border bg-surface-sunken px-2 pt-2">
            {mode === "web" ? (
              <div role="tablist" aria-label="Berkas" className="flex gap-1">
                {(Object.keys(NAMA_BERKAS) as BerkasWeb[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    role="tab"
                    aria-selected={berkas === b}
                    onClick={() => {
                      setBerkas(b);
                      setFokusBaris(null);
                    }}
                    className={cx(
                      "min-h-[40px] rounded-t-[10px] px-3 font-mono text-sm font-bold transition-colors",
                      berkas === b ? "bg-surface text-primary" : "text-text-muted hover:text-text",
                    )}
                  >
                    {NAMA_BERKAS[b]}
                  </button>
                ))}
              </div>
            ) : mode === "blok" ? (
              <>
                <span className="min-h-[40px] rounded-t-[10px] bg-surface px-3 py-2 text-sm font-bold text-primary">Papan blok</span>
                <button
                  type="button"
                  aria-expanded={intipPython}
                  aria-controls="intip-python"
                  onClick={() => setIntipPython((v) => !v)}
                  className={cx(
                    "mb-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-sm font-bold transition-colors",
                    intipPython ? "bg-primary text-primary-foreground" : "bg-surface text-text hover:bg-primary-subtle",
                  )}
                >
                  <FileCode2 aria-hidden className="size-4" />
                  Intip kode Python
                </button>
              </>
            ) : (
              <span className="min-h-[40px] rounded-t-[10px] bg-surface px-3 py-2 font-mono text-sm font-bold text-primary">
                {mode === "turtle" ? "turtle.py" : "main.py"}
              </span>
            )}
          </div>
          <div className="relative min-h-0 flex-1">
            {mode === "blok" ? (
              <EditorBlok key={`blok-${versiEditor}`} nilaiAwal={kode.blok} onUbah={(json) => perbarui((k) => ({ ...k, blok: json }))} />
            ) : (
              <EditorKode
                key={`${mode}-${bahasaAktif}-${versiEditor}`}
                bahasa={bahasaAktif}
                nilaiAwal={nilaiAktif}
                label={mode === "python" ? "Kode Python" : mode === "turtle" ? "Kode Python Turtle" : `Kode ${NAMA_BERKAS[berkas]}`}
                berkasAktif={berkasEditorSaatIni}
                penanda={penandaAktif}
                fokusBaris={fokusBaris}
                onUbah={(v) => ubahKode(bahasaAktif, v)}
                onJalankan={jalankan}
              />
            )}

            {/* z-[90]: di atas toolbox (70) dan flyout (80) Blockly, di bawah menu dropdown Blockly. */}
            {mode === "blok" && intipPython ? (
              <div
                id="intip-python"
                className="absolute inset-x-3 bottom-3 z-[90] flex max-h-[70%] flex-col overflow-hidden rounded-card-sm border border-border bg-surface shadow-kartu-hover"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-sunken px-4 py-2">
                  <p className="text-sm font-bold">Kode Python dari blokmu</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={salinKeTurtle}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover"
                    >
                      <Copy aria-hidden className="size-4" />
                      Buka di Python Turtle
                    </button>
                    <button
                      type="button"
                      aria-label="Tutup kode Python"
                      onClick={() => setIntipPython(false)}
                      className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-raised hover:text-text"
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>
                <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-sm leading-6 text-text">{pythonDariBlok}</pre>
              </div>
            ) : null}
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
        ) : mode === "blok" || mode === "turtle" ? (
          <div className="flex h-[560px] flex-col gap-4 lg:h-[600px]">
            <section aria-label="Gambar" className="flex min-h-0 flex-[3] flex-col overflow-hidden rounded-card border border-border bg-surface">
              <KanvasTurtle adegan={adegan[mode]} putaran={putaranKanvas} />
            </section>
            <PanelKonsol
              judul="Keluaran"
              baris={mode === "blok" ? keluaranBlok : keluaran.turtle}
              onBersihkan={bersihkan}
              kosong={mode === "blok" ? "Klik Jalankan untuk melihat Kiko menggambar. Pesan dari blok Kiko bilang muncul di sini." : kosongPython}
              status={mode === "turtle" ? statusPanelPython : null}
              kecil
            />
          </div>
        ) : (
          <div className="flex h-[420px] flex-col md:h-[520px] lg:h-[600px]">
            <PanelKonsol judul="Keluaran" baris={keluaran.python} onBersihkan={bersihkan} kosong={kosongPython} status={statusPanelPython} />
          </div>
        )}
      </div>
      {panelMentorBuka ? (
        <PanelBitCat
          hasil={hasilMentor}
          memuat={memuatMentor}
          galat={galatMentor}
          tujuan={tujuanMentor}
          onUbahTujuan={setTujuanMentor}
          onPeriksa={() => void periksaKodeDenganBitCat(1)}
          onMintaLevel2={() => void periksaKodeDenganBitCat(2)}
          onPilihTemuan={pilihTemuan}
          onTutup={() => setPanelMentorBuka(false)}
        />
      ) : null}
      <p className="text-sm text-text-muted">
        Kode disimpan otomatis di browser ini saja. Blok berjalan langsung di browser, kode web berjalan di bingkai terisolasi, dan
        Python berjalan dengan Pyodide. <code>input()</code> belum didukung.
      </p>
    </div>
  );
}

function JudulPanel({ ikon, judul, aksi }: { ikon: ReactNode; judul: string; aksi?: ReactNode }) {
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
  status?: ReactNode;
  kecil?: boolean;
}) {
  // Gulir hanya kotak log ke baris terakhir. `scrollIntoView` tidak dipakai karena ikut menggulir
  // seluruh halaman, sehingga /lab langsung melompat ke panel keluaran saat dibuka.
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
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
      <div ref={log} role="log" aria-live="polite" className="min-h-0 flex-1 overflow-auto p-4 font-mono text-sm leading-6">
        {baris.length === 0 ? (
          <p className="text-text-muted">{kosong}</p>
        ) : (
          baris.map((b, i) => (
            <pre key={i} className={cx("whitespace-pre-wrap break-words", WARNA_ALIRAN[b.aliran])}>
              {b.teks}
            </pre>
          ))
        )}
      </div>
    </section>
  );
}

/** Motion dipakai lokal di sini (bukan di root layout) agar tidak dimuat di setiap halaman. */
export function KodieLab() {
  return (
    <MotionConfig reducedMotion="user">
      <IsiKodieLab />
    </MotionConfig>
  );
}
