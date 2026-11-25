import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Lexend } from "next/font/google";
import { PenyediaGerak } from "@/components/ui/gerak";
import "./globals.css";

const lexend = Lexend({ variable: "--font-lexend", subsets: ["latin"], display: "swap" });
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Kodie · Bimbel coding dan teknologi SD sampai SMA", template: "%s · Kodie" },
  description:
    "Kelas daring kelompok kecil untuk siswa SD, SMP, dan SMA, diajar mahasiswa terverifikasi, dengan laporan untuk orang tua setiap sesi.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon_180.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Kodie · Bimbel coding dan teknologi SD sampai SMA",
    description:
      "Kelas daring kelompok kecil untuk siswa SD, SMP, dan SMA, diajar mahasiswa terverifikasi, dengan laporan untuk orang tua setiap sesi.",
    type: "website",
    locale: "id_ID",
    siteName: "Kodie",
    images: [{ url: "/og-kodie.png", width: 1200, height: 630, alt: "Kodie — From Hello World to Hello Future" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111c33" },
  ],
};

/**
 * Pasang tema pilihan pengguna (localStorage "kodie:tema", lihat ThemeSwitch) sebelum halaman dilukis,
 * agar tidak berkedip saat dimuat. Hanya ada Terang/Gelap; tanpa pilihan tersimpan, tema awal diambil sekali
 * dari preferensi sistem lalu dipasang eksplisit di `data-theme`. `data-sesi` dipasang bila ada penanda sesi
 * (`kodie_sesi` atau cookie auth Supabase), supaya header menampilkan kerangka akun, bukan tombol Masuk/Daftar.
 */
const SKRIP_TEMA = `try{var t=localStorage.getItem("kodie:tema");if(t!=="light"&&t!=="dark")t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t);if(document.cookie.split("; ").some(function(c){return c.indexOf("kodie_sesi=1")===0||(c.indexOf("sb-")===0&&c.indexOf("-auth-token")>0)}))document.documentElement.setAttribute("data-sesi","")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: atribut data-theme dipasang skrip di atas sebelum React hidrasi.
    <html lang="id" className={`${lexend.variable} ${atkinson.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="sr-only z-50 rounded-full bg-[#0f172a] px-5 py-3 font-display font-semibold text-white shadow-xl ring-4 ring-[#c6f64d] focus:not-sr-only focus:fixed focus:left-4 focus:top-[84px]"
        >
          Lewati ke konten utama
        </a>
        <PenyediaGerak>{children}</PenyediaGerak>
      </body>
    </html>
  );
}
