import { Suspense, type ReactNode } from "react";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilDaftarNotifikasi } from "@/lib/api/notifikasi";
import { DASHBOARD, NAMA_PERAN } from "@/lib/peran";
import { ChatbotSitus } from "@/components/chatbot/chatbot-situs";
import { TombolTautan } from "@/components/ui/tombol";
import { Header } from "./header";
import { Footer } from "./footer";
import { LoncengNotifikasi } from "./lonceng-notifikasi";
import { AnimasiElemen } from "./animasi-elemen";
import { MenuAkun, MenuAkunPonsel } from "./menu-akun";

function TombolTamu({ ponsel }: { ponsel?: boolean }) {
  return (
    <div className={ponsel ? "grid grid-cols-2 gap-3" : "flex items-center gap-3"}>
      {/* Saat header melayang, tombol Masuk ikut transparan seperti kaca header (bukan putih solid). */}
      <TombolTautan
        href="/masuk"
        varian="kedua"
        className={ponsel ? undefined : "transition-colors group-data-[mengambang]/hdr:border-border-strong/60 group-data-[mengambang]/hdr:bg-surface/35 group-data-[mengambang]/hdr:hover:bg-surface/70"}
      >
        Masuk
      </TombolTautan>
      <TombolTautan href="/daftar">Daftar</TombolTautan>
    </div>
  );
}

/** Membaca cookie sesi, jadi selalu dibungkus Suspense dengan tombol tamu sebagai fallback. */
async function Akun({ ponsel }: { ponsel?: boolean }) {
  const p = await ambilPenggunaSaya();
  if (!p) return <TombolTamu ponsel={ponsel} />;
  const props = { nama: p.nama, peranLabel: NAMA_PERAN[p.peran], dashboard: DASHBOARD[p.peran] };
  if (ponsel) return <MenuAkunPonsel {...props} />;
  const notif = await ambilDaftarNotifikasi();
  return (
    <>
      <LoncengNotifikasi penggunaId={p.id} awal={notif} pantau />
      <MenuAkun {...props} />
    </>
  );
}

/** Lonceng notifikasi di bar atas ponsel untuk pengguna login (Figma Header 9:563). */
async function LoncengHeaderPonsel() {
  const p = await ambilPenggunaSaya();
  if (!p) return null;
  const notif = await ambilDaftarNotifikasi();
  return (
    <div data-masuk="">
      <LoncengNotifikasi penggunaId={p.id} awal={notif} ponsel />
    </div>
  );
}

/** Header + main + footer untuk semua halaman. */
export function KerangkaSitus({ children, ruangBawah }: { children: ReactNode; ruangBawah?: boolean }) {
  return (
    <>
      <Header
        akun={
          <Suspense fallback={<TombolTamu />}>
            <Akun />
          </Suspense>
        }
        akunPonsel={
          <Suspense fallback={<TombolTamu ponsel />}>
            <Akun ponsel />
          </Suspense>
        }
        loncengPonsel={
          <Suspense fallback={null}>
            <LoncengHeaderPonsel />
          </Suspense>
        }
      />
      <main id="konten" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      <AnimasiElemen />
      <Suspense fallback={null}>
        <ChatbotSitus />
      </Suspense>
      {ruangBawah ? <div aria-hidden className="tanpa-cetak h-16 lg:hidden" /> : null}
    </>
  );
}
