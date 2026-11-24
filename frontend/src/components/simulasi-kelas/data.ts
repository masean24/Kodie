/**
 * Data simulasi kelas live di beranda (diadaptasi dari `docs/kodie_live_class_simulasi_google_meet_zoom.html`).
 * Semua nama siswa karangan. Materi ditampilkan memakai tampilan Kodie Lab mode Python.
 */

/** Jenis token sintaks; warnanya memakai variabel `--lab-*` di `globals.css` (sama dengan editor Kodie Lab). */
export type JenisToken = "kw" | "str" | "num" | "com" | "fn" | "teks";
export type Token = readonly [JenisToken, string];

export type Materi = {
  modul: string;
  judul: string;
  berkas: string;
  baris: Token[][];
  keluaran: string[];
  penjelasan: string;
};

export const MATERI: Materi[] = [
  {
    modul: "Modul 1 · Dasar Python",
    judul: "Mengenal variabel dan tipe data",
    berkas: "variabel.py",
    baris: [
      [["com", "# Simpan teks (string) dan angka (int)"]],
      [["teks", "nama_siswa = "], ["str", '"Fahim"']],
      [["teks", "skor_latihan = "], ["num", "95"]],
      [["fn", "print"], ["teks", "("], ["str", 'f"Halo {nama_siswa}, skormu {skor_latihan}!"'], ["teks", ")"]],
    ],
    keluaran: ["Halo Fahim, skormu 95!"],
    penjelasan: "Bayangkan variabel seperti kotak berlabel. Teks selalu diapit tanda kutip, angka ditulis langsung tanpa kutip.",
  },
  {
    modul: "Modul 2 · Perulangan",
    judul: "Otomatisasi dengan for loop",
    berkas: "tangga_bintang.py",
    baris: [
      [["com", "# Cetak pola bintang 1 sampai 4"]],
      [["kw", "for"], ["teks", " baris "], ["kw", "in"], ["teks", " "], ["fn", "range"], ["teks", "("], ["num", "1"], ["teks", ", "], ["num", "5"], ["teks", "):"]],
      [["teks", "    "], ["fn", "print"], ["teks", "("], ["str", '"*"'], ["teks", " * baris)"]],
      [["fn", "print"], ["teks", "("], ["str", '"Selesai!"'], ["teks", ")"]],
    ],
    keluaran: ["*", "**", "***", "****", "Selesai!"],
    penjelasan: "Perhatikan baris ketiga menjorok ke kanan. Di Python, isi for wajib diberi indentasi supaya komputer tahu bagian mana yang diulang.",
  },
  {
    modul: "Modul 3 · Kuis live",
    judul: "Tebak output kode bersama Kiko",
    berkas: "kuis_if.py",
    baris: [
      [["teks", "energi_kiko = "], ["num", "10"]],
      [["kw", "if"], ["teks", " energi_kiko >= "], ["num", "10"], ["teks", ":"]],
      [["teks", "    energi_kiko = energi_kiko + "], ["num", "5"]],
      [["fn", "print"], ["teks", "("], ["str", '"Energi akhir:"'], ["teks", ", energi_kiko)"]],
    ],
    keluaran: ["Energi akhir: 15"],
    penjelasan: "Karena 10 >= 10 bernilai benar, energi bertambah 5 menjadi 15. Siapa yang tebakannya tepat?",
  },
];

export type GayaRambut = "panjang" | "pendek" | "hijab" | "keriting" | "bob" | "rapi";

/** Latar ruangan kamera (porting dari referensi simulasi). */
export type Ruang = "rakHangat" | "jendelaBata" | "kamarGelap" | "rakKrem" | "mejaPastel" | "jendelaNyaman";

export type Siswa = {
  id: string;
  nama: string;
  /** Nama sapaan di teks otomatis, misalnya "Menjawab Fahim". */
  panggilan: string;
  /** Latar ruangan kamera. */
  ruang: Ruang;
  /** Warna avatar di teks otomatis dan daftar peserta. */
  aksen: string;
  kulit: string;
  bayangan: string;
  rambut: string;
  gaya: GayaRambut;
  baju: string;
  bajuAlt: string;
  kacamata?: boolean;
  earbuds?: boolean;
  pertanyaan: string;
  jawabanKiko: string;
};

/** Peserta kelas simulasi: nama anggota tim Kodie. */
export const SISWA: Siswa[] = [
  {
    id: "fahim",
    nama: "Mgs. M. Fahim R",
    panggilan: "Fahim",
    ruang: "rakHangat",
    aksen: "#f97316",
    kulit: "#f0c09e",
    bayangan: "#d9a07b",
    rambut: "#2c1e1a",
    gaya: "pendek",
    baju: "#60a5fa",
    bajuAlt: "#ffffff",
    earbuds: true,
    pertanyaan: 'Kak Kiko, kalau nama variabel pakai spasi, misalnya "nama siswa", boleh nggak?',
    jawabanKiko: "Pertanyaan bagus, Fahim! Nama variabel tidak boleh berspasi. Ganti dengan garis bawah, jadi nama_siswa.",
  },
  {
    id: "raihan",
    nama: "Raihan Daris Ramadhan",
    panggilan: "Raihan",
    ruang: "jendelaBata",
    aksen: "#2563eb",
    kulit: "#dfaa84",
    bayangan: "#c48a62",
    rambut: "#1b1b1e",
    gaya: "pendek",
    baju: "#334155",
    bajuAlt: "#1e293b",
    kacamata: true,
    pertanyaan: "Kak, kenapa range(1, 5) cuma sampai 4? Angka 5-nya kok nggak ikut?",
    jawabanKiko: "Keren, Raihan! Batas akhir range() tidak ikut dihitung, jadi berhenti satu angka sebelum 5.",
  },
  {
    id: "khalil",
    nama: "Khalil Amin Adillah",
    panggilan: "Khalil",
    ruang: "kamarGelap",
    aksen: "#38bdf8",
    kulit: "#c88e68",
    bayangan: "#a9714e",
    rambut: "#18181b",
    gaya: "keriting",
    baju: "#0f766e",
    bajuAlt: "#115e59",
    earbuds: true,
    pertanyaan: "Kalau lupa menulis titik dua setelah if, nanti error-nya gimana, Kak?",
    jawabanKiko: "Python akan menampilkan SyntaxError, Khalil. Tenang, pesan galatnya menunjukkan baris yang perlu diperbaiki.",
  },
  {
    id: "ica",
    nama: "Ica Septriani",
    panggilan: "Ica",
    ruang: "rakKrem",
    aksen: "#db2777",
    kulit: "#f3c7a8",
    bayangan: "#dcaa88",
    rambut: "#45261a",
    gaya: "panjang",
    baju: "#be185d",
    bajuAlt: "#9d174d",
    pertanyaan: "Kak, aku coba kodenya di Kodie Lab dan bintangnya langsung muncul!",
    jawabanKiko: "Mantap, Ica! Coba ubah angka 5 jadi 8 supaya tangga bintangnya makin tinggi.",
  },
  {
    id: "davina",
    nama: "Davina",
    panggilan: "Davina",
    ruang: "mejaPastel",
    aksen: "#65a30d",
    kulit: "#ecc09e",
    bayangan: "#d1a07d",
    rambut: "#3f2a1d",
    gaya: "bob",
    baju: "#7c3aed",
    bajuAlt: "#ede9fe",
    kacamata: true,
    pertanyaan: "Kak, nilai skor_latihan bisa diubah lagi di baris bawahnya?",
    jawabanKiko: "Bisa banget, Davina! Itulah kenapa namanya variabel: nilainya boleh berubah selama program berjalan.",
  },
];

/** Karakter pengunjung ("Kamu") di kamera. */
export const KAMU = {
  ruang: "jendelaNyaman" as Ruang,
  kulit: "#ecc09e",
  bayangan: "#d1a07d",
  rambut: "#1f1b18",
  gaya: "rapi" as GayaRambut,
  baju: "#e2e8f0",
  bajuAlt: "#cbd5e1",
  earbuds: true,
};

export const PERTANYAAN_CEPAT = ["Apa itu variabel?", "Kenapa harus menjorok?", "Bisa dicoba di rumah?"];

/** Jawaban Kiko untuk pertanyaan yang diketik pengunjung (aturan kata kunci sederhana, tanpa AI). */
export function jawabanKikoUntuk(pertanyaan: string): string {
  const q = pertanyaan.toLowerCase();
  if (q.includes("variabel")) {
    return "Variabel itu wadah berlabel untuk menyimpan data: teks, angka, benar/salah, sampai daftar nilai.";
  }
  if (q.includes("jorok") || q.includes("indent") || q.includes("spasi") || q.includes("for")) {
    return "Indentasi (4 spasi ke kanan) menandai baris yang berada di dalam for atau if. Tanpa itu, Python bingung.";
  }
  if (q.includes("rumah") || q.includes("coba") || q.includes("lab") || q.includes("install")) {
    return "Bisa! Buka Kodie Lab dari menu atas. Gratis, tanpa akun, dan langsung jalan di browser.";
  }
  if (q.includes("harga") || q.includes("biaya") || q.includes("daftar") || q.includes("jadwal")) {
    return "Jadwal dan biaya tiap paket ada di halaman Kelas. Satu paket berisi 4 sesi, seminggu sekali.";
  }
  return "Pertanyaan keren! Di kelas asli, pengajar menjawab langsung seperti ini, dan kamu bisa mencobanya di Kodie Lab.";
}

export const REAKSI = ["👏", "🎉", "💡", "❤️", "😂"] as const;
