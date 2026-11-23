/**
 * Definisi tampilan blok Kiko untuk Blockly (mode Blok Kodie Lab).
 * Logika menjalankan dan menerjemahkan blok ada di `src/lib/lab/blok.ts`:
 * nama tipe blok dan nama field di sini harus sama persis dengan di sana.
 */
import type * as BlocklyNS from "blockly";
import { OPERATOR_BLOK, TIPE_MULAI, WARNA_BLOK } from "@/lib/lab/blok";

type Blockly = typeof BlocklyNS;

/** Warna kategori, selaras palet Kodie (biru merek, lime, dan warna bidang). */
export const WARNA_KATEGORI = {
  mulai: "#1d4ed8",
  gerak: "#2563eb",
  pena: "#7c3aed",
  kontrol: "#d97706",
  variabel: "#db2777",
  bicara: "#0d9488",
};

let terdaftar = false;

export function daftarkanBlokKiko(B: Blockly): void {
  if (terdaftar) return;
  terdaftar = true;

  B.Blocks[TIPE_MULAI] = {
    init(this: BlocklyNS.Block) {
      this.appendDummyInput().appendField("Saat Jalankan diklik");
      this.setNextStatement(true, null);
      this.setColour(WARNA_KATEGORI.mulai);
      this.setTooltip("Program Kiko dimulai dari blok ini. Susun blok lain di bawahnya.");
      (this as BlocklyNS.Block & { hat?: string }).hat = "cap";
    },
  };

  const angka = (nama: string, nilai: number, min: number, maks: number) => ({
    type: "field_number",
    name: nama,
    value: nilai,
    min,
    max: maks,
    precision: 1,
  });
  const pilihWarna = (nilai: string) => ({ type: "field_dropdown", name: "WARNA", options: WARNA_BLOK, value: nilai });
  const langkah = (warna: string) => ({ previousStatement: null, nextStatement: null, colour: warna });

  B.common.defineBlocksWithJsonArray([
    { type: "kiko_maju", message0: "maju %1 langkah", args0: [angka("JARAK", 100, -1000, 1000)], ...langkah(WARNA_KATEGORI.gerak), tooltip: "Kiko maju sesuai arah hadapnya." },
    { type: "kiko_mundur", message0: "mundur %1 langkah", args0: [angka("JARAK", 50, -1000, 1000)], ...langkah(WARNA_KATEGORI.gerak), tooltip: "Kiko mundur tanpa berbalik." },
    { type: "kiko_belok_kanan", message0: "belok kanan %1 derajat", args0: [angka("SUDUT", 90, -360, 360)], ...langkah(WARNA_KATEGORI.gerak), tooltip: "Putar arah Kiko searah jarum jam." },
    { type: "kiko_belok_kiri", message0: "belok kiri %1 derajat", args0: [angka("SUDUT", 90, -360, 360)], ...langkah(WARNA_KATEGORI.gerak), tooltip: "Putar arah Kiko berlawanan jarum jam." },
    { type: "kiko_lingkaran", message0: "gambar lingkaran jari-jari %1", args0: [angka("JARI", 50, -300, 300)], ...langkah(WARNA_KATEGORI.gerak), tooltip: "Lingkaran digambar ke kiri dari posisi Kiko." },
    { type: "kiko_pulang", message0: "kembali ke tengah", ...langkah(WARNA_KATEGORI.gerak), tooltip: "Kiko pindah ke titik (0, 0) dan menghadap kanan." },
    { type: "kiko_warna_pena", message0: "warna pena %1", args0: [pilihWarna("#1d4ed8")], ...langkah(WARNA_KATEGORI.pena), tooltip: "Ganti warna garis." },
    { type: "kiko_tebal_pena", message0: "tebal pena %1", args0: [angka("TEBAL", 3, 1, 30)], ...langkah(WARNA_KATEGORI.pena), tooltip: "Atur ketebalan garis." },
    { type: "kiko_pena_naik", message0: "angkat pena", ...langkah(WARNA_KATEGORI.pena), tooltip: "Kiko berpindah tanpa menggambar." },
    { type: "kiko_pena_turun", message0: "turunkan pena", ...langkah(WARNA_KATEGORI.pena), tooltip: "Kiko menggambar lagi saat berpindah." },
    { type: "kiko_mulai_isi", message0: "mulai isi warna %1", args0: [pilihWarna("#84cc16")], ...langkah(WARNA_KATEGORI.pena), tooltip: "Bentuk yang digambar setelah ini akan diwarnai." },
    { type: "kiko_selesai_isi", message0: "selesai isi warna", ...langkah(WARNA_KATEGORI.pena), tooltip: "Warnai bagian dalam bentuk." },
    {
      type: "kiko_bicara",
      message0: "Kiko bilang %1",
      args0: [{ type: "field_input", name: "TEKS", text: "Halo!" }],
      ...langkah(WARNA_KATEGORI.bicara),
      tooltip: "Tampilkan pesan di panel Keluaran.",
    },
    {
      type: "kiko_ulangi",
      message0: "ulangi %1 kali",
      args0: [angka("KALI", 4, 0, 100)],
      message1: "lakukan %1",
      args1: [{ type: "input_statement", name: "LAKUKAN" }],
      ...langkah(WARNA_KATEGORI.kontrol),
      tooltip: "Jalankan blok di dalamnya beberapa kali (maksimal 100).",
    },
    {
      type: "kiko_jika",
      message0: "jika %1 %2 %3",
      args0: [
        { type: "field_input", name: "VAR", text: "skor" },
        { type: "field_dropdown", name: "OP", options: OPERATOR_BLOK },
        angka("NILAI", 10, -100000, 100000),
      ],
      message1: "maka %1",
      args1: [{ type: "input_statement", name: "MAKA" }],
      message2: "selainnya %1",
      args2: [{ type: "input_statement", name: "SELAINNYA" }],
      ...langkah(WARNA_KATEGORI.kontrol),
      tooltip: "Pilih blok yang dijalankan berdasarkan nilai variabel.",
    },
    {
      type: "kiko_atur_var",
      message0: "atur %1 = %2",
      args0: [{ type: "field_input", name: "VAR", text: "skor" }, angka("NILAI", 0, -100000, 100000)],
      ...langkah(WARNA_KATEGORI.variabel),
      tooltip: "Simpan angka ke dalam variabel. Variabel yang belum diatur bernilai 0.",
    },
    {
      type: "kiko_ubah_var",
      message0: "ubah %1 sebesar %2",
      args0: [{ type: "field_input", name: "VAR", text: "skor" }, angka("UBAH", 1, -100000, 100000)],
      ...langkah(WARNA_KATEGORI.variabel),
      tooltip: "Tambah (atau kurangi, jika negatif) nilai variabel.",
    },
  ]);
}

export const TOOLBOX_KIKO = {
  kind: "categoryToolbox",
  contents: [
    { kind: "category", name: "Mulai", colour: WARNA_KATEGORI.mulai, contents: [{ kind: "block", type: TIPE_MULAI }] },
    {
      kind: "category",
      name: "Gerak",
      colour: WARNA_KATEGORI.gerak,
      contents: [
        { kind: "block", type: "kiko_maju" },
        { kind: "block", type: "kiko_mundur" },
        { kind: "block", type: "kiko_belok_kanan" },
        { kind: "block", type: "kiko_belok_kiri" },
        { kind: "block", type: "kiko_lingkaran" },
        { kind: "block", type: "kiko_pulang" },
      ],
    },
    {
      kind: "category",
      name: "Pena",
      colour: WARNA_KATEGORI.pena,
      contents: [
        { kind: "block", type: "kiko_warna_pena" },
        { kind: "block", type: "kiko_tebal_pena" },
        { kind: "block", type: "kiko_pena_naik" },
        { kind: "block", type: "kiko_pena_turun" },
        { kind: "block", type: "kiko_mulai_isi" },
        { kind: "block", type: "kiko_selesai_isi" },
      ],
    },
    {
      kind: "category",
      name: "Kontrol",
      colour: WARNA_KATEGORI.kontrol,
      contents: [
        { kind: "block", type: "kiko_ulangi" },
        { kind: "block", type: "kiko_jika" },
      ],
    },
    {
      kind: "category",
      name: "Variabel",
      colour: WARNA_KATEGORI.variabel,
      contents: [
        { kind: "block", type: "kiko_atur_var" },
        { kind: "block", type: "kiko_ubah_var" },
      ],
    },
    { kind: "category", name: "Bicara", colour: WARNA_KATEGORI.bicara, contents: [{ kind: "block", type: "kiko_bicara" }] },
  ],
};

/** Tema Blockly dari token warna situs saat ini (dibaca dari CSS variables), jadi ikut mode terang/gelap. */
export function temaKodie(B: Blockly): BlocklyNS.Theme {
  const gaya = getComputedStyle(document.documentElement);
  const v = (nama: string, cadangan: string) => gaya.getPropertyValue(nama).trim() || cadangan;
  const gelap = gaya.colorScheme.includes("dark");
  const nama = gelap ? "kodie_gelap" : "kodie_terang";
  return B.Theme.defineTheme(nama, {
    name: nama,
    base: B.Themes.Zelos,
    componentStyles: {
      workspaceBackgroundColour: v("--k-surface-sunken", gelap ? "#0b1220" : "#f4f7fc"),
      toolboxBackgroundColour: v("--k-surface", gelap ? "#111c33" : "#ffffff"),
      toolboxForegroundColour: v("--k-text", gelap ? "#f1f5f9" : "#0f172a"),
      flyoutBackgroundColour: v("--k-surface-raised", gelap ? "#16233f" : "#ffffff"),
      flyoutForegroundColour: v("--k-text", gelap ? "#f1f5f9" : "#0f172a"),
      flyoutOpacity: 1,
      scrollbarColour: v("--k-border-strong", "#94a3b8"),
      insertionMarkerColour: v("--k-primary", "#1d4ed8"),
      insertionMarkerOpacity: 0.35,
      cursorColour: v("--k-primary", "#1d4ed8"),
    },
    fontStyle: { family: getComputedStyle(document.body).fontFamily, weight: "700", size: 12 },
  });
}
