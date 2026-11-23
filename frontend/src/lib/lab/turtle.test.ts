import { describe, expect, it } from "vitest";
import { jalankanPerintah, langkahLingkaran, MAKS_PERINTAH, type PerintahTurtle, type Primitif } from "./turtle";

const poseAkhir = (primitif: Primitif[], t = 0) => {
  for (let i = primitif.length - 1; i >= 0; i -= 1) {
    const p = primitif[i];
    if ("pose" in p && p.pose.t === t) return p.pose;
  }
  return null;
};

const garis = (primitif: Primitif[]) => primitif.filter((p) => p.jenis === "garis");

describe("mesin turtle", () => {
  it("persegi kembali ke titik awal dengan 4 garis", () => {
    const p: PerintahTurtle[] = [];
    for (let i = 0; i < 4; i += 1) p.push({ k: "maju", t: 0, jarak: 100 }, { k: "putar", t: 0, sudut: 90 });
    const a = jalankanPerintah(p);
    expect(garis(a.primitif)).toHaveLength(4);
    expect(poseAkhir(a.primitif)).toMatchObject({ x: 0, y: 0, arah: 0 });
    expect(a.batas).toBe(100);
  });

  it("arah 0 = timur, putar positif = kiri (berlawanan jarum jam)", () => {
    const a = jalankanPerintah([
      { k: "putar", t: 0, sudut: 90 },
      { k: "maju", t: 0, jarak: 50 },
    ]);
    expect(poseAkhir(a.primitif)).toMatchObject({ x: 0, y: 50, arah: 90 });
  });

  it("jumlah langkah circle sama dengan CPython", () => {
    expect(langkahLingkaran(100, 360)).toBe(28);
    expect(langkahLingkaran(50, 360)).toBe(20);
    expect(langkahLingkaran(100, 90)).toBe(7);
  });

  it("circle penuh kembali ke awal, seperempat circle berakhir di (r, r) menghadap utara", () => {
    const penuh = jalankanPerintah([{ k: "lingkaran", t: 0, jari: 100, busur: 360 }]);
    const akhir = poseAkhir(penuh.primitif)!;
    expect(akhir.x).toBeCloseTo(0, 6);
    expect(akhir.y).toBeCloseTo(0, 6);
    expect(akhir.arah).toBe(0);
    expect(garis(penuh.primitif)).toHaveLength(28);

    const seperempat = jalankanPerintah([{ k: "lingkaran", t: 0, jari: 100, busur: 90 }]);
    const p = poseAkhir(seperempat.primitif)!;
    expect(p.x).toBeCloseTo(100, 6);
    expect(p.y).toBeCloseTo(100, 6);
    expect(p.arah).toBeCloseTo(90, 6);
  });

  it("jari-jari negatif berbelok ke kanan", () => {
    const a = jalankanPerintah([{ k: "lingkaran", t: 0, jari: -100, busur: 90 }]);
    const p = poseAkhir(a.primitif)!;
    expect(p.x).toBeCloseTo(100, 6);
    expect(p.y).toBeCloseTo(-100, 6);
    expect(p.arah).toBeCloseTo(270, 6);
  });

  it("pena naik: tidak ada garis, posisi tetap berubah", () => {
    const a = jalankanPerintah([
      { k: "pena", t: 0, turun: false },
      { k: "maju", t: 0, jarak: 80 },
    ]);
    expect(garis(a.primitif)).toHaveLength(0);
    expect(poseAkhir(a.primitif)).toMatchObject({ x: 80, y: 0 });
  });

  it("isi warna membentuk poligon di bawah garisnya", () => {
    const p: PerintahTurtle[] = [{ k: "warna", t: 0, isi: "red" }, { k: "mulai_isi", t: 0 }];
    for (let i = 0; i < 3; i += 1) p.push({ k: "maju", t: 0, jarak: 60 }, { k: "putar", t: 0, sudut: 120 });
    p.push({ k: "selesai_isi", t: 0 });
    const a = jalankanPerintah(p);
    const isi = a.primitif.find((x) => x.jenis === "isi");
    expect(isi).toBeDefined();
    if (isi?.jenis !== "isi") return;
    expect(isi.warna).toBe("red");
    expect(isi.titik).toHaveLength(4);
    const zGarisPertama = garis(a.primitif)[0];
    expect(zGarisPertama.jenis === "garis" && isi.z < zGarisPertama.z).toBe(true);
  });

  it("beberapa turtle punya keadaan sendiri-sendiri", () => {
    const a = jalankanPerintah([
      { k: "maju", t: 0, jarak: 100 },
      { k: "putar", t: 1, sudut: 90 },
      { k: "maju", t: 1, jarak: 40 },
    ]);
    expect(poseAkhir(a.primitif, 0)).toMatchObject({ x: 100, y: 0, arah: 0 });
    expect(poseAkhir(a.primitif, 1)).toMatchObject({ x: 0, y: 40, arah: 90 });
    expect(a.poseAwal.map((p) => p.t)).toEqual([0, 1]);
  });

  it("ke() dan arah() mutlak", () => {
    const a = jalankanPerintah([
      { k: "ke", t: 0, x: 30, y: -40 },
      { k: "arah", t: 0, sudut: 450 },
    ]);
    expect(poseAkhir(a.primitif)).toMatchObject({ x: 30, y: -40, arah: 90 });
    const g = garis(a.primitif)[0];
    expect(g.jenis === "garis" && g.biaya).toBe(50);
  });

  it("titik memakai ukuran bawaan max(tebal+4, 2*tebal)", () => {
    const a = jalankanPerintah([
      { k: "tebal", t: 0, ukuran: 10 },
      { k: "titik", t: 0 },
    ]);
    const d = a.primitif.find((x) => x.jenis === "titik");
    expect(d?.jenis === "titik" && d.ukuran).toBe(20);
  });

  it("dibatasi MAKS_PERINTAH", () => {
    const p: PerintahTurtle[] = Array.from({ length: MAKS_PERINTAH + 10 }, () => ({ k: "maju" as const, t: 0, jarak: 1 }));
    expect(garis(jalankanPerintah(p).primitif)).toHaveLength(MAKS_PERINTAH);
  });
});
