import { cx } from "@/lib/cx";
import type { GayaRambut, Ruang } from "./data";

/**
 * Karakter kamera pixel art, porting dari `docs/kodie_live_class_simulasi_google_meet_zoom.html`
 * (grid 64 × 40, kepala 14 × 14 ber-outline, ruangan per peserta). Persegi berurutan yang warnanya sama
 * digabung menjadi satu `<path>`, jadi tiap kamera hanya ±20–30 elemen SVG walau bentuknya sama dengan referensi.
 */

type Kotak = [x: number, y: number, w: number, h: number, warna: string];

const GARIS = "#0f172a";
const MATA = "#18181b";
const PUTIH = "#ffffff";
const LIME = "#c6f64d";

/** Gabungkan persegi berurutan berwarna sama menjadi path; urutan lapisan tetap terjaga. */
function P({ kotak }: { kotak: Kotak[] }) {
  const grup: { warna: string; d: string }[] = [];
  for (const [x, y, w, h, warna] of kotak) {
    const akhir = grup[grup.length - 1];
    const d = `M${x} ${y}h${w}v${h}h${-w}z`;
    if (akhir && akhir.warna === warna) akhir.d += d;
    else grup.push({ warna, d });
  }
  return (
    <>
      {grup.map((g, i) => (
        <path key={i} d={g.d} fill={g.warna} />
      ))}
    </>
  );
}

function RUANG(ruang: Ruang): Kotak[] {
  switch (ruang) {
    case "rakHangat":
      return [
        [0, 0, 64, 40, "#f3ece3"], [44, 0, 20, 40, "#d9b8a3"], [44, 0, 1, 40, "#c49a82"],
        [3, 13, 18, 2, "#92400e"], [4, 7, 3, 6, "#3b82f6"], [8, 8, 2, 5, "#f59e0b"], [11, 6, 3, 7, "#10b981"], [15, 9, 4, 4, "#f8fafc"],
        [2, 0, 8, 3, "#15803d"], [4, 3, 4, 2, "#22c55e"],
        [49, 8, 10, 12, "#78350f"], [50, 9, 8, 10, "#fef3c7"], [52, 11, 4, 4, "#60a5fa"],
      ];
    case "jendelaBata":
      return [
        [0, 0, 64, 40, "#e6d5c8"], [0, 30, 64, 10, "#d4bfa8"],
        [3, 4, 17, 21, "#475569"], [4, 5, 15, 19, "#93c5fd"], [6, 8, 6, 2, PUTIH], [7, 7, 4, 1, PUTIH],
        [11, 5, 1, 19, "#475569"], [4, 14, 15, 1, "#475569"],
        [48, 6, 12, 14, GARIS], [49, 7, 10, 12, "#1d4ed8"], [51, 10, 6, 2, LIME], [51, 14, 4, 2, PUTIH],
      ];
    case "kamarGelap":
      return [
        [0, 0, 64, 40, "#1e2433"], [0, 30, 64, 10, "#141926"],
        [4, 5, 14, 16, "#334155"], [5, 6, 12, 14, GARIS], [10, 7, 2, 2, "#fef08a"],
        [51, 14, 7, 5, "#f59e0b"], [52, 15, 5, 3, "#fef08a"], [54, 19, 1, 10, "#64748b"], [51, 29, 7, 2, "#475569"],
        [0, 29, 64, 1, "#3b82f6"],
      ];
    case "rakKrem":
      return [
        [0, 0, 64, 40, "#f5efe6"], [0, 3, 64, 1, "#cbd5e1"],
        [2, 16, 16, 2, "#b45309"], [4, 11, 3, 5, "#6366f1"], [8, 12, 2, 4, "#ec4899"], [11, 10, 3, 6, "#0ea5e9"],
        [47, 15, 14, 2, "#b45309"], [49, 10, 4, 5, "#10b981"], [54, 11, 3, 4, "#f59e0b"],
      ];
    case "mejaPastel":
      return [
        [0, 0, 64, 40, "#e0eaf5"], [0, 31, 64, 9, "#cbd5e1"],
        [6, 7, 9, 9, "#1e293b"], [7, 8, 7, 7, PUTIH], [10, 9, 1, 3, GARIS], [10, 11, 3, 1, "#1d4ed8"],
        [47, 7, 13, 12, "#b45309"], [48, 8, 11, 10, "#d97706"], [49, 9, 4, 4, "#fef08a"], [54, 11, 4, 4, LIME],
      ];
    case "jendelaNyaman":
      return [
        [0, 0, 64, 40, "#ede7dd"],
        [46, 4, 15, 22, "#78350f"], [47, 5, 13, 20, "#bae6fd"], [49, 8, 4, 2, PUTIH], [53, 5, 1, 20, "#78350f"], [47, 15, 13, 1, "#78350f"],
        [6, 23, 6, 5, "#c2410c"], [8, 17, 2, 6, "#16a34a"], [6, 19, 2, 2, "#16a34a"], [10, 18, 2, 2, "#16a34a"], [3, 28, 14, 2, "#92400e"],
      ];
  }
}

/** Kelap-kelip lampu kecil di beberapa ruangan (dipisah supaya bisa dianimasikan). */
function kelipRuang(ruang: Ruang): Kotak[] {
  if (ruang === "rakKrem") return [[6, 4, 2, 2, "#fde047"], [18, 4, 2, 2, "#fde047"], [46, 4, 2, 2, "#fde047"], [56, 4, 2, 2, "#fde047"]];
  if (ruang === "kamarGelap") return [[7, 8, 1, 1, "#fef08a"], [13, 11, 1, 1, LIME]];
  return [];
}

export type Karakter = {
  ruang: Ruang;
  kulit: string;
  bayangan: string;
  rambut: string;
  gaya: GayaRambut;
  baju: string;
  bajuAlt: string;
  kacamata?: boolean;
  earbuds?: boolean;
};

const BAYANG_HIJAB = "#cbd5e1";

function rambut(k: Karakter): { belakang: Kotak[]; depan: Kotak[] } {
  const r = k.rambut;
  switch (k.gaya) {
    case "panjang":
      return {
        belakang: [[23, 11, 18, 22, r], [22, 15, 20, 16, r]],
        depan: [[25, 9, 14, 4, r], [24, 11, 3, 5, r], [37, 11, 3, 5, r], [27, 10, 6, 1, "#4a332d"]],
      };
    case "hijab":
      return {
        belakang: [[23, 10, 18, 21, GARIS], [24, 11, 16, 20, r], [22, 26, 20, 12, r], [24, 27, 16, 4, BAYANG_HIJAB]],
        depan: [[25, 11, 14, 3, r], [25, 13, 14, 1, BAYANG_HIJAB]],
      };
    case "bob":
      return {
        belakang: [[23, 11, 18, 16, r], [22, 14, 20, 11, r]],
        depan: [[25, 9, 14, 4, r], [24, 11, 2, 5, r], [38, 11, 2, 5, r], [36, 12, 3, 1, LIME]],
      };
    case "keriting":
      return {
        belakang: [],
        depan: [[24, 8, 16, 5, r], [23, 10, 18, 4, r], [26, 7, 4, 2, r], [32, 7, 5, 2, r]],
      };
    case "rapi":
      return {
        belakang: [[23, 11, 18, 18, r]],
        depan: [[25, 9, 14, 4, r], [24, 11, 2, 4, r], [38, 11, 2, 4, r]],
      };
    default:
      return {
        belakang: [],
        depan: [[25, 9, 14, 4, r], [24, 11, 16, 2, r], [26, 10, 5, 1, "#3f3f46"]],
      };
  }
}

/**
 * Kamera peserta. `bicara` menggerakkan mulut dan kepala, `angguk` membuat kepala mengangguk setuju,
 * `tangan` mengangkat tangan ke kamera. Mata berkedip dan badan bernapas otomatis.
 */
export function KameraPiksel({
  k,
  bicara,
  angguk,
  tangan,
  jeda = 0,
}: {
  k: Karakter;
  bicara?: boolean;
  angguk?: boolean;
  tangan?: boolean;
  jeda?: number;
}) {
  const { belakang, depan } = rambut(k);
  const tunda = { animationDelay: `${-jeda * 1.17}s` };
  return (
    <svg
      viewBox="8 1 48 36"
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden
      className={cx("block size-full", bicara && "px-bicara", angguk && "px-setuju")}
    >
      <P kotak={RUANG(k.ruang)} />
      <g className="px-kelip">
        <P kotak={kelipRuang(k.ruang)} />
      </g>
      <g className="px-napas" style={tunda}>
        <P
          kotak={[
            [19, 29, 26, 11, GARIS], [20, 30, 24, 10, k.baju],
            [18, 32, 2, 8, GARIS], [44, 32, 2, 8, GARIS], [19, 32, 2, 8, k.baju], [43, 32, 2, 8, k.baju],
            [28, 30, 8, 3, k.bajuAlt], [30, 33, 4, 2, k.bajuAlt],
            [29, 25, 6, 5, k.kulit], [29, 25, 6, 2, k.bayangan],
          ]}
        />
        <g className="px-kepala" style={tunda}>
          <P
            kotak={[
              ...belakang,
              ...(k.gaya !== "hijab" ? ([[24, 17, 2, 4, k.kulit], [38, 17, 2, 4, k.kulit]] as Kotak[]) : []),
              [25, 12, 14, 14, GARIS], [26, 13, 12, 12, k.kulit],
              [27, 20, 2, 1, "#fda4af"], [35, 20, 2, 1, "#fda4af"],
            ]}
          />
          <g className="px-mata-buka" style={tunda}>
            <g className="px-lirik" style={tunda}>
              <P kotak={[[28, 17, 2, 2, MATA], [28, 17, 1, 1, PUTIH], [34, 17, 2, 2, MATA], [34, 17, 1, 1, PUTIH]]} />
            </g>
          </g>
          <g className="px-mata-tutup" style={tunda}>
            <P kotak={[[28, 18, 2, 1, MATA], [34, 18, 2, 1, MATA]]} />
          </g>
          <g className="px-mata-senang">
            <P kotak={[[27, 18, 1, 1, MATA], [28, 17, 2, 1, MATA], [30, 18, 1, 1, MATA], [33, 18, 1, 1, MATA], [34, 17, 2, 1, MATA], [36, 18, 1, 1, MATA]]} />
          </g>
          <g className="px-mulut-diam">
            <P kotak={[[30, 22, 4, 1, "#9f3a38"]]} />
          </g>
          <g className="px-mulut-buka">
            <P kotak={[[30, 21, 4, 2, "#9f3a38"], [31, 22, 2, 1, "#fda4af"]]} />
          </g>
          <P
            kotak={[
              ...depan,
              ...(k.kacamata
                ? ([
                    [26, 16, 5, 1, "#1e293b"], [26, 19, 5, 1, "#1e293b"], [26, 16, 1, 4, "#1e293b"], [30, 16, 1, 4, "#1e293b"],
                    [33, 16, 5, 1, "#1e293b"], [33, 19, 5, 1, "#1e293b"], [33, 16, 1, 4, "#1e293b"], [37, 16, 1, 4, "#1e293b"],
                    [31, 17, 2, 1, "#1e293b"],
                  ] as Kotak[])
                : []),
              ...(k.earbuds ? ([[24, 21, 1, 7, "#f1f5f9"], [39, 21, 1, 7, "#f1f5f9"]] as Kotak[]) : []),
            ]}
          />
        </g>
        {tangan ? (
          <g className="px-lambai">
            <P
              kotak={[
                [44, 22, 5, 9, GARIS], [45, 26, 3, 5, k.baju], [44, 20, 5, 6, GARIS], [45, 21, 3, 5, k.kulit],
                [43, 23, 2, 2, k.kulit], [45, 19, 1, 2, k.kulit], [47, 19, 1, 2, k.kulit],
              ]}
            />
          </g>
        ) : null}
        <g className="px-catat" style={tunda}>
          <P kotak={[[21, 37, 4, 3, k.kulit], [39, 37, 4, 3, k.kulit]]} />
        </g>
      </g>
    </svg>
  );
}

/** Kamera Kiko: kepala monitor dengan wajah lime, antena, telinga biru, dasi Kodie, dan lengan yang bergerak saat menjelaskan. */
export function KameraKikoPiksel({ bicara, mood = "senyum" }: { bicara?: boolean; mood?: "senyum" | "senang" | "penasaran" }) {
  return (
    <svg
      viewBox="0 0 64 40"
      preserveAspectRatio="xMidYMin slice"
      shapeRendering="crispEdges"
      aria-hidden
      className={cx("block size-full", bicara && "px-bicara")}
    >
      <P
        kotak={[
          [0, 0, 64, 40, "#0f1d3a"], [0, 30, 64, 10, "#172554"], [0, 29, 64, 1, "#1e3a8a"],
          [2, 5, 14, 25, "#1e293b"], [3, 6, 12, 23, GARIS], [3, 13, 12, 1, "#334155"], [3, 21, 12, 1, "#334155"],
          [4, 8, 2, 5, "#3b82f6"], [7, 9, 2, 4, LIME], [10, 8, 3, 5, "#93c5fd"], [4, 16, 3, 5, "#60a5fa"], [8, 17, 2, 4, "#f8fafc"], [11, 16, 2, 5, LIME],
          [48, 6, 13, 8, "#0b1120"], [49, 7, 11, 6, "#1e293b"],
          [52, 24, 6, 5, "#b45309"], [51, 23, 8, 1, "#d97706"], [52, 19, 6, 4, "#10b981"], [53, 17, 4, 2, "#34d399"], [54, 18, 1, 1, LIME],
        ]}
      />
      <g className="px-kelip">
        <P kotak={[[51, 9, 1, 2, LIME], [52, 8, 1, 1, LIME], [52, 11, 1, 1, LIME], [54, 9, 1, 2, PUTIH], [57, 9, 1, 2, LIME], [56, 8, 1, 1, LIME], [56, 11, 1, 1, LIME]]} />
      </g>
      <g className="px-napas">
        <g className="px-lengan-kiri">
          <P kotak={[[17, 30, 4, 7, GARIS], [18, 31, 3, 5, "#64748b"], [17, 35, 4, 3, PUTIH], [17, 34, 4, 1, LIME]]} />
        </g>
        <g className="px-lengan-kanan">
          <P kotak={[[43, 27, 4, 8, GARIS], [43, 28, 3, 6, "#64748b"], [43, 25, 4, 3, PUTIH], [43, 28, 4, 1, LIME]]} />
        </g>
        <P
          kotak={[
            [21, 28, 22, 12, GARIS], [22, 29, 20, 11, "#f8fafc"], [22, 29, 2, 11, "#e2e8f0"], [40, 29, 2, 11, "#e2e8f0"],
            [29, 25, 6, 4, "#64748b"],
            [27, 29, 3, 2, "#bfdbfe"], [34, 29, 3, 2, "#bfdbfe"], [31, 29, 2, 7, "#1d4ed8"], [30, 34, 4, 2, "#1d4ed8"], [31, 36, 2, 1, "#1d4ed8"],
            [36, 33, 5, 3, "#dbeafe"], [37, 34, 1, 1, "#1d4ed8"], [39, 34, 1, 1, GARIS],
          ]}
        />
        <g className="px-kepala">
          <P kotak={[[31, 4, 2, 3, "#64748b"], [30, 2, 4, 2, GARIS]]} />
          <g className="px-kelip">
            <P kotak={[[31, 2, 2, 2, LIME]]} />
          </g>
          <P
            kotak={[
              [16, 13, 3, 6, GARIS], [17, 14, 2, 4, "#2563eb"], [45, 13, 3, 6, GARIS], [45, 14, 2, 4, "#2563eb"],
              [19, 7, 26, 18, GARIS], [20, 8, 24, 16, "#f8fafc"], [20, 23, 24, 1, "#cbd5e1"],
              [22, 10, 20, 12, GARIS], [23, 11, 1, 1, "#334155"], [40, 11, 1, 1, "#334155"], [42, 22, 1, 1, LIME],
            ]}
          />
          {mood === "senang" ? (
            <>
              <P kotak={[[25, 15, 1, 1, LIME], [26, 14, 2, 1, LIME], [28, 15, 1, 1, LIME], [35, 15, 1, 1, LIME], [36, 14, 2, 1, LIME], [38, 15, 1, 1, LIME]]} />
              <g className="px-mulut-diam">
                <P kotak={[[28, 18, 8, 1, LIME], [29, 19, 6, 2, LIME]]} />
              </g>
            </>
          ) : (
            <>
              <g className="px-mata-buka">
                <g className="px-lirik">
                  <P
                    kotak={
                      mood === "penasaran"
                        ? [[26, 15, 2, 2, LIME], [36, 13, 2, 3, LIME], [35, 12, 4, 1, "#93c5fd"]]
                        : [[26, 14, 2, 2, LIME], [36, 14, 2, 2, LIME]]
                    }
                  />
                </g>
              </g>
              <g className="px-mata-tutup">
                <P kotak={[[25, 15, 4, 1, LIME], [35, 15, 4, 1, LIME]]} />
              </g>
              <g className="px-mulut-diam">
                <P
                  kotak={
                    mood === "penasaran"
                      ? [[30, 19, 4, 1, LIME], [34, 18, 1, 1, LIME]]
                      : [[28, 18, 1, 1, LIME], [29, 19, 6, 1, LIME], [35, 18, 1, 1, LIME]]
                  }
                />
              </g>
            </>
          )}
          <g className="px-mulut-buka">
            <P kotak={[[29, 18, 6, 2, LIME], [30, 20, 4, 1, LIME]]} />
          </g>
        </g>
      </g>
    </svg>
  );
}
