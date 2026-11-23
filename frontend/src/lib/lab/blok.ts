/**
 * Mode Blok Kodie Lab (untuk SD): menjalankan susunan blok Kiko dan menerjemahkannya ke Python.
 *
 * Modul ini murni (tanpa Blockly). Masukannya adalah JSON hasil `Blockly.serialization.workspaces.save()`.
 * Definisi tampilan blok ada di `src/components/lab/blok-kiko.ts`; nama tipe blok dan field di sini harus sama.
 *
 * Interpreter menghasilkan `PerintahTurtle[]` yang sama dengan Python Turtle, dan kode Python hasil
 * terjemahan menghasilkan gambar yang sama persis ketika dijalankan di mode Python Turtle.
 */
import type { PerintahTurtle } from "./turtle";

export type NodeBlok = {
  type: string;
  id?: string;
  x?: number;
  y?: number;
  fields?: Record<string, string | number>;
  inputs?: Record<string, { block?: NodeBlok }>;
  next?: { block?: NodeBlok };
};

export type WorkspaceBlok = { blocks?: { languageVersion?: number; blocks?: NodeBlok[] } };

export const TIPE_MULAI = "kiko_mulai";

/** Pilihan warna pena dan isi (label, nilai CSS). */
export const WARNA_BLOK: [string, string][] = [
  ["biru", "#1d4ed8"],
  ["biru langit", "#0ea5e9"],
  ["hijau", "#16a34a"],
  ["lime", "#84cc16"],
  ["kuning", "#eab308"],
  ["oranye", "#f97316"],
  ["merah", "#ef4444"],
  ["merah muda", "#ec4899"],
  ["ungu", "#8b5cf6"],
  ["hitam", "#0f172a"],
];

export const OPERATOR_BLOK: [string, string][] = [
  ["=", "=="],
  ["≠", "!="],
  [">", ">"],
  ["<", "<"],
  ["≥", ">="],
  ["≤", "<="],
];
const OPERATOR_SAH = new Set(OPERATOR_BLOK.map(([, op]) => op));

/** Pena bawaan mode Blok. Python hasil terjemahan menulis nilai yang sama agar gambarnya identik. */
export const PENA_AWAL = { warna: "#1d4ed8", tebal: 3 };

export const MAKS_LANGKAH_BLOK = 20000;

export type HasilBlok = {
  ok: boolean;
  perintah: PerintahTurtle[];
  keluaran: string[];
  galat?: string;
  /** Peringatan ringan (misalnya ada blok lepas yang tidak ikut dijalankan). */
  catatan?: string;
};

function bacaWorkspace(json: string): WorkspaceBlok {
  if (!json.trim()) return {};
  try {
    return JSON.parse(json) as WorkspaceBlok;
  } catch {
    return {};
  }
}

function angka(nilai: string | number | undefined, cadangan: number): number {
  const n = typeof nilai === "number" ? nilai : Number(nilai);
  return Number.isFinite(n) ? n : cadangan;
}

function teks(nilai: string | number | undefined, cadangan: string): string {
  return nilai === undefined ? cadangan : String(nilai);
}

function namaVar(nilai: string | number | undefined): string {
  return teks(nilai, "skor").trim() || "skor";
}

function bandingkan(kiri: number, op: string, kanan: number): boolean {
  switch (op) {
    case "==":
      return kiri === kanan;
    case "!=":
      return kiri !== kanan;
    case ">":
      return kiri > kanan;
    case "<":
      return kiri < kanan;
    case ">=":
      return kiri >= kanan;
    case "<=":
      return kiri <= kanan;
    default:
      return false;
  }
}

/** Rantai yang dijalankan: setiap blok Mulai di tingkat atas beserta blok di bawahnya. */
function rantaiMulai(ws: WorkspaceBlok): { mulai: NodeBlok[]; lepas: number } {
  const atas = ws.blocks?.blocks ?? [];
  const mulai = atas.filter((b) => b.type === TIPE_MULAI);
  return { mulai, lepas: atas.length - mulai.length };
}

export function jalankanBlok(json: string): HasilBlok {
  const ws = bacaWorkspace(json);
  const atas = ws.blocks?.blocks ?? [];
  if (atas.length === 0) {
    return { ok: false, perintah: [], keluaran: [], galat: "Papan blok masih kosong. Tarik blok dari daftar di sebelah kiri." };
  }
  const { mulai, lepas } = rantaiMulai(ws);
  if (mulai.length === 0) {
    return {
      ok: false,
      perintah: [],
      keluaran: [],
      galat: 'Belum ada blok "Saat Jalankan diklik". Pasang blok itu di paling atas susunanmu.',
    };
  }

  const perintah: PerintahTurtle[] = [
    { k: "tampak", t: 0, terlihat: true },
    { k: "warna", t: 0, pena: PENA_AWAL.warna },
    { k: "tebal", t: 0, ukuran: PENA_AWAL.tebal },
  ];
  const keluaran: string[] = [];
  const variabel = new Map<string, number>();
  let langkah = 0;

  const jalankan = (node: NodeBlok | undefined): void => {
    let n = node;
    while (n) {
      langkah += 1;
      if (langkah > MAKS_LANGKAH_BLOK) {
        throw new Error("Terlalu banyak langkah (maksimal 20.000). Kurangi jumlah ulangan di dalam ulangan.");
      }
      const f = n.fields ?? {};
      switch (n.type) {
        case "kiko_maju":
          perintah.push({ k: "maju", t: 0, jarak: angka(f.JARAK, 100) });
          break;
        case "kiko_mundur":
          perintah.push({ k: "maju", t: 0, jarak: -angka(f.JARAK, 50) });
          break;
        case "kiko_belok_kanan":
          perintah.push({ k: "putar", t: 0, sudut: -angka(f.SUDUT, 90) });
          break;
        case "kiko_belok_kiri":
          perintah.push({ k: "putar", t: 0, sudut: angka(f.SUDUT, 90) });
          break;
        case "kiko_lingkaran":
          perintah.push({ k: "lingkaran", t: 0, jari: angka(f.JARI, 50), busur: 360 });
          break;
        case "kiko_pulang":
          perintah.push({ k: "ke", t: 0, x: 0, y: 0 }, { k: "arah", t: 0, sudut: 0 });
          break;
        case "kiko_warna_pena":
          perintah.push({ k: "warna", t: 0, pena: teks(f.WARNA, PENA_AWAL.warna) });
          break;
        case "kiko_tebal_pena":
          perintah.push({ k: "tebal", t: 0, ukuran: angka(f.TEBAL, 3) });
          break;
        case "kiko_pena_naik":
          perintah.push({ k: "pena", t: 0, turun: false });
          break;
        case "kiko_pena_turun":
          perintah.push({ k: "pena", t: 0, turun: true });
          break;
        case "kiko_mulai_isi":
          perintah.push({ k: "warna", t: 0, isi: teks(f.WARNA, "#84cc16") }, { k: "mulai_isi", t: 0 });
          break;
        case "kiko_selesai_isi":
          perintah.push({ k: "selesai_isi", t: 0 });
          break;
        case "kiko_bicara":
          keluaran.push(teks(f.TEKS, "Halo!"));
          break;
        case "kiko_atur_var":
          variabel.set(namaVar(f.VAR), angka(f.NILAI, 0));
          break;
        case "kiko_ubah_var": {
          const v = namaVar(f.VAR);
          variabel.set(v, (variabel.get(v) ?? 0) + angka(f.UBAH, 1));
          break;
        }
        case "kiko_ulangi": {
          const kali = Math.max(0, Math.min(100, Math.trunc(angka(f.KALI, 4))));
          for (let i = 0; i < kali; i += 1) jalankan(n.inputs?.LAKUKAN?.block);
          break;
        }
        case "kiko_jika": {
          const kiri = variabel.get(namaVar(f.VAR)) ?? 0;
          const op = OPERATOR_SAH.has(teks(f.OP, "==")) ? teks(f.OP, "==") : "==";
          const cocok = bandingkan(kiri, op, angka(f.NILAI, 0));
          jalankan(cocok ? n.inputs?.MAKA?.block : n.inputs?.SELAINNYA?.block);
          break;
        }
      }
      n = n.next?.block;
    }
  };

  const catatan = lepas > 0 ? `${lepas} kelompok blok tidak tersambung ke blok Mulai, jadi tidak ikut dijalankan.` : undefined;
  try {
    mulai.forEach((m) => jalankan(m.next?.block));
    return { ok: true, perintah, keluaran, catatan };
  } catch (err) {
    return { ok: false, perintah, keluaran, catatan, galat: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Terjemahan ke Python ("Intip kode Python")
// ---------------------------------------------------------------------------

const KATA_KUNCI_PYTHON = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif",
  "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or",
  "pass", "raise", "return", "try", "while", "with", "yield", "match", "case",
]);
/** Nama yang sudah dipakai kode hasil terjemahan; variabel siswa tidak boleh menimpanya. */
const NAMA_TERPAKAI = new Set(["turtle", "kiko", "print", "range"]);

/** Ubah nama variabel blok menjadi identifier Python yang sah dan tidak bentrok. */
export function identPython(nama: string): string {
  let s = nama
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_]/g, "_");
  if (!s) s = "nilai";
  if (/^\d/.test(s)) s = `v_${s}`;
  if (KATA_KUNCI_PYTHON.has(s) || NAMA_TERPAKAI.has(s)) s = `${s}_`;
  return s;
}

function angkaPython(n: number): string {
  return String(n);
}

function teksPython(s: string): string {
  // JSON string literal adalah string literal Python yang sah (escape \" \\ \n \uXXXX sama).
  return JSON.stringify(s);
}

export function blokKePython(json: string): string {
  const ws = bacaWorkspace(json);
  const { mulai } = rantaiMulai(ws);
  const baris: string[] = ["# Kode Python hasil terjemahan blok Kiko", "import turtle", "", "kiko = turtle.Turtle()"];
  baris.push(`kiko.pencolor(${teksPython(PENA_AWAL.warna)})`, `kiko.pensize(${PENA_AWAL.tebal})`);

  // Kumpulkan semua variabel lebih dulu agar setiap variabel bernilai 0 sebelum dipakai (sama seperti interpreter).
  const namaVariabel = new Map<string, string>();
  const kumpulkan = (node: NodeBlok | undefined) => {
    let n = node;
    while (n) {
      if (n.type === "kiko_atur_var" || n.type === "kiko_ubah_var" || n.type === "kiko_jika") {
        const asli = namaVar(n.fields?.VAR);
        if (!namaVariabel.has(asli)) {
          // Dua nama berbeda (mis. "skor 1" dan "skor_1") tidak boleh menjadi satu variabel Python.
          let ident = identPython(asli);
          const terpakai = new Set(namaVariabel.values());
          while (terpakai.has(ident)) ident = `${ident}_`;
          namaVariabel.set(asli, ident);
        }
      }
      for (const masukan of Object.values(n.inputs ?? {})) kumpulkan(masukan.block);
      n = n.next?.block;
    }
  };
  mulai.forEach((m) => kumpulkan(m.next?.block));
  const dipakai = new Set(namaVariabel.values());
  if (dipakai.size > 0) {
    baris.push("");
    for (const ident of dipakai) baris.push(`${ident} = 0`);
  }

  const varUlang = (kedalaman: number): string => {
    const dasar = ["i", "j", "k", "m", "n"][kedalaman] ?? `i${kedalaman}`;
    let v = dasar;
    while (dipakai.has(v)) v = `${v}_`;
    return v;
  };

  const tulis = (node: NodeBlok | undefined, indent: string, kedalaman: number): number => {
    let n = node;
    let jumlah = 0;
    while (n) {
      const f = n.fields ?? {};
      jumlah += 1;
      switch (n.type) {
        case "kiko_maju":
          baris.push(`${indent}kiko.forward(${angkaPython(angka(f.JARAK, 100))})`);
          break;
        case "kiko_mundur":
          baris.push(`${indent}kiko.backward(${angkaPython(angka(f.JARAK, 50))})`);
          break;
        case "kiko_belok_kanan":
          baris.push(`${indent}kiko.right(${angkaPython(angka(f.SUDUT, 90))})`);
          break;
        case "kiko_belok_kiri":
          baris.push(`${indent}kiko.left(${angkaPython(angka(f.SUDUT, 90))})`);
          break;
        case "kiko_lingkaran":
          baris.push(`${indent}kiko.circle(${angkaPython(angka(f.JARI, 50))})`);
          break;
        case "kiko_pulang":
          baris.push(`${indent}kiko.home()`);
          break;
        case "kiko_warna_pena":
          baris.push(`${indent}kiko.pencolor(${teksPython(teks(f.WARNA, PENA_AWAL.warna))})`);
          break;
        case "kiko_tebal_pena":
          baris.push(`${indent}kiko.pensize(${angkaPython(angka(f.TEBAL, 3))})`);
          break;
        case "kiko_pena_naik":
          baris.push(`${indent}kiko.penup()`);
          break;
        case "kiko_pena_turun":
          baris.push(`${indent}kiko.pendown()`);
          break;
        case "kiko_mulai_isi":
          baris.push(`${indent}kiko.fillcolor(${teksPython(teks(f.WARNA, "#84cc16"))})`, `${indent}kiko.begin_fill()`);
          break;
        case "kiko_selesai_isi":
          baris.push(`${indent}kiko.end_fill()`);
          break;
        case "kiko_bicara":
          baris.push(`${indent}print(${teksPython(teks(f.TEKS, "Halo!"))})`);
          break;
        case "kiko_atur_var":
          baris.push(`${indent}${namaVariabel.get(namaVar(f.VAR))} = ${angkaPython(angka(f.NILAI, 0))}`);
          break;
        case "kiko_ubah_var": {
          const v = namaVariabel.get(namaVar(f.VAR));
          baris.push(`${indent}${v} = ${v} + ${angkaPython(angka(f.UBAH, 1))}`);
          break;
        }
        case "kiko_ulangi": {
          const kali = Math.max(0, Math.min(100, Math.trunc(angka(f.KALI, 4))));
          baris.push(`${indent}for ${varUlang(kedalaman)} in range(${kali}):`);
          if (tulis(n.inputs?.LAKUKAN?.block, `${indent}    `, kedalaman + 1) === 0) baris.push(`${indent}    pass`);
          break;
        }
        case "kiko_jika": {
          const v = namaVariabel.get(namaVar(f.VAR));
          const op = OPERATOR_SAH.has(teks(f.OP, "==")) ? teks(f.OP, "==") : "==";
          baris.push(`${indent}if ${v} ${op} ${angkaPython(angka(f.NILAI, 0))}:`);
          if (tulis(n.inputs?.MAKA?.block, `${indent}    `, kedalaman + 1) === 0) baris.push(`${indent}    pass`);
          if (n.inputs?.SELAINNYA?.block) {
            baris.push(`${indent}else:`);
            tulis(n.inputs.SELAINNYA.block, `${indent}    `, kedalaman + 1);
          }
          break;
        }
        default:
          jumlah -= 1;
      }
      n = n.next?.block;
    }
    return jumlah;
  };

  baris.push("");
  if (mulai.length === 0) {
    baris.push('# Pasang blok "Saat Jalankan diklik" lalu susun blok di bawahnya.');
  } else {
    mulai.forEach((m) => tulis(m.next?.block, "", 0));
  }
  return `${baris.join("\n")}\n`;
}

/** Contoh awal mode Blok: persegi berwarna dengan blok ulangi. */
export const CONTOH_BLOK: WorkspaceBlok = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: TIPE_MULAI,
        x: 40,
        y: 40,
        next: {
          block: {
            type: "kiko_warna_pena",
            fields: { WARNA: "#1d4ed8" },
            next: {
              block: {
                type: "kiko_mulai_isi",
                fields: { WARNA: "#84cc16" },
                next: {
                  block: {
                    type: "kiko_ulangi",
                    fields: { KALI: 4 },
                    inputs: {
                      LAKUKAN: {
                        block: {
                          type: "kiko_maju",
                          fields: { JARAK: 120 },
                          next: { block: { type: "kiko_belok_kanan", fields: { SUDUT: 90 } } },
                        },
                      },
                    },
                    next: {
                      block: {
                        type: "kiko_selesai_isi",
                        next: { block: { type: "kiko_bicara", fields: { TEKS: "Persegi selesai!" } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};
