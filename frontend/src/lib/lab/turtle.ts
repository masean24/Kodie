/**
 * Mesin geometri turtle Kodie Lab (murni, tanpa DOM).
 *
 * Masukan: daftar perintah relatif (`PerintahTurtle[]`) dari Python Turtle (Pyodide) atau mode Blok.
 * Keluaran: `Adegan` berisi primitif gambar berurutan waktu, siap dianimasikan oleh kanvas.
 *
 * Aturan mengikuti modul `turtle` CPython (mode "standard"): sudut dalam derajat, arah 0 = timur,
 * putar positif = berlawanan jarum jam (kiri), `circle()` memakai poligon bertahap yang sama.
 * Setiap perintah membawa `t` (id turtle) sehingga beberapa turtle bisa menggambar bersamaan.
 */

export type PerintahTurtle =
  | { k: "maju"; t: number; jarak: number }
  | { k: "putar"; t: number; sudut: number }
  | { k: "arah"; t: number; sudut: number }
  | { k: "ke"; t: number; x: number; y: number }
  | { k: "pena"; t: number; turun: boolean }
  | { k: "warna"; t: number; pena?: string; isi?: string }
  | { k: "tebal"; t: number; ukuran: number }
  | { k: "mulai_isi"; t: number }
  | { k: "selesai_isi"; t: number }
  | { k: "lingkaran"; t: number; jari: number; busur: number; langkah?: number }
  | { k: "titik"; t: number; ukuran?: number; warna?: string }
  | { k: "tulis"; t: number; teks: string; ukuran: number; rata: "left" | "center" | "right" }
  | { k: "tampak"; t: number; terlihat: boolean }
  | { k: "bersihkan"; t: number }
  | { k: "latar"; warna: string };

export type Pose = { t: number; x: number; y: number; arah: number; terlihat: boolean; warna: string };

export type Primitif =
  | { jenis: "garis"; x1: number; y1: number; x2: number; y2: number; warna: string; tebal: number; z: number; pose: Pose; biaya: number }
  | { jenis: "gerak"; pose: Pose; biaya: number }
  | { jenis: "isi"; titik: [number, number][]; warna: string; z: number; pose: Pose; biaya: number }
  | { jenis: "titik"; x: number; y: number; ukuran: number; warna: string; z: number; pose: Pose; biaya: number }
  | {
      jenis: "tulis";
      x: number;
      y: number;
      teks: string;
      ukuran: number;
      rata: "left" | "center" | "right";
      warna: string;
      z: number;
      pose: Pose;
      biaya: number;
    }
  | { jenis: "latar"; warna: string; biaya: number }
  | { jenis: "bersihkan"; t: number; biaya: number };

export type Adegan = {
  primitif: Primitif[];
  /** Pose awal setiap turtle (sebelum perintah pertamanya). */
  poseAwal: Pose[];
  totalBiaya: number;
  /** Batas koordinat terjauh yang dipakai gambar (untuk menyesuaikan zoom kanvas). */
  batas: number;
};

export const MAKS_PERINTAH = 20000;

type Keadaan = {
  x: number;
  y: number;
  arah: number;
  turun: boolean;
  pena: string;
  isi: string;
  tebal: number;
  terlihat: boolean;
  jalurIsi: [number, number][] | null;
  zIsi: number;
};

const RAD = Math.PI / 180;

/** Biaya animasi memutar badan turtle, setara piksel per derajat. */
const BIAYA_PER_DERAJAT = 0.5;

/** cos/sin dalam derajat, eksak untuk kelipatan 90° (cos 90° = 0, bukan 6e-17). */
export function cosD(derajat: number): number {
  const a = normalSudut(derajat);
  if (a === 0) return 1;
  if (a === 90 || a === 270) return 0;
  if (a === 180) return -1;
  return Math.cos(a * RAD);
}
export function sinD(derajat: number): number {
  const a = normalSudut(derajat);
  if (a === 0 || a === 180) return 0;
  if (a === 90) return 1;
  if (a === 270) return -1;
  return Math.sin(a * RAD);
}

/** Normalisasi sudut ke [0, 360); nilai yang nyaris 360 karena galat floating point menjadi 0. */
function normalSudut(a: number): number {
  const r = ((a % 360) + 360) % 360;
  return r < 1e-9 || 360 - r < 1e-9 ? 0 : r;
}

/** Jumlah langkah poligon untuk circle(), sama dengan CPython turtle. */
export function langkahLingkaran(jari: number, busur: number): number {
  const frac = Math.abs(busur) / 360;
  return 1 + Math.trunc(Math.min(11 + Math.abs(jari) / 6, 59) * frac);
}

export function jalankanPerintah(perintah: PerintahTurtle[]): Adegan {
  const keadaan = new Map<number, Keadaan>();
  const poseAwal: Pose[] = [];
  const primitif: Primitif[] = [];
  let batas = 0;

  const ambil = (t: number): Keadaan => {
    let k = keadaan.get(t);
    if (!k) {
      k = { x: 0, y: 0, arah: 0, turun: true, pena: "black", isi: "black", tebal: 1, terlihat: true, jalurIsi: null, zIsi: 0 };
      keadaan.set(t, k);
      poseAwal.push({ t, x: 0, y: 0, arah: 0, terlihat: true, warna: "black" });
    }
    return k;
  };
  const pose = (t: number, k: Keadaan): Pose => ({ t, x: k.x, y: k.y, arah: k.arah, terlihat: k.terlihat, warna: k.pena });
  const catatBatas = (x: number, y: number) => {
    batas = Math.max(batas, Math.abs(x), Math.abs(y));
  };

  /** Pindah lurus ke (nx, ny): garis jika pena turun, gerak kepala jika pena naik. */
  const pindah = (t: number, k: Keadaan, nx: number, ny: number) => {
    const x1 = k.x;
    const y1 = k.y;
    k.x = nx;
    k.y = ny;
    const panjang = Math.hypot(k.x - x1, k.y - y1);
    catatBatas(k.x, k.y);
    if (k.jalurIsi) k.jalurIsi.push([k.x, k.y]);
    if (k.turun && panjang > 0) {
      primitif.push({ jenis: "garis", x1, y1, x2: k.x, y2: k.y, warna: k.pena, tebal: k.tebal, z: primitif.length, pose: pose(t, k), biaya: panjang });
    } else {
      primitif.push({ jenis: "gerak", pose: pose(t, k), biaya: panjang });
    }
  };

  const putar = (t: number, k: Keadaan, sudut: number, catat = true) => {
    k.arah = normalSudut(k.arah + sudut);
    if (catat && sudut !== 0) primitif.push({ jenis: "gerak", pose: pose(t, k), biaya: Math.abs(sudut) * BIAYA_PER_DERAJAT });
  };

  const jumlah = Math.min(perintah.length, MAKS_PERINTAH);
  for (let i = 0; i < jumlah; i += 1) {
    const p = perintah[i];
    if (p.k === "latar") {
      primitif.push({ jenis: "latar", warna: p.warna, biaya: 0 });
      continue;
    }
    const k = ambil(p.t);
    switch (p.k) {
      case "maju": {
        pindah(p.t, k, k.x + p.jarak * cosD(k.arah), k.y + p.jarak * sinD(k.arah));
        break;
      }
      case "putar":
        putar(p.t, k, p.sudut);
        break;
      case "arah": {
        const lama = k.arah;
        k.arah = normalSudut(p.sudut);
        const beda = Math.abs(((k.arah - lama + 540) % 360) - 180);
        primitif.push({ jenis: "gerak", pose: pose(p.t, k), biaya: beda * BIAYA_PER_DERAJAT });
        break;
      }
      case "ke":
        pindah(p.t, k, p.x, p.y);
        break;
      case "pena":
        k.turun = p.turun;
        break;
      case "warna":
        if (p.pena !== undefined) k.pena = p.pena;
        if (p.isi !== undefined) k.isi = p.isi;
        primitif.push({ jenis: "gerak", pose: pose(p.t, k), biaya: 0 });
        break;
      case "tebal":
        k.tebal = Math.max(0, p.ukuran);
        break;
      case "mulai_isi":
        k.jalurIsi = [[k.x, k.y]];
        // Bidang isi berada di bawah garis yang digambar setelah begin_fill (seperti Tk).
        k.zIsi = primitif.length - 0.5;
        break;
      case "selesai_isi":
        if (k.jalurIsi && k.jalurIsi.length > 2) {
          primitif.push({ jenis: "isi", titik: k.jalurIsi, warna: k.isi, z: k.zIsi, pose: pose(p.t, k), biaya: 1 });
        }
        k.jalurIsi = null;
        break;
      case "lingkaran": {
        // Seperti CPython: busur 0 tidak melakukan apa pun; jari-jari 0 tetap memutar arah sebesar busur.
        if (p.busur === 0) break;
        const langkah = p.langkah && p.langkah > 0 ? Math.trunc(p.langkah) : langkahLingkaran(p.jari, p.busur);
        let w = p.busur / langkah;
        let w2 = 0.5 * w;
        let l = 2 * p.jari * Math.sin(w2 * RAD);
        if (p.jari < 0) {
          l = -l;
          w = -w;
          w2 = -w2;
        }
        putar(p.t, k, w2, false);
        for (let s = 0; s < langkah; s += 1) {
          pindah(p.t, k, k.x + l * cosD(k.arah), k.y + l * sinD(k.arah));
          putar(p.t, k, w, false);
        }
        putar(p.t, k, -w2, false);
        primitif.push({ jenis: "gerak", pose: pose(p.t, k), biaya: 0 });
        break;
      }
      case "titik": {
        const ukuran = p.ukuran ?? Math.max(k.tebal + 4, k.tebal * 2);
        catatBatas(k.x + ukuran / 2, k.y + ukuran / 2);
        primitif.push({ jenis: "titik", x: k.x, y: k.y, ukuran, warna: p.warna ?? k.pena, z: primitif.length, pose: pose(p.t, k), biaya: 1 });
        break;
      }
      case "tulis":
        catatBatas(k.x, k.y + p.ukuran);
        primitif.push({
          jenis: "tulis",
          x: k.x,
          y: k.y,
          teks: p.teks,
          ukuran: p.ukuran,
          rata: p.rata,
          warna: k.pena,
          z: primitif.length,
          pose: pose(p.t, k),
          biaya: 1,
        });
        break;
      case "tampak":
        k.terlihat = p.terlihat;
        primitif.push({ jenis: "gerak", pose: pose(p.t, k), biaya: 0 });
        break;
      case "bersihkan":
        primitif.push({ jenis: "bersihkan", t: p.t, biaya: 0 });
        break;
    }
  }

  const totalBiaya = primitif.reduce((s, p) => s + p.biaya, 0);
  return { primitif, poseAwal, totalBiaya, batas };
}
