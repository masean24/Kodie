import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ambilProfilLengkapPengajar } from "@/lib/api/mengajar";
import { tanggalBesokWib } from "@/lib/mengajar";
import { FormBukaKelas } from "@/components/mengajar/form-buka-kelas";
import { Catatan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Buka kelas baru" };

export default async function HalamanBukaKelas() {
  const profil = await ambilProfilLengkapPengajar();
  const disetujuiIds = new Set(profil.programDipilih.filter((x) => x.disetujui).map((x) => x.program_id));
  const programDisetujui = profil.semuaProgram.filter((p) => disetujuiIds.has(p.id));
  const terverifikasi = profil.pengguna.status === "terverifikasi";
  const besokWib = tanggalBesokWib(new Date());

  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <Link
        href="/mengajar/kelas"
        className="inline-flex min-h-touch items-center gap-2 self-start font-display font-semibold text-primary hover:underline"
      >
        <ArrowLeft data-kembali aria-hidden className="size-5" /> Semua kelas
      </Link>

      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[44px] md:leading-[50px]">Buka kelas baru</h1>
        <p className="mt-2 text-text-muted">
          Satu kelas terdiri dari 4 sesi mingguan pada hari dan jam yang sama. Link Google Meet dibuat otomatis untuk tiap sesi.
        </p>
      </div>

      {!terverifikasi ? (
        <Catatan nada="peringatan" judul="Akun belum terverifikasi">
          <p>Anda baru bisa membuka kelas setelah admin menyetujui verifikasi akun pengajar.</p>
          <TombolTautan href="/mengajar/profil" varian="kedua" className="mt-3">
            Cek status verifikasi
          </TombolTautan>
        </Catatan>
      ) : programDisetujui.length === 0 ? (
        <Catatan nada="peringatan" judul="Belum ada program yang disetujui">
          <p>Pilih program yang ingin Anda ajar di profil, lalu tunggu persetujuan admin.</p>
          <TombolTautan href="/mengajar/profil" varian="kedua" className="mt-3">
            Pilih program di profil
          </TombolTautan>
        </Catatan>
      ) : (
        <FormBukaKelas programDisetujui={programDisetujui} tanggalMin={besokWib} />
      )}
    </div>
  );
}
