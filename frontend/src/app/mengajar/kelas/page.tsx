import type { Metadata } from "next";
import { CalendarDays, Plus, Users } from "lucide-react";
import { ambilDaftarKelasPengajar, ambilProfilLengkapPengajar } from "@/lib/api/mengajar";
import { formatJamTeks, formatTanggal, namaHari } from "@/lib/format";
import { TagProgram } from "@/components/kategori";
import { Catatan, Kartu, Lencana, StateKosong } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";

export const metadata: Metadata = { title: "Kelas saya" };

const LABEL_STATUS_KELAS = {
  terbuka: { label: "Terbuka", nada: "info" as const },
  berjalan: { label: "Berjalan", nada: "sukses" as const },
  selesai: { label: "Selesai", nada: "netral" as const },
  disembunyikan: { label: "Disembunyikan", nada: "peringatan" as const },
};

export default async function HalamanKelasPengajar() {
  const [profil, daftar] = await Promise.all([ambilProfilLengkapPengajar(), ambilDaftarKelasPengajar()]);
  const punyaProgramDisetujui = profil.programDipilih.some((p) => p.disetujui);
  const bisaBuka = profil.pengguna.status === "terverifikasi" && punyaProgramDisetujui;

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">Kelas</h1>
          <p className="mt-2 text-text-muted">Kelola kelas, jadwal sesi, playbook, dan laporan mengajar.</p>
        </div>
        {bisaBuka ? (
          <TombolTautan href="/mengajar/kelas/baru">
            <Plus aria-hidden className="size-5" /> Buka kelas baru
          </TombolTautan>
        ) : null}
      </div>

      {!bisaBuka ? (
        <Catatan nada="peringatan" judul="Belum bisa membuka kelas baru">
          <p>
            {profil.pengguna.status !== "terverifikasi"
              ? "Akun pengajar harus berstatus terverifikasi admin terlebih dahulu."
              : "Pilih program di halaman profil dan tunggu admin menyetujuinya."}
          </p>
          <TombolTautan href="/mengajar/profil" varian="kedua" className="mt-3">
            Buka profil
          </TombolTautan>
        </Catatan>
      ) : null}

      {daftar.length === 0 ? (
        <StateKosong
          judul="Belum ada kelas"
          keterangan="Buka kelas pertama Anda untuk mulai menerima peserta."
          aksi={bisaBuka ? <TombolTautan href="/mengajar/kelas/baru">Buka kelas baru</TombolTautan> : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {daftar.map((k) => {
            const st = LABEL_STATUS_KELAS[k.status];
            const sesiPertama = k.sesi[0];
            const jumlahLaporan = Object.keys(k.laporanBySesi).length;
            const hari = sesiPertama
              ? ((new Date(new Date(sesiPertama.mulai_pada).getTime() + 7 * 3_600_000).getUTCDay() + 6) % 7) + 1
              : 1;
            return (
              <li key={k.id}>
                <Kartu className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TagProgram slug={k.program.slug}>{k.program.nama}</TagProgram>
                      <Lencana nada={st.nada}>{st.label}</Lencana>
                    </div>
                    <h2 className="text-xl font-semibold">
                      {k.program.nama} · Level {k.level}
                    </h2>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-muted">
                      {sesiPertama ? (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays aria-hidden className="size-4" />
                          Setiap {namaHari(hari)}, {formatJamTeks(k.jam_mulai)} WIB (mulai{" "}
                          {formatTanggal(sesiPertama.mulai_pada).split(", ")[1]})
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1.5">
                        <Users aria-hidden className="size-4" />
                        {k.siswa.length} dari {k.kapasitas} siswa · {jumlahLaporan}/{k.sesi.length} laporan
                      </span>
                    </div>
                  </div>
                  <TombolTautan href={`/mengajar/kelas/${k.id}`} varian="kedua" className="shrink-0">
                    Lihat sesi & peserta
                  </TombolTautan>
                </Kartu>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
