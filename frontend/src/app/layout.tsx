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
 * agar tidak berkedip ke tema sistem saat dimuat. Tanpa pilihan, CSS mengikuti prefers-color-scheme.
 */
const SKRIP_TEMA = `try{var t=localStorage.getItem("kodie:tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

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
          className="sr-only z-50 rounded-full bg-primary px-5 py-3 font-display font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Lewati ke konten utama
        </a>
        <PenyediaGerak>{children}</PenyediaGerak>
      </body>
    </html>
  );
}
