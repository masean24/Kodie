/* Kodie Lab: menjalankan Python di browser dengan Pyodide, di dalam Web Worker agar halaman tidak macet. */
/* Dibuat sebagai module worker (`new Worker(url, { type: "module" })`): Pyodide terbaru tidak mendukung classic worker. */

const VERSI_PYODIDE = "314.0.8";
const URL_PYODIDE = `https://cdn.jsdelivr.net/pyodide/v${VERSI_PYODIDE}/full/`;

let pyodideSiap = null;

function kirim(pesan) {
  self.postMessage(pesan);
}

async function muatPyodide() {
  if (!pyodideSiap) {
    pyodideSiap = (async () => {
      kirim({ jenis: "status", status: "memuat" });
      const { loadPyodide } = await import(`${URL_PYODIDE}pyodide.mjs`);
      const py = await loadPyodide({ indexURL: URL_PYODIDE });
      py.setStdout({ batched: (teks) => kirim({ jenis: "keluaran", aliran: "stdout", teks }) });
      py.setStderr({ batched: (teks) => kirim({ jenis: "keluaran", aliran: "stderr", teks }) });
      // input() butuh dialog di browser; di worker belum didukung, jadi beri pesan yang jelas.
      py.runPython(
        [
          "import builtins",
          "def _input_kodie(prompt=''):",
          "    raise RuntimeError('input() belum didukung di Kodie Lab. Tulis nilainya langsung di kode, misalnya: nama = \"Kiko\"')",
          "builtins.input = _input_kodie",
        ].join("\n"),
      );
      kirim({ jenis: "status", status: "siap" });
      return py;
    })();
  }
  return pyodideSiap;
}

/** Buang baris internal Pyodide dari traceback supaya pesan galat mudah dibaca siswa. */
function rapikanGalat(pesan) {
  const baris = String(pesan).split("\n");
  const hasil = [];
  let lewati = false;
  for (const b of baris) {
    if (/^\s*File "(\/lib\/python|<exec>)/.test(b)) {
      lewati = true;
      continue;
    }
    if (lewati && /^\s{4}/.test(b)) continue;
    lewati = false;
    hasil.push(b);
  }
  return hasil.join("\n").trim();
}

self.onmessage = async (e) => {
  const { jenis, id, kode } = e.data || {};
  if (jenis === "muat") {
    try {
      await muatPyodide();
    } catch (err) {
      pyodideSiap = null;
      kirim({ jenis: "status", status: "gagal", pesan: String(err && err.message ? err.message : err) });
    }
    return;
  }
  if (jenis !== "jalankan") return;
  let py;
  try {
    py = await muatPyodide();
  } catch (err) {
    pyodideSiap = null;
    kirim({ jenis: "status", status: "gagal", pesan: String(err && err.message ? err.message : err) });
    kirim({ jenis: "selesai", id, galat: true });
    return;
  }
  const mulai = performance.now();
  // Namespace baru setiap kali Run, supaya variabel dari percobaan sebelumnya tidak terbawa.
  const ruang = py.globals.get("dict")();
  try {
    await py.loadPackagesFromImports(kode);
    await py.runPythonAsync(kode, { globals: ruang, filename: "main.py" });
    kirim({ jenis: "selesai", id, galat: false, durasi: performance.now() - mulai });
  } catch (err) {
    kirim({ jenis: "keluaran", aliran: "stderr", teks: rapikanGalat(err && err.message ? err.message : err) });
    kirim({ jenis: "selesai", id, galat: true, durasi: performance.now() - mulai });
  } finally {
    ruang.destroy();
  }
};
