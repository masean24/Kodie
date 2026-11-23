import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Lexend } from "next/font/google";
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
  title: { default: "Kodie · Bimbel coding dan teknologi SD sampai SMA", template: "%s · Kodie" },
  description:
    "Kelas daring kelompok kecil untuk siswa SD, SMP, dan SMA, diajar mahasiswa terverifikasi, dengan laporan untuk orang tua setiap sesi.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111c33" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${lexend.variable} ${atkinson.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="sr-only z-50 rounded-full bg-primary px-5 py-3 font-display font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
