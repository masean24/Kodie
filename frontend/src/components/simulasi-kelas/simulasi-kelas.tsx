"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import {
  Captions,
  Code2,
  FileCode2,
  Hand,
  Info,
  LayoutGrid,
  Loader2,
  MessageSquareText,
  Mic,
  MicOff,
  MonitorUp,
  Phone,
  Play,
  Puzzle,
  SendHorizontal,
  Smile,
  Turtle,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { kurangiGerak } from "@/lib/gsap";
import { KameraKikoPiksel, KameraPiksel } from "./pixel";
import { KAMU, MATERI, PERTANYAAN_CEPAT, REAKSI, SISWA, jawabanKikoUntuk, type Materi, type Token } from "./data";

type Pesan = { id: number; dari: string; teks: string; kiko?: boolean; kamu?: boolean };
type Teks = { nama: string; label: string; teks: string; warna: string };
type Fase = "ketik" | "jalan" | "selesai";
type Laci = "obrolan" | "peserta" | "info" | null;

const KIKO = "Kiko (Pengajar)";
const WARNA_KIKO = "#1a73e8";
const JUDUL_TAB = ["1. Variabel", "2. Perulangan", "3. Kuis"];

const WARNA_TOKEN: Record<Token[0], string> = {
  kw: "text-[var(--lab-kw)] font-semibold",
  str: "text-[var(--lab-str)]",
  num: "text-[var(--lab-num)]",
  com: "text-[var(--lab-com)] italic",
  fn: "text-[var(--lab-fn)] font-semibold",
  teks: "text-text",
};

const MODE_LAB = [
  { label: "Blok", ikon: Puzzle },
  { label: "Python Turtle", ikon: Turtle },
  { label: "HTML, CSS, JS", ikon: Code2 },
  { label: "Python", ikon: FileCode2, aktif: true },
];

const MQ_DESKTOP = "(min-width: 1024px)";
function langgananLebar(cb: () => void) {
  const mq = window.matchMedia(MQ_DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

const formatJam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

function panjangBaris(baris: Token[]) {
  return baris.reduce((n, [, t]) => n + t.length, 0);
}

/** Potong token satu baris sampai sejumlah karakter yang sudah "diketik". */
function potongBaris(baris: Token[], sisa: number): Token[] {
  const hasil: Token[] = [];
  let jatah = sisa;
  for (const [jenis, teks] of baris) {
    if (jatah <= 0) break;
    hasil.push([jenis, teks.slice(0, jatah)]);
    jatah -= teks.length;
  }
  return hasil;
}

/** Jatah karakter tiap baris dari total karakter yang sudah diketik. */
function bagiKetikan(materi: Materi, ketik: number) {
  const hasil: { baris: Token[]; penuh: boolean }[] = [];
  let sisa = ketik;
  for (const b of materi.baris) {
    const n = panjangBaris(b);
    hasil.push({ baris: potongBaris(b, sisa), penuh: sisa >= n });
    sisa = Math.max(0, sisa - n);
  }
  return hasil;
}

function Gelombang() {
  return (
    <span aria-hidden className="flex h-3 items-end gap-[2px]">
      <span className="sk-gelombang w-[3px] rounded-full bg-white" />
      <span className="sk-gelombang sk-gelombang-2 w-[3px] rounded-full bg-white" />
      <span className="sk-gelombang sk-gelombang-3 w-[3px] rounded-full bg-white" />
    </span>
  );
}

/** Tile kamera ala Google Meet: nama di kiri bawah, status mikrofon di kanan atas, bingkai biru saat bicara. */
function Tile({
  nama,
  bicara,
  tangan,
  bisu,
  gelembung,
  children,
  className,
}: {
  nama: string;
  bicara: boolean;
  tangan?: boolean;
  bisu?: boolean;
  gelembung?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("relative min-h-0 overflow-hidden rounded-[10px] bg-[#3c4043]", className)}>
      {children}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
      <span className="absolute bottom-1.5 left-2 max-w-[calc(100%-16px)] truncate text-[12px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
        {nama}
      </span>
      {bicara ? (
        <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-[#1a73e8]">
          <Gelombang />
        </span>
      ) : bisu ? (
        <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-[#202124]/60">
          <MicOff aria-hidden className="size-3.5 text-white" />
        </span>
      ) : null}
      {tangan ? (
        <span className="sk-muncul absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-[#fdd663] text-[#202124]">
          <Hand aria-hidden className="size-3.5" />
        </span>
      ) : null}
      {gelembung ? (
        <span className="sk-muncul absolute bottom-7 left-2 max-w-[calc(100%-16px)] rounded-full bg-[#202124]/85 px-2.5 py-1 text-[11px] font-bold leading-tight text-white ring-1 ring-[#c6f64d]/60">
          {gelembung}
        </span>
      ) : null}
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-0 rounded-[10px] ring-[3px] ring-inset transition-colors duration-200",
          bicara ? "ring-[#8ab4f8]" : "ring-transparent",
        )}
      />
    </div>
  );
}

function TombolBulat({
  label,
  nada = "biasa",
  onClick,
  children,
  className,
  ...rest
}: {
  label: string;
  nada?: "biasa" | "mati" | "nyala";
  onClick: () => void;
  children: ReactNode;
  className?: string;
  "aria-pressed"?: boolean;
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      {...rest}
      className={cx(
        "grid size-11 shrink-0 place-items-center rounded-full transition-colors",
        nada === "mati" && "bg-[#ea4335] text-white hover:bg-[#d93025]",
        nada === "nyala" && "bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]",
        nada === "biasa" && "bg-[#3c4043] text-white hover:bg-[#4a4e51]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function TombolIkon({
  label,
  aktif,
  onClick,
  children,
  lencana,
}: {
  label: string;
  aktif: boolean;
  onClick: () => void;
  children: ReactNode;
  lencana?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={aktif}
      onClick={onClick}
      className={cx(
        "relative grid size-11 place-items-center rounded-full transition-colors",
        aktif ? "bg-[#8ab4f8]/25 text-[#8ab4f8]" : "text-white hover:bg-white/10",
      )}
    >
      {children}
      {lencana ? (
        <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#5f6368] px-1 text-[10px] font-bold text-white">
          {lencana}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Simulasi kelas live di beranda dengan tata letak ala Google Meet: Kiko mempresentasikan layar Kodie Lab
 * (mode Python), mengetik kode, menjalankannya, lalu menjawab pertanyaan peserta bergantian. Pengunjung bisa
 * bertanya di obrolan, mengangkat tangan, memberi reaksi, menyalakan teks otomatis, dan mematikan mikrofon/kamera.
 *
 * Ringan: tidak memuat CodeMirror, Blockly, atau Pyodide (tampilan Lab hanya tiruan HTML/CSS), karakter pixel
 * art digabung per warna (±20 elemen SVG per kamera), dan semua timer serta animasi CSS berhenti saat simulasi
 * di luar layar. Komponen ini dimuat malas oleh `SimulasiKelasMalas`.
 */
export default function SimulasiKelas() {
  const akar = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(false);
  // Panel samping dirender sekali saja: di samping kamera (desktop) atau menutupi presentasi (ponsel).
  const desktop = useSyncExternalStore(langgananLebar, () => window.matchMedia(MQ_DESKTOP).matches, () => true);
  const instan = useMemo(() => kurangiGerak(), []);

  const [idxMateri, setIdxMateri] = useState(0);
  const [ketik, setKetik] = useState(0);
  const [fase, setFase] = useState<Fase>("ketik");
  const [pembicara, setPembicara] = useState<string | null>("kiko");
  const [kikoSenang, setKikoSenang] = useState(false);
  const [tanganSiswa, setTanganSiswa] = useState<string | null>(null);
  const [gelembung, setGelembung] = useState<Record<string, string>>({});
  const [angguk, setAngguk] = useState(false);
  const [teks, setTeks] = useState<Teks>({
    nama: KIKO,
    label: "Membuka kelas",
    teks: "Halo semuanya! Hari ini kita belajar Python di Kodie Lab.",
    warna: WARNA_KIKO,
  });
  const [cc, setCc] = useState(true);
  const [mic, setMic] = useState(false);
  const [kamera, setKamera] = useState(true);
  const [tanganKamu, setTanganKamu] = useState(false);
  const [laci, setLaci] = useState<Laci>(null);
  const [pesan, setPesan] = useState<Pesan[]>([
    { id: 0, dari: KIKO, teks: "Halo semuanya! Tulis pertanyaanmu di sini ya, nanti Kiko jawab.", kiko: true },
  ]);
  const [belumDibaca, setBelumDibaca] = useState(0);
  const [ketikan, setKetikan] = useState("");
  const [pilihReaksi, setPilihReaksi] = useState(false);
  const [terbang, setTerbang] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [keluar, setKeluar] = useState(false);
  const [jam, setJam] = useState(() => formatJam.format(new Date()));

  const nomor = useRef(1);
  const giliranTanya = useRef(0);
  const jadwalQa = useRef(new Set<number>());
  const daftarPesan = useRef<HTMLOListElement>(null);
  const laciRef = useRef<Laci>(null);

  const materi: Materi = MATERI[idxMateri] ?? MATERI[0]!;
  const totalKarakter = useMemo(() => materi.baris.reduce((n, b) => n + panjangBaris(b), 0), [materi]);

  useEffect(() => {
    laciRef.current = laci;
  }, [laci]);

  // Aktif hanya saat simulasi terlihat: timer dan animasi CSS berhenti di luar layar.
  useEffect(() => {
    const el = akar.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setAktif(Boolean(e?.isIntersecting)), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const jadwalkan = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      jadwalQa.current.delete(id);
      fn();
    }, ms);
    jadwalQa.current.add(id);
  }, []);
  const hapusJadwal = useCallback(() => {
    for (const id of jadwalQa.current) window.clearTimeout(id);
    jadwalQa.current.clear();
  }, []);

  const tambahPesan = useCallback((p: Omit<Pesan, "id">) => {
    setPesan((lama) => [...lama.slice(-30), { ...p, id: nomor.current++ }]);
    if (laciRef.current !== "obrolan") setBelumDibaca((n) => n + 1);
  }, []);

  const lontarkan = useCallback((emoji: string) => {
    const id = nomor.current++;
    setTerbang((lama) => [...lama, { id, emoji, x: 4 + Math.round(Math.random() * 18) }]);
    window.setTimeout(() => setTerbang((lama) => lama.filter((r) => r.id !== id)), 2600);
  }, []);

  const tampilkanGelembung = useCallback((id: string, isi: string, ms = 2600) => {
    setGelembung((g) => ({ ...g, [id]: isi }));
    window.setTimeout(
      () =>
        setGelembung((g) => {
          if (g[id] !== isi) return g;
          const sisa = { ...g };
          delete sisa[id];
          return sisa;
        }),
      ms,
    );
  }, []);

  const kikoBicara = useCallback((label: string, isi: string, senang = false) => {
    setPembicara("kiko");
    setKikoSenang(senang);
    setTeks({ nama: KIKO, label, teks: isi, warna: WARNA_KIKO });
  }, []);

  /** Satu putaran tanya-jawab: peserta bertanya, Kiko menjawab, kelas mengangguk. */
  const siswaBertanya = useCallback(() => {
    const s = SISWA[giliranTanya.current++ % SISWA.length];
    if (!s) return;
    hapusJadwal();
    setTanganSiswa(s.id);
    setPembicara(s.id);
    setKikoSenang(false);
    tampilkanGelembung(s.id, "Kak, mau tanya!");
    setTeks({ nama: s.nama, label: "Bertanya", teks: s.pertanyaan, warna: s.aksen });
    tambahPesan({ dari: s.nama, teks: s.pertanyaan });
    jadwalkan(() => {
      setTanganSiswa(null);
      kikoBicara(`Menjawab ${s.panggilan}`, s.jawabanKiko, true);
      tampilkanGelembung("kiko", "Pertanyaan bagus!");
      tambahPesan({ dari: KIKO, teks: s.jawabanKiko, kiko: true });
      lontarkan("💡");
      jadwalkan(() => {
        tampilkanGelembung(s.id, "Paham, Kak! Makasih!");
        setAngguk(true);
        jadwalkan(() => setAngguk(false), 1300);
      }, 1600);
      jadwalkan(() => setPembicara(null), 4200);
    }, 3000);
  }, [hapusJadwal, jadwalkan, kikoBicara, lontarkan, tambahPesan, tampilkanGelembung]);

  // Jam kelas (WIB).
  useEffect(() => {
    if (!aktif) return;
    const t = window.setInterval(() => setJam(formatJam.format(new Date())), 30_000);
    return () => window.clearInterval(t);
  }, [aktif]);

  // Kiko mengetik kode karakter demi karakter (langsung utuh bila gerak dikurangi).
  useEffect(() => {
    if (!aktif || keluar || fase !== "ketik") return;
    if (instan || ketik >= totalKarakter) {
      const t = window.setTimeout(() => setFase("jalan"), instan ? 0 : 600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setKetik((k) => Math.min(totalKarakter, k + 2)), 45);
    return () => window.clearTimeout(t);
  }, [aktif, keluar, fase, ketik, totalKarakter, instan]);

  // Tombol Jalankan ditekan, lalu keluaran dan penjelasan Kiko muncul.
  useEffect(() => {
    if (!aktif || keluar || fase !== "jalan") return;
    const t = window.setTimeout(() => {
      setFase("selesai");
      kikoBicara(materi.modul, materi.penjelasan);
    }, 900);
    return () => window.clearTimeout(t);
  }, [aktif, keluar, fase, materi, kikoBicara]);

  // Pindah materi otomatis setelah beberapa saat.
  useEffect(() => {
    if (!aktif || keluar || fase !== "selesai") return;
    const t = window.setTimeout(() => {
      setIdxMateri((i) => (i + 1) % MATERI.length);
      setKetik(0);
      setFase("ketik");
    }, 17_000);
    return () => window.clearTimeout(t);
  }, [aktif, keluar, fase, idxMateri]);

  // Peserta bertanya bergantian.
  useEffect(() => {
    if (!aktif || keluar) return;
    const awal = window.setTimeout(siswaBertanya, 5000);
    const t = window.setInterval(siswaBertanya, 12_000);
    return () => {
      window.clearTimeout(awal);
      window.clearInterval(t);
      hapusJadwal();
    };
  }, [aktif, keluar, siswaBertanya, hapusJadwal]);

  // Obrolan selalu bergulir ke pesan terbaru.
  useEffect(() => {
    const el = daftarPesan.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pesan, laci]);

  const bukaLaci = (l: Exclude<Laci, null>) => {
    setLaci((lama) => (lama === l ? null : l));
    if (l === "obrolan") setBelumDibaca(0);
  };

  const pilihMateri = (i: number) => {
    setIdxMateri(i);
    setKetik(0);
    setFase("ketik");
  };

  const kirimPertanyaan = (isi: string) => {
    const q = isi.trim();
    if (!q) return;
    hapusJadwal();
    setKetikan("");
    tambahPesan({ dari: "Kamu", teks: q, kamu: true });
    setPembicara("kamu");
    setTeks({ nama: "Kamu", label: "Bertanya di obrolan", teks: q, warna: "#65a30d" });
    jadwalkan(() => {
      const jawab = jawabanKikoUntuk(q);
      kikoBicara("Menjawab pertanyaanmu", jawab, true);
      tambahPesan({ dari: KIKO, teks: jawab, kiko: true });
      lontarkan("🎉");
      jadwalkan(() => setPembicara(null), 4000);
    }, 1300);
  };

  const kirim = (e: FormEvent) => {
    e.preventDefault();
    kirimPertanyaan(ketikan);
  };

  const angkatTangan = () => {
    const baru = !tanganKamu;
    setTanganKamu(baru);
    if (!baru) return;
    hapusJadwal();
    kikoBicara("Melihat tanganmu", "Kiko lihat tanganmu terangkat! Silakan tulis pertanyaanmu di obrolan ya.", true);
    setLaci("obrolan");
    setBelumDibaca(0);
    jadwalkan(() => {
      setTanganKamu(false);
      setPembicara(null);
    }, 4500);
  };

  const keluarKelas = () => {
    hapusJadwal();
    setKeluar(true);
  };

  const gabungLagi = () => {
    setKeluar(false);
    kikoBicara("Menyambut", "Selamat datang kembali! Kita lanjutkan materinya ya.", true);
  };

  const barisKetik = bagiKetikan(materi, instan ? totalKarakter : ketik);
  const belumPenuh = barisKetik.findIndex((x) => !x.penuh);
  const barisAktif = belumPenuh === -1 ? barisKetik.length - 1 : belumPenuh;
  const jumlahPeserta = SISWA.length + 2;

  const isiLaci = (
    <div className="flex h-full flex-col rounded-[16px] bg-white text-[#202124]">
      <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
        <p className="text-lg font-medium">
          {laci === "obrolan" ? "Pesan dalam panggilan" : laci === "peserta" ? "Orang" : "Detail kelas"}
        </p>
        <button
          type="button"
          aria-label="Tutup panel"
          onClick={() => setLaci(null)}
          className="grid size-10 place-items-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      {laci === "obrolan" ? (
        <>
          <p className="mx-4 rounded-lg bg-[#f1f3f4] px-3 py-2 text-xs leading-snug text-[#5f6368]">
            Pesan hanya terlihat oleh peserta kelas ini. Coba tanya Kiko apa saja tentang materi.
          </p>
          <ol ref={daftarPesan} role="log" aria-label="Pesan obrolan" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-3">
            {pesan.map((p) => (
              <li key={p.id} className="sk-muncul text-sm">
                <p className={cx("text-xs font-bold", p.kiko ? "text-[#1a73e8]" : p.kamu ? "text-[#188038]" : "text-[#202124]")}>{p.dari}</p>
                <p className="mt-0.5 leading-snug text-[#3c4043]">{p.teks}</p>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {PERTANYAAN_CEPAT.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => kirimPertanyaan(q)}
                className="min-h-[32px] rounded-full border border-[#dadce0] px-3 text-xs font-medium text-[#1a73e8] hover:bg-[#e8f0fe]"
              >
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={kirim} className="flex items-center gap-2 p-3">
            <label htmlFor="sk-tanya" className="sr-only">
              Kirim pesan ke semua peserta
            </label>
            <input
              id="sk-tanya"
              value={ketikan}
              onChange={(e) => setKetikan(e.target.value)}
              maxLength={140}
              autoComplete="off"
              placeholder="Kirim pesan"
              className="min-h-[44px] min-w-0 flex-1 rounded-full bg-[#f1f3f4] px-4 text-sm text-[#202124] placeholder:text-[#5f6368]"
            />
            <button
              type="submit"
              aria-label="Kirim pesan"
              className="grid size-11 shrink-0 place-items-center rounded-full text-[#1a73e8] hover:bg-[#e8f0fe]"
            >
              <SendHorizontal aria-hidden className="size-5" />
            </button>
          </form>
        </>
      ) : laci === "peserta" ? (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {[{ id: "kiko", nama: KIKO, warna: WARNA_KIKO, ket: "Penyelenggara" }, ...SISWA.map((s) => ({ id: s.id, nama: s.nama, warna: s.aksen, ket: "Peserta" })), { id: "kamu", nama: "Kamu", warna: "#65a30d", ket: "Peserta" }].map(
            (o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#f1f3f4]">
                <span className="grid size-9 shrink-0 place-items-center rounded-full font-bold text-white" style={{ backgroundColor: o.warna }}>
                  {o.nama.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{o.nama}</span>
                  <span className="block text-xs text-[#5f6368]">{o.ket}</span>
                </span>
                {pembicara === o.id ? (
                  <span className="grid size-7 place-items-center rounded-full bg-[#1a73e8]">
                    <Gelombang />
                  </span>
                ) : (o.id === "kamu" ? !mic : o.id !== "kiko") ? (
                  <MicOff aria-label="Mikrofon mati" className="size-4 text-[#5f6368]" />
                ) : (
                  <Mic aria-label="Mikrofon menyala" className="size-4 text-[#5f6368]" />
                )}
              </li>
            ),
          )}
        </ul>
      ) : (
        <div className="space-y-3 px-5 pb-5 text-sm text-[#3c4043]">
          <p className="font-medium text-[#202124]">Kelas Python · Coding Dasar</p>
          <p>Pengajar: Kiko. Kelas kecil maksimal 15 siswa, 4 sesi seminggu sekali.</p>
          <p>Di kelas asli, tautan Google Meet dibuat otomatis per sesi dan muncul di halaman sesi siswa.</p>
          <Link href="/kelas" className="inline-flex min-h-[40px] items-center rounded-full bg-[#1a73e8] px-4 font-medium text-white hover:bg-[#1765cc]">
            Lihat jadwal kelas
          </Link>
        </div>
      )}
    </div>
  );

  const tiles = [
    <Tile key="kiko" nama={KIKO} bicara={pembicara === "kiko"} gelembung={gelembung.kiko} className="col-span-3 lg:col-span-2">
      <KameraKikoPiksel
        bicara={pembicara === "kiko"}
        mood={pembicara && pembicara !== "kiko" ? "penasaran" : kikoSenang ? "senang" : "senyum"}
      />
    </Tile>,
    ...SISWA.map((s, i) => (
      <Tile key={s.id} nama={s.nama} bicara={pembicara === s.id} tangan={tanganSiswa === s.id} bisu={pembicara !== s.id} gelembung={gelembung[s.id]}>
        <KameraPiksel k={s} jeda={i} bicara={pembicara === s.id} tangan={tanganSiswa === s.id} angguk={angguk && pembicara !== s.id} />
      </Tile>
    )),
    <Tile key="kamu" nama="Kamu" bicara={pembicara === "kamu"} tangan={tanganKamu} bisu={!mic}>
      {kamera ? (
        <KameraPiksel k={KAMU} jeda={5} bicara={pembicara === "kamu"} tangan={tanganKamu} />
      ) : (
        <div className="grid size-full place-items-center bg-[#3c4043]">
          <span className="grid size-12 place-items-center rounded-full bg-[#65a30d] text-lg font-bold text-white">K</span>
        </div>
      )}
    </Tile>,
  ];

  return (
    <div
      ref={akar}
      role="region"
      aria-label="Simulasi kelas live Kodie"
      className={cx("relative overflow-hidden rounded-[24px] bg-[#202124] text-white shadow-2xl", !aktif && "sk-jeda")}
    >
      <div className="flex flex-col gap-3 p-3 lg:h-[620px] lg:flex-row">
        {/* Layar presentasi */}
        <div className="relative flex min-h-[460px] min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-white/10 bg-[#1c1d20] lg:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <p className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#1a73e8]">
                <MonitorUp aria-hidden className="size-3.5" />
              </span>
              <span className="truncate">
                <span className="font-bold">Kiko (Pengajar)</span> sedang mempresentasikan
              </span>
            </p>
            <div role="tablist" aria-label="Materi" className="flex gap-1 rounded-lg bg-[#2d2e31] p-1">
              {JUDUL_TAB.map((j, i) => (
                <button
                  key={j}
                  type="button"
                  role="tab"
                  aria-selected={idxMateri === i}
                  onClick={() => pilihMateri(i)}
                  className={cx(
                    "min-h-[32px] rounded-md px-2.5 text-xs font-medium transition-colors",
                    idxMateri === i ? "bg-[#1a73e8] text-white" : "text-[#e8eaed] hover:bg-white/10",
                  )}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-start justify-center p-3 pb-24 sm:p-5 sm:pb-24">
            {/* Layar yang dibagikan: tampilan Kodie Lab */}
            <div className="lab flex w-full max-w-[820px] flex-col gap-3 rounded-[12px] bg-bg p-3 text-text shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-[3px] rounded-full border-[1.5px] border-border-strong bg-surface p-[3px]">
                  {MODE_LAB.map((m) => (
                    <span
                      key={m.label}
                      className={cx(
                        "items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                        m.aktif ? "flex bg-primary text-primary-foreground" : "hidden text-text-muted md:flex",
                      )}
                    >
                      <m.ikon aria-hidden className="size-3.5" />
                      {m.label}
                    </span>
                  ))}
                </div>
                <span
                  className={cx(
                    "flex min-h-[36px] items-center gap-1.5 rounded-full bg-cta px-4 font-display text-sm font-semibold text-cta-foreground",
                    fase === "jalan" && "sk-tekan",
                  )}
                >
                  {fase === "jalan" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Play aria-hidden className="size-4 fill-current" />}
                  {fase === "jalan" ? "Menjalankan" : "Jalankan"}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{materi.modul}</p>
                <p className="truncate font-display text-sm font-semibold sm:text-base">{materi.judul}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-[3fr_2fr]">
                <section aria-label="Editor kode" className="flex min-h-[150px] flex-col overflow-hidden rounded-card-sm border border-border bg-surface">
                  <div className="flex items-center border-b border-border bg-surface-sunken px-2 pt-1.5">
                    <span className="rounded-t-[8px] bg-surface px-3 py-1.5 font-mono text-xs font-bold text-primary">{materi.berkas}</span>
                  </div>
                  <pre className="overflow-hidden p-3 font-mono text-[12px] leading-6 sm:text-[13px]">
                    {barisKetik.map(({ baris }, i) => (
                      <div key={i} className={cx("flex rounded", i === barisAktif && fase === "ketik" && "bg-[var(--lab-sel)]")}>
                        <span aria-hidden className="w-6 shrink-0 select-none pr-2 text-right text-text-muted">
                          {i + 1}
                        </span>
                        <code className="whitespace-pre-wrap break-all">
                          {baris.map(([jenis, isi], j) => (
                            <span key={j} className={WARNA_TOKEN[jenis]}>
                              {isi}
                            </span>
                          ))}
                          {fase === "ketik" && i === barisAktif ? (
                            <span aria-hidden className="sk-kursor ml-px inline-block h-4 w-[2px] translate-y-0.5 bg-primary" />
                          ) : null}
                        </code>
                      </div>
                    ))}
                  </pre>
                </section>
                <section aria-label="Keluaran" className="flex min-h-[110px] flex-col overflow-hidden rounded-card-sm border border-border bg-surface">
                  <div className="border-b border-border bg-surface-sunken px-3 py-2">
                    <span className="text-xs font-bold">Keluaran</span>
                  </div>
                  <div className="p-3 font-mono text-[12px] leading-6 sm:text-[13px]">
                    {fase === "selesai" ? (
                      materi.keluaran.map((k, i) => (
                        <p key={`${idxMateri}-${i}`} className="sk-muncul" style={{ animationDelay: `${i * 90}ms` }}>
                          {k}
                        </p>
                      ))
                    ) : (
                      <p className="text-text-muted">{fase === "jalan" ? "Menjalankan…" : "Klik Jalankan untuk melihat hasil print() di sini."}</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Teks otomatis ala Meet */}
          {cc ? (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
              <div key={teks.teks} className="sk-muncul flex w-full max-w-2xl items-start gap-3 rounded-xl bg-[#202124]/95 px-4 py-3 shadow-xl ring-1 ring-white/10">
                <span className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: teks.warna }}>
                  {teks.nama.charAt(0)}
                </span>
                <div className="min-w-0 text-[13px] leading-snug sm:text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#8ab4f8]">{teks.nama}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-[#bdc1c6]">{teks.label}</span>
                  </p>
                  <p className="mt-1 text-white">&ldquo;{teks.teks}&rdquo;</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Reaksi melayang dari kiri bawah, seperti di Meet */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {terbang.map((r) => (
              <span key={r.id} className="sk-terbang absolute bottom-16 text-3xl" style={{ left: `${r.x}%` }}>
                {r.emoji}
              </span>
            ))}
          </div>

          {/* Panel di layar kecil menutupi layar presentasi */}
          {laci && !desktop ? <div className="absolute inset-0 z-10">{isiLaci}</div> : null}
        </div>

        {/* Kamera peserta atau panel samping (desktop) */}
        <aside aria-label="Peserta" className="lg:w-[400px] lg:shrink-0">
          {laci && desktop ? <div className="h-full">{isiLaci}</div> : null}
          <div
            className={cx(
              "grid grid-cols-3 gap-2 max-lg:auto-rows-[120px] lg:h-full lg:grid-cols-2 lg:grid-rows-[1.25fr_1fr_1fr_1fr]",
              laci && "lg:hidden",
            )}
          >
            {tiles}
          </div>
        </aside>
      </div>

      {/* Bilah kontrol ala Meet */}
      <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-1">
        <p className="hidden min-w-0 items-center gap-3 text-sm lg:flex">
          <span className="font-medium tabular-nums">{jam}</span>
          <span aria-hidden className="h-4 w-px bg-white/30" />
          <span className="truncate font-medium">Kelas Python Kodie</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-[#c6f64d]">
            <span aria-hidden className="sk-kedip size-1.5 rounded-full bg-[#c6f64d]" /> Live
          </span>
        </p>

        <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5 sm:gap-3 lg:flex-none">
          <TombolBulat label={mic ? "Matikan mikrofon" : "Nyalakan mikrofon"} nada={mic ? "biasa" : "mati"} aria-pressed={mic} onClick={() => setMic((v) => !v)}>
            {mic ? <Mic aria-hidden className="size-5" /> : <MicOff aria-hidden className="size-5" />}
          </TombolBulat>
          <TombolBulat label={kamera ? "Matikan kamera" : "Nyalakan kamera"} nada={kamera ? "biasa" : "mati"} aria-pressed={kamera} onClick={() => setKamera((v) => !v)}>
            {kamera ? <Video aria-hidden className="size-5" /> : <VideoOff aria-hidden className="size-5" />}
          </TombolBulat>
          <TombolBulat label={cc ? "Matikan teks otomatis" : "Aktifkan teks otomatis"} nada={cc ? "nyala" : "biasa"} aria-pressed={cc} onClick={() => setCc((v) => !v)} className="max-sm:hidden">
            <Captions aria-hidden className="size-5" />
          </TombolBulat>
          <div className="relative">
            <TombolBulat label="Kirim reaksi" nada={pilihReaksi ? "nyala" : "biasa"} aria-expanded={pilihReaksi} onClick={() => setPilihReaksi((v) => !v)}>
              <Smile aria-hidden className="size-5" />
            </TombolBulat>
            {pilihReaksi ? (
              <div className="sk-muncul absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 gap-1 rounded-full bg-[#3c4043] p-1.5 shadow-xl">
                {REAKSI.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-label={`Reaksi ${r}`}
                    onClick={() => {
                      lontarkan(r);
                      setPilihReaksi(false);
                    }}
                    className="grid size-10 place-items-center rounded-full text-xl hover:bg-white/10"
                  >
                    {r}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <TombolBulat label={tanganKamu ? "Turunkan tangan" : "Angkat tangan"} nada={tanganKamu ? "nyala" : "biasa"} aria-pressed={tanganKamu} onClick={angkatTangan}>
            <Hand aria-hidden className="size-5" />
          </TombolBulat>
          <TombolBulat label={laci === "obrolan" ? "Tutup obrolan" : "Buka obrolan"} nada={laci === "obrolan" ? "nyala" : "biasa"} aria-pressed={laci === "obrolan"} onClick={() => bukaLaci("obrolan")} className="lg:hidden">
            <MessageSquareText aria-hidden className="size-5" />
          </TombolBulat>
          <button
            type="button"
            aria-label="Keluar dari kelas"
            title="Keluar dari kelas"
            onClick={keluarKelas}
            className="grid h-11 w-14 place-items-center rounded-full bg-[#ea4335] sm:w-16 text-white hover:bg-[#d93025]"
          >
            <Phone aria-hidden className="size-5 rotate-[135deg]" />
          </button>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <TombolIkon label="Detail kelas" aktif={laci === "info"} onClick={() => bukaLaci("info")}>
            <Info aria-hidden className="size-5" />
          </TombolIkon>
          <TombolIkon label="Tampilkan semua orang" aktif={laci === "peserta"} onClick={() => bukaLaci("peserta")} lencana={jumlahPeserta}>
            <Users aria-hidden className="size-5" />
          </TombolIkon>
          <TombolIkon label="Obrolan dengan semua orang" aktif={laci === "obrolan"} onClick={() => bukaLaci("obrolan")} lencana={belumDibaca || undefined}>
            <MessageSquareText aria-hidden className="size-5" />
          </TombolIkon>
          <TombolIkon label="Tampilkan kamera peserta" aktif={laci === null} onClick={() => setLaci(null)}>
            <LayoutGrid aria-hidden className="size-5" />
          </TombolIkon>
        </div>
      </div>

      {keluar ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#202124] p-6 text-center">
          <div className="sk-muncul max-w-md">
            <p className="text-2xl font-medium">Kamu keluar dari kelas</p>
            <p className="mt-2 text-[#bdc1c6]">Kelas asli Kodie berjalan seperti ini lewat Google Meet, dengan pengajar yang sudah diverifikasi.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={gabungLagi}
                className="min-h-touch rounded-full border border-[#5f6368] px-5 font-medium text-[#8ab4f8] hover:bg-white/5"
              >
                Gabung kembali
              </button>
              <Link
                href="/kelas"
                className="inline-flex min-h-touch items-center rounded-full bg-[#8ab4f8] px-5 font-medium text-[#202124] hover:bg-[#aecbfa]"
              >
                Lihat jadwal kelas
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
