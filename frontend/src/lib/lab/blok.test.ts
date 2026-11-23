import { describe, expect, it } from "vitest";
import { blokKePython, CONTOH_BLOK, identPython, jalankanBlok, MAKS_LANGKAH_BLOK, type NodeBlok } from "./blok";
import { jalankanPerintah } from "./turtle";

const ws = (...rantai: NodeBlok[]) => JSON.stringify({ blocks: { languageVersion: 0, blocks: rantai } });
const mulai = (next?: NodeBlok): NodeBlok => ({ type: "kiko_mulai", next: next ? { block: next } : undefined });
const urut = (...blok: NodeBlok[]): NodeBlok => {
  for (let i = blok.length - 2; i >= 0; i -= 1) blok[i] = { ...blok[i], next: { block: blok[i + 1] } };
  return blok[0];
};

describe("jalankanBlok", () => {
  it("papan kosong dan tanpa blok Mulai memberi galat yang jelas", () => {
    expect(jalankanBlok("").galat).toMatch(/kosong/);
    expect(jalankanBlok(ws({ type: "kiko_maju", fields: { JARAK: 10 } })).galat).toMatch(/Saat Jalankan diklik/);
  });

  it("contoh bawaan menggambar persegi terisi dan mengucapkan pesan", () => {
    const h = jalankanBlok(JSON.stringify(CONTOH_BLOK));
    expect(h.ok).toBe(true);
    expect(h.keluaran).toEqual(["Persegi selesai!"]);
    const adegan = jalankanPerintah(h.perintah);
    expect(adegan.primitif.filter((p) => p.jenis === "garis")).toHaveLength(4);
    expect(adegan.primitif.some((p) => p.jenis === "isi")).toBe(true);
  });

  it("belok kanan = putar negatif, mundur = maju negatif", () => {
    const h = jalankanBlok(
      ws(mulai(urut({ type: "kiko_belok_kanan", fields: { SUDUT: 90 } }, { type: "kiko_mundur", fields: { JARAK: 30 } }))),
    );
    expect(h.perintah.slice(-2)).toEqual([
      { k: "putar", t: 0, sudut: -90 },
      { k: "maju", t: 0, jarak: -30 },
    ]);
  });

  it("variabel bernilai 0 sebelum diatur, jika-maka memilih cabang yang benar", () => {
    const jika: NodeBlok = {
      type: "kiko_jika",
      fields: { VAR: "skor", OP: ">", NILAI: 2 },
      inputs: {
        MAKA: { block: { type: "kiko_bicara", fields: { TEKS: "besar" } } },
        SELAINNYA: { block: { type: "kiko_bicara", fields: { TEKS: "kecil" } } },
      },
    };
    expect(jalankanBlok(ws(mulai({ ...jika }))).keluaran).toEqual(["kecil"]);
    const dengan = urut(
      { type: "kiko_atur_var", fields: { VAR: "skor", NILAI: 1 } },
      { type: "kiko_ubah_var", fields: { VAR: "skor", UBAH: 5 } },
      { ...jika },
    );
    expect(jalankanBlok(ws(mulai(dengan))).keluaran).toEqual(["besar"]);
  });

  it("ulangan bersarang yang terlalu besar dihentikan dengan pesan", () => {
    const dalam: NodeBlok = { type: "kiko_maju", fields: { JARAK: 1 } };
    const u = (isi: NodeBlok): NodeBlok => ({ type: "kiko_ulangi", fields: { KALI: 100 }, inputs: { LAKUKAN: { block: isi } } });
    const h = jalankanBlok(ws(mulai(u(u(u(dalam))))));
    expect(h.ok).toBe(false);
    expect(h.galat).toMatch(/Terlalu banyak langkah/);
    expect(h.perintah.length).toBeLessThanOrEqual(MAKS_LANGKAH_BLOK + 3);
  });

  it("blok lepas dicatat tapi tidak dijalankan", () => {
    const h = jalankanBlok(ws(mulai({ type: "kiko_maju", fields: { JARAK: 10 } }), { type: "kiko_maju", fields: { JARAK: 99 } }));
    expect(h.ok).toBe(true);
    expect(h.catatan).toMatch(/1 kelompok blok/);
    expect(h.perintah.filter((p) => p.k === "maju")).toHaveLength(1);
  });
});

describe("blokKePython", () => {
  it("contoh bawaan menjadi kode Python turtle yang rapi", () => {
    expect(blokKePython(JSON.stringify(CONTOH_BLOK))).toBe(
      [
        "# Kode Python hasil terjemahan blok Kiko",
        "import turtle",
        "",
        "kiko = turtle.Turtle()",
        'kiko.pencolor("#1d4ed8")',
        "kiko.pensize(3)",
        "",
        'kiko.pencolor("#1d4ed8")',
        'kiko.fillcolor("#84cc16")',
        "kiko.begin_fill()",
        "for i in range(4):",
        "    kiko.forward(120)",
        "    kiko.right(90)",
        "kiko.end_fill()",
        'print("Persegi selesai!")',
        "",
      ].join("\n"),
    );
  });

  it("variabel diinisialisasi 0, nama diamankan, variabel loop tidak bentrok", () => {
    const kode = blokKePython(
      ws(
        mulai(
          urut(
            { type: "kiko_atur_var", fields: { VAR: "i", NILAI: 3 } },
            { type: "kiko_ubah_var", fields: { VAR: "for", UBAH: 1 } },
            {
              type: "kiko_ulangi",
              fields: { KALI: 2 },
              inputs: { LAKUKAN: { block: { type: "kiko_jika", fields: { VAR: "skor 1", OP: "==", NILAI: 0 } } } },
            },
          ),
        ),
      ),
    );
    expect(kode).toContain("i = 0\nfor_ = 0\nskor_1 = 0\n");
    expect(kode).toContain("i = 3\n");
    expect(kode).toContain("for_ = for_ + 1\n");
    expect(kode).toContain("for i_ in range(2):\n    if skor_1 == 0:\n        pass\n");
  });

  it("operator yang tidak dikenal diganti == (tidak bisa menyisipkan kode)", () => {
    const kode = blokKePython(ws(mulai({ type: "kiko_jika", fields: { VAR: "x", OP: "== 1 or __import__('os')", NILAI: 0 } })));
    expect(kode).toContain("if x == 0:");
    expect(kode).not.toContain("__import__");
  });

  it("teks dan nama variabel diubah menjadi literal/identifier Python yang aman", () => {
    expect(blokKePython(ws(mulai({ type: "kiko_bicara", fields: { TEKS: 'Halo "Kiko"\\n' } })))).toContain(
      'print("Halo \\"Kiko\\"\\\\n")',
    );
    expect(identPython("2 skor")).toBe("v_2_skor");
    expect(identPython("kiko")).toBe("kiko_");
    expect(identPython("café")).toBe("cafe");
  });
});
