import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CheckCircle2, Clock, Ticket } from "lucide-react";
import { ambilPenghasilanPengajar, ambilProfilLengkapPengajar } from "@/lib/api/mengajar";
import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilKodeReferralSaya, ambilPerkiraanBagiHasil } from "@/lib/api/pengajar-lanjutan";
import { fiturLanjutan } from "@/lib/api/sumber";
import { PERSEN_BAGI_HASIL, PERSEN_BONUS_REFERRAL } from "@/lib/referral";
import { KartuKodeReferral } from "@/components/mengajar/profil-publik";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { TagProgram } from "@/components/kategori";
import { Catatan, Kartu, Lencana, StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Penghasilan" };

export default async function HalamanPenghasilan() {
  const [{ bulanIni, belumDibayar, daftar }, pengguna, kode, perkiraan, profilPengajar] = await Promise.all([
    ambilPenghasilanPengajar(),
    ambilPenggunaSaya(),
    fiturLanjutan ? ambilKodeReferralSaya() : Promise.resolve(null),
    fiturLanjutan ? ambilPerkiraanBagiHasil() : Promise.resolve([]),
    fiturLanjutan ? ambilProfilLengkapPengajar() : Promise.resolve(null),
  ]);

  return (
    <div className="flex max-w-[920px] flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-48 md:leading-[50px]">Penghasilan</h1>
        <p className="mt-2 text-text-muted">Ringkasan honor per sesi yang sudah Anda laporkan{fiturLanjutan ? ", perkiraan kelas aktif, dan kode referral Anda" : ""}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Kartu className="bg-primary-subtle">
          <p className="text-sm font-bold text-primary">Total honor bulan berjalan</p>
          <p className="mt-2 font-display text-32 font-extrabold leading-[38px]">{formatRupiah(bulanIni)}</p>
        </Kartu>
        <Kartu>
          <p className="text-sm font-bold text-text-muted">Total belum dibayar</p>
          <p className="mt-2 font-display text-32 font-extrabold leading-[38px]">{formatRupiah(belumDibayar)}</p>
        </Kartu>
      </div>

      {fiturLanjutan ? (
        <Catatan nada="info" judul="Cara honor dihitung">
          <p>
            Honor Anda adalah <strong>{PERSEN_BAGI_HASIL}% dari pembayaran setiap siswa terkonfirmasi</strong> di kelas, dibagi
            rata ke 4 sesi. Siswa yang memesan dengan kode referral Anda dihitung{" "}
            <strong>{PERSEN_BAGI_HASIL + PERSEN_BONUS_REFERRAL}%</strong>. Kelas tetap berjalan walau kursi belum penuh; makin
            banyak siswa, makin besar honor. Siswa trial gratis tidak menambah honor.
          </p>
          <p className="mt-2">
            Honor tercatat saat Anda mengirim laporan sesi. Sesi tanpa laporan tidak menghasilkan honor. Admin mentransfer
            honor ke rekening Anda di luar sistem lalu menandainya sebagai dibayar.
          </p>
        </Catatan>
      ) : (
        <Catatan nada="info" judul="Cara pencairan honor">
          <p>
            Honor otomatis tercatat segera setelah Anda mengirim laporan sesi. Sesi tanpa laporan tidak menghasilkan honor.
            Admin mentransfer honor ke rekening Anda di luar sistem lalu menandainya sebagai dibayar.
          </p>
        </Catatan>
      )}

      {fiturLanjutan && pengguna ? (
        <KartuKodeReferral
          kode={kode}
          pengajarId={pengguna.id}
          slug={profilPengajar?.profil?.slug}
          nama={pengguna.nama}
          terverifikasi={pengguna.status === "terverifikasi"}
        />
      ) : null}

      {perkiraan.length > 0 ? (
        <section aria-labelledby="judul-perkiraan" className="flex flex-col gap-3">
          <h2 id="judul-perkiraan" className="text-xl font-semibold">
            Perkiraan honor kelas aktif
          </h2>
          <p className="text-sm text-text-muted">
            Dihitung dari kursi yang sudah terisi saat ini. Angka final mengikuti siswa yang terkonfirmasi saat laporan dikirim.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {perkiraan.map((k) => (
              <li key={k.kelasId}>
                <Kartu kecil className="flex h-full flex-col gap-2">
                  <TagProgram slug={k.programSlug}>{k.programNama}</TagProgram>
                  <Link href={`/mengajar/kelas/${k.kelasId}`} className="font-display font-semibold hover:text-primary hover:underline">
                    {k.programNama} Level {k.level}
                  </Link>
                  <p className="text-sm text-text-muted">
                    {k.jumlahSiswa} siswa
                    {k.siswaReferral > 0 ? (
                      <>
                        {" "}
                        · <Ticket aria-hidden className="inline size-3.5" /> {k.siswaReferral} lewat referral Anda
                      </>
                    ) : null}
                  </p>
                  <p className="mt-auto font-display text-xl font-bold tabular-nums">
                    {formatRupiah(k.honorPerSesi)} <span className="text-sm font-semibold text-text-muted">/ sesi</span>
                  </p>
                  <p className="text-sm text-text-muted">± {formatRupiah(k.honorPerSesi * k.jumlahSesi)} untuk {k.jumlahSesi} sesi</p>
                </Kartu>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {daftar.length === 0 ? (
        <StateKosong
          judul="Belum ada honor tercatat"
          keterangan="Honor per sesi akan muncul di sini setelah Anda selesai mengajar dan mengirim laporan sesi."
        />
      ) : (
        <section aria-labelledby="judul-riwayat-honor" className="flex flex-col gap-4">
          <h2 id="judul-riwayat-honor" className="text-xl font-semibold">
            Riwayat honor per sesi ({daftar.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {daftar.map((item) => {
              const dibayar = item.honor.status === "dibayar";
              return (
                <li key={item.honor.id}>
                  <Kartu kecil className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TagProgram slug={item.programSlug}>{item.programNama}</TagProgram>
                        <Lencana nada={dibayar ? "sukses" : "peringatan"}>
                          {dibayar ? (
                            <CheckCircle2 aria-hidden className="size-3.5" />
                          ) : (
                            <Clock aria-hidden className="size-3.5" />
                          )}
                          {dibayar ? "Dibayar" : "Belum dibayar"}
                        </Lencana>
                      </div>
                      <Link
                        href={`/mengajar/kelas/${item.kelasId}`}
                        className="mt-1 font-display text-lg font-semibold hover:text-primary hover:underline"
                      >
                        {item.programNama} Level {item.level} · Sesi {item.nomorSesi}
                      </Link>
                      <p className="text-sm text-text-muted">
                        Sesi: {formatTanggal(item.mulaiPada)}
                        {dibayar && item.honor.dibayar_pada
                          ? ` · Dibayar ${formatTanggal(item.honor.dibayar_pada).split(", ")[1]}`
                          : ""}
                      </p>
                    </div>
                    <p className="flex items-center gap-2 font-display text-xl font-bold tabular-nums">
                      <Banknote aria-hidden className="size-5 text-primary" />
                      {formatRupiah(item.honor.jumlah)}
                    </p>
                  </Kartu>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
