import { describe, expect, it } from "vitest";
import { analisisLokalLab } from "./mentor";

describe("Bit-Cat Mentor lokal & guardrail", () => {
  it("mendeteksi kurang titik dua di Python tanpa memberi blok kode solusi", () => {
    const res = analisisLokalLab({
      mode: "python",
      level: 1,
      berkas_aktif: "main.py",
      kode: "for i in range(5)\n    print(i)",
      galat: ['SyntaxError: expected ":" (line 1)'],
      tujuan: "Mencetak angka 0 sampai 4",
    });
    expect(res.status).toBe("ada_temuan");
    expect(res.temuan.length).toBeGreaterThanOrEqual(1);
    expect(res.temuan.some((t) => t.baris === 1)).toBe(true);
    expect(res.boleh_level_2).toBe(true);
    for (const t of res.temuan) {
      expect(t.petunjuk).not.toContain("```");
    }
  });

  it("mendeteksi bug logika persegi di Python Turtle pada Level 1 & Level 2", () => {
    const l1 = analisisLokalLab({
      mode: "turtle",
      level: 1,
      berkas_aktif: "turtle.py",
      kode: "import turtle\nt = turtle.Turtle()\nfor i in range(3):\n    t.forward(80)\n    t.right(90)",
      galat: [],
      tujuan: "Menggambar persegi",
    });
    expect(l1.status).toBe("ada_temuan");
    expect(l1.temuan[0]?.baris).toBe(3);

    const l2 = analisisLokalLab({
      mode: "turtle",
      level: 2,
      berkas_aktif: "turtle.py",
      kode: "import turtle\nt = turtle.Turtle()\nfor i in range(3):\n    t.forward(80)\n    t.right(90)",
      galat: [],
      tujuan: "Menggambar persegi",
    });
    expect(l2.level).toBe(2);
    expect(l2.boleh_level_2).toBe(false);
    expect(l2.temuan[0]?.petunjuk).toContain("4 sisi");
  });

  it("menolak data pribadi sensitif di tujuan", () => {
    const res = analisisLokalLab({
      mode: "python",
      level: 1,
      berkas_aktif: "main.py",
      kode: 'print("hai")',
      galat: [],
      tujuan: "Hubungi WA saya 081234567890",
    });
    expect(res.status).toBe("ditolak_privasi");
    expect(res.temuan).toHaveLength(0);
  });

  it("menolak permintaan membuatkan kode lengkap dari nol", () => {
    const res = analisisLokalLab({
      mode: "python",
      level: 1,
      berkas_aktif: "main.py",
      kode: "x = 1",
      galat: [],
      tujuan: "Tolong buatkan kode game ular lengkap pake Python",
    });
    expect(res.status).toBe("butuh_coba_dulu");
    expect(res.temuan).toHaveLength(0);
  });

  it("mendeteksi galat HTML/CSS/JS di mode Web", () => {
    const res = analisisLokalLab({
      mode: "web",
      level: 1,
      berkas_aktif: "js",
      kode: {
        html: "<h1>Halo",
        css: "body { color: red;",
        js: "console.log(x);",
      },
      galat: ["ReferenceError: x is not defined (baris 1)"],
    });
    expect(res.status).toBe("ada_temuan");
    expect(res.temuan.some((t) => t.berkas === "js" && t.baris === 1)).toBe(true);
    expect(res.temuan.some((t) => t.berkas === "css")).toBe(true);
    expect(res.temuan.some((t) => t.berkas === "html")).toBe(true);
  });

  it("mendukung pemeriksaan mode Blok tanpa galat pada contoh valid", () => {
    const kosong = analisisLokalLab({
      mode: "blok",
      level: 1,
      berkas_aktif: "blok",
      kode: "kiko_mulai()\n",
      galat: [],
    });
    expect(kosong.status).toBe("ada_temuan");
    expect(kosong.temuan[0]?.baris).toBeNull();
  });
});
