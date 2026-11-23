import { Suspense, type ReactNode } from "react";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { DASHBOARD, NAMA_PERAN } from "@/lib/peran";
import { TombolTautan } from "@/components/ui/tombol";
import { Header } from "./header";
import { Footer } from "./footer";
import { MenuAkun, MenuAkunPonsel } from "./menu-akun";

function TombolTamu({ ponsel }: { ponsel?: boolean }) {
  return (
    <div className={ponsel ? "grid grid-cols-2 gap-3" : "flex items-center gap-3"}>
      <TombolTautan href="/masuk" varian="kedua">
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
  return ponsel ? <MenuAkunPonsel {...props} /> : <MenuAkun {...props} />;
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
      />
      <main id="konten" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      {ruangBawah ? <div aria-hidden className="h-16 lg:hidden" /> : null}
    </>
  );
}
