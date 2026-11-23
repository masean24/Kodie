import type { Peran } from "@/types/database";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilKelas } from "@/lib/api/kelas";
import { ambilProgram } from "@/lib/api/program";
import { ambilDaftarAnak, ambilSiswaSaya } from "@/lib/api/siswa";
import { alasanTidakBisaDipesan } from "@/lib/kelas";
import { alasanTidakCocok } from "@/lib/booking";
import { Catatan } from "@/components/ui/dasar";
import { TombolTautan } from "@/components/ui/tombol";
import { AlurPesan, type KandidatSiswa } from "./alur-pesan";

/** Isi halaman `/orang-tua/booking/baru` dan `/siswa/booking/baru`. Dirender di dalam Suspense layout area. */
export async function HalamanPesan({ peran, kelasId }: { peran: Extract<Peran, "orang_tua" | "siswa">; kelasId: string | null }) {
  const kelas = kelasId ? await ambilKelas(kelasId) : null;
  const kembali = (
    <TombolTautan href="/kelas" varian="kedua" className="mt-3">
      Lihat katalog kelas
    </TombolTautan>
  );

  if (!kelas) {
    return (
      <Catatan nada="peringatan" judul="Kelas tidak ditemukan">
        <p>Pilih kelas dari katalog, lalu tekan Pesan kelas.</p>
        {kembali}
      </Catatan>
    );
  }
  const tutup = alasanTidakBisaDipesan(kelas);
  if (tutup) {
    return (
      <Catatan nada="peringatan" judul={`${tutup}: kelas ini tidak bisa dipesan`}>
        <p>Cari jadwal lain di katalog.</p>
        {kembali}
      </Catatan>
    );
  }

  const program = await ambilProgram(kelas.program_slug);
  const cek = (s: { jenjang: string; kelas: number }) =>
    program ? alasanTidakCocok(s as { jenjang: "SD" | "SMP" | "SMA"; kelas: number }, program) : null;

  let kandidat: KandidatSiswa[];
  if (peran === "siswa") {
    const [p, s] = await Promise.all([ambilPenggunaSaya(), ambilSiswaSaya()]);
    if (p?.status !== "aktif") {
      return (
        <Catatan nada="peringatan" judul="Akunmu belum disetujui orang tua">
          <p>Booking kelas terbuka setelah orang tuamu menyetujui lewat link persetujuan.</p>
          <TombolTautan href="/siswa/persetujuan" className="mt-3">
            Kirim link persetujuan
          </TombolTautan>
        </Catatan>
      );
    }
    if (!s) {
      return (
        <Catatan nada="peringatan" judul="Data siswa belum lengkap">
          Hubungi admin Kodie.
        </Catatan>
      );
    }
    const alasan = cek(s);
    if (alasan) {
      return (
        <Catatan nada="peringatan" judul="Kelas ini tidak sesuai jenjangmu">
          <p>{alasan}</p>
          {kembali}
        </Catatan>
      );
    }
    kandidat = [{ id: s.id, nama: s.nama, jenjang: s.jenjang, kelas: s.kelas, alasan: null }];
  } else {
    const anak = await ambilDaftarAnak();
    if (anak.length === 0) {
      return (
        <Catatan nada="peringatan" judul="Belum ada profil anak">
          <p>Tambahkan profil anak dulu, lalu kembali ke kelas ini.</p>
          <TombolTautan href="/orang-tua/anak" className="mt-3">
            Tambah anak
          </TombolTautan>
        </Catatan>
      );
    }
    kandidat = anak.map((a) => ({ id: a.id, nama: a.nama, jenjang: a.jenjang, kelas: a.kelas, alasan: cek(a) }));
  }

  return (
    <div className="max-w-[720px]">
      <AlurPesan kelas={kelas} kandidat={kandidat} untukDiriSendiri={peran === "siswa"} />
    </div>
  );
}
