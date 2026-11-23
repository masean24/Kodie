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

let turtleTerpasang = null;

/** Pasang modul `turtle` virtual (public/lab/turtle_kodie.py) ke sys.modules, sekali per worker. */
async function pasangTurtle(py) {
  if (!turtleTerpasang) {
    turtleTerpasang = (async () => {
      const res = await fetch(new URL("./turtle_kodie.py", import.meta.url));
      if (!res.ok) throw new Error("Modul turtle Kodie Lab gagal dimuat.");
      py.globals.set("__sumber_turtle__", await res.text());
      // Nama berkas "<exec>" membuat baris internal modul ini disaring dari traceback (lihat rapikanGalat).
      py.runPython(
        [
          "import sys, types",
          "_m = types.ModuleType('turtle')",
          "_m.__file__ = 'turtle.py'",
          "exec(compile(__sumber_turtle__, '<exec>', 'exec'), _m.__dict__)",
          "sys.modules['turtle'] = _m",
          "del _m, __sumber_turtle__",
        ].join("\n"),
      );
    })();
  }
  try {
    await turtleTerpasang;
  } catch (err) {
    turtleTerpasang = null;
    throw err;
  }
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
  if (jenis !== "jalankan" && jenis !== "jalankan-turtle") return;
  const modeTurtle = jenis === "jalankan-turtle";
  let py;
  try {
    py = await muatPyodide();
    if (modeTurtle) {
      await pasangTurtle(py);
      // Pasang ulang bila kode siswa sebelumnya menghapus atau mengganti modul turtle.
      if (!py.runPython("import sys\nhasattr(sys.modules.get('turtle'), '_kodie_reset')")) {
        turtleTerpasang = null;
        await pasangTurtle(py);
      }
    }
  } catch (err) {
    pyodideSiap = null;
    kirim({ jenis: "status", status: "gagal", pesan: String(err && err.message ? err.message : err) });
    kirim({ jenis: "selesai", id, galat: true });
    return;
  }
  const mulai = performance.now();
  if (modeTurtle) py.runPython("import sys\nsys.modules['turtle']._kodie_reset()");  // Namespace baru setiap kali Run, supaya variabel dari percobaan sebelumnya tidak terbawa.
  const ruang = py.globals.get("dict")();
  let galat = false;
  try {
    await py.loadPackagesFromImports(kode);
    await py.runPythonAsync(kode, { globals: ruang, filename: "main.py" });
  } catch (err) {
    galat = true;
    kirim({ jenis: "keluaran", aliran: "stderr", teks: rapikanGalat(err && err.message ? err.message : err) });
  } finally {
    ruang.destroy();
  }
  if (modeTurtle) {
    // Kirim gambar yang sempat terbentuk, juga ketika program berhenti karena galat.
    let perintah = [];
    try {
      perintah = JSON.parse(py.runPython("import sys\nsys.modules['turtle']._kodie_json()"));
    } catch {
      // Modul turtle diganti atau dihapus oleh kode siswa: kirim gambar kosong.
    }
    kirim({ jenis: "turtle", id, perintah });
  }
  kirim({ jenis: "selesai", id, galat, durasi: performance.now() - mulai });
};
