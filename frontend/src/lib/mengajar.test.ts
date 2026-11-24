import { describe, expect, it } from "vitest";
import {
  batasKapasitas,
  bisaBukaPlaybook,
  bisaGeserSesi,
  bisaIsiLaporan,
  bisaMasukKelas,
  buatJadwal4Sesi,
  cekBentrokJadwal,
  laporanTerkunci,
  perluPengingatLaporan,
  perluRaporJurusan,
  ringkasHonor,
  uraiKontenPlaybook,
} from "./mengajar";
import { buatSkemaLaporan, cekDokumenPengajar, cekFotoPengajar } from "./validasi/mengajar";

describe("aturan waktu & kapasitas pengajar", () => {
  it("batas kapasitas 10 untuk SD dan 15 untuk SMP/SMA", () => {
    expect(batasKapasitas(["SD"])).toBe(10);
    expect(batasKapasitas(["SMP", "SMA"])).toBe(15);
  });

  it("membuat 4 jadwal mingguan UTC dari input WIB", () => {
    const sesi = buatJadwal4Sesi("2026-12-01", "19:00", 60);
    expect(sesi).toHaveLength(4);
    expect(sesi[0]).toEqual({
      nomor: 1,
      mulai_pada: "2026-12-01T12:00:00.000Z",
      selesai_pada: "2026-12-01T13:00:00.000Z",
    });
    expect(sesi[1].mulai_pada).toBe("2026-12-08T12:00:00.000Z");
  });

  it("mendeteksi bentrok jadwal dan mengabaikan sesi dibatalkan atau diri sendiri", () => {
    const kandidat = [{ mulai_pada: "2026-12-01T12:00:00.000Z", selesai_pada: "2026-12-01T13:30:00.000Z" }];
    const sesiAda = [
      { id: "s1", mulai_pada: "2026-12-01T13:00:00.000Z", selesai_pada: "2026-12-01T14:00:00.000Z", status: "terjadwal" as const },
      { id: "s2", mulai_pada: "2026-12-01T12:00:00.000Z", selesai_pada: "2026-12-01T13:00:00.000Z", status: "dibatalkan" as const },
    ];
    expect(cekBentrokJadwal(kandidat, sesiAda)).toBe(true);
    expect(cekBentrokJadwal(kandidat, sesiAda, "s1")).toBe(false);
    expect(
      cekBentrokJadwal(
        [{ mulai_pada: "2026-12-01T14:00:00.000Z", selesai_pada: "2026-12-01T15:00:00.000Z" }],
        sesiAda,
      ),
    ).toBe(false);
  });

  it("mengecek jendela H-1 playbook dan geser sesi", () => {
    const mulai = "2026-12-02T12:00:00.000Z";
    expect(bisaBukaPlaybook(mulai, new Date("2026-12-01T11:59:00.000Z"))).toBe(false);
    expect(bisaBukaPlaybook(mulai, new Date("2026-12-01T12:00:00.000Z"))).toBe(true);

    expect(bisaGeserSesi(mulai, "terjadwal", new Date("2026-12-01T12:00:00.000Z"))).toBe(true);
    expect(bisaGeserSesi(mulai, "terjadwal", new Date("2026-12-01T12:01:00.000Z"))).toBe(false);
    expect(bisaGeserSesi(mulai, "selesai", new Date("2026-11-30T12:00:00.000Z"))).toBe(false);
  });

  it("mengecek jendela masuk kelas (15 menit sebelum sampai selesai)", () => {
    const mulai = "2026-12-01T12:00:00.000Z";
    const selesai = "2026-12-01T13:00:00.000Z";
    expect(bisaMasukKelas(mulai, selesai, "terjadwal", new Date("2026-12-01T11:44:00.000Z"))).toBe(false);
    expect(bisaMasukKelas(mulai, selesai, "terjadwal", new Date("2026-12-01T11:45:00.000Z"))).toBe(true);
    expect(bisaMasukKelas(mulai, selesai, "terjadwal", new Date("2026-12-01T13:00:00.000Z"))).toBe(true);
    expect(bisaMasukKelas(mulai, selesai, "terjadwal", new Date("2026-12-01T13:01:00.000Z"))).toBe(false);
    expect(bisaMasukKelas(mulai, selesai, "dibatalkan", new Date("2026-12-01T12:00:00.000Z"))).toBe(false);
  });

  it("mengecek waktu isi laporan, kunci 24 jam, pengingat 2 jam, dan rapor sesi ke-4", () => {
    expect(bisaIsiLaporan("2026-12-01T12:00:00.000Z", new Date("2026-12-01T11:59:00.000Z"))).toBe(false);
    expect(bisaIsiLaporan("2026-12-01T12:00:00.000Z", new Date("2026-12-01T12:00:00.000Z"))).toBe(true);

    expect(laporanTerkunci("2026-12-01T13:00:00.000Z", new Date("2026-12-02T13:00:00.000Z"))).toBe(false);
    expect(laporanTerkunci("2026-12-01T13:00:00.000Z", new Date("2026-12-02T13:01:00.000Z"))).toBe(true);

    expect(perluPengingatLaporan("2026-12-01T13:00:00.000Z", "terjadwal", false, new Date("2026-12-01T14:59:00.000Z"))).toBe(false);
    expect(perluPengingatLaporan("2026-12-01T13:00:00.000Z", "terjadwal", false, new Date("2026-12-01T15:00:00.000Z"))).toBe(true);
    expect(perluPengingatLaporan("2026-12-01T13:00:00.000Z", "selesai", true, new Date("2026-12-01T16:00:00.000Z"))).toBe(false);

    expect(perluRaporJurusan("simulasi-jurusan-it", 4)).toBe(true);
    expect(perluRaporJurusan("simulasi-jurusan-it", 3)).toBe(false);
    expect(perluRaporJurusan("coding-dasar", 4)).toBe(false);
  });

  it("menghitung total honor bulan berjalan WIB dan total belum dibayar", () => {
    const sekarang = new Date("2026-11-23T12:00:00Z"); // Nov 2026 WIB
    const hasil = ringkasHonor(
      [
        { jumlah: 50_000, status: "dibayar", waktu: "2026-11-10T12:00:00Z" },
        { jumlah: 75_000, status: "belum_dibayar", waktu: "2026-11-20T12:00:00Z" },
        { jumlah: 65_000, status: "belum_dibayar", waktu: "2026-10-31T16:00:00Z" }, // 31 Okt 23:00 WIB
      ],
      sekarang,
    );
    expect(hasil).toEqual({ bulanIni: 125_000, belumDibayar: 140_000 });
  });
});

describe("validasi file & form pengajar", () => {
  it("memvalidasi foto (JPG/PNG <= 1 MB) dan dokumen (JPG/PNG/PDF <= 2 MB)", () => {
    expect(cekFotoPengajar({ name: "foto.jpg", size: 800_000, type: "image/jpeg" })).toBeNull();
    expect(cekFotoPengajar({ name: "foto.pdf", size: 100_000, type: "application/pdf" })).toContain("JPG atau PNG");
    expect(cekFotoPengajar({ name: "foto.png", size: 1_100_000, type: "image/png" })).toContain("1 MB");

    expect(cekDokumenPengajar({ name: "ktp.pdf", size: 1_500_000, type: "application/pdf" })).toBeNull();
    expect(cekDokumenPengajar({ name: "skck.png", size: 2_200_000, type: "image/png" })).toContain("2 MB");
  });

  it("mewajibkan catatan bagi siswa hadir dan rapor pada sesi ke-4 Simulasi Jurusan IT", () => {
    const skemaBiasa = buatSkemaLaporan(false);
    expect(
      skemaBiasa.safeParse({
        ringkasan: "Belajar perulangan.",
        siswa: [{ siswa_id: "s1", hadir: true, catatan: "" }],
      }).success,
    ).toBe(false);
    expect(
      skemaBiasa.safeParse({
        ringkasan: "Belajar perulangan.",
        siswa: [{ siswa_id: "s1", hadir: false, catatan: "" }],
      }).success,
    ).toBe(true);

    const skemaRapor = buatSkemaLaporan(true);
    expect(
      skemaRapor.safeParse({
        ringkasan: "Sesi 4 integrasi AI.",
        siswa: [{ siswa_id: "s1", hadir: true, catatan: "Aktif berdiskusi." }],
        rapor: [],
      }).success,
    ).toBe(false);
    expect(
      skemaRapor.safeParse({
        ringkasan: "Sesi 4 integrasi AI.",
        siswa: [{ siswa_id: "s1", hadir: true, catatan: "Aktif berdiskusi." }],
        rapor: [
          {
            siswa_id: "s1",
            skor_software: 5,
            skor_jaringan: 3,
            skor_iot: 4,
            skor_ai_data: 4,
            bidang_rekomendasi: "software",
            alasan: "Menonjol dalam menyusun logika aplikasi.",
            saran: "Lanjut Kelas Reguler Teknologi.",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("mengurai markdown playbook terstruktur", () => {
    const terurai = uraiKontenPlaybook(`
## Tujuan sesi
Siswa bisa memakai blok ulangi.

## Alur sesi
- **00–10 · Pembukaan:** Sapa siswa.
- **10–40 · Praktik terpandu:** Bangun animasi kucing.

## Tantangan untuk siswa
Buat kucing mengeong.

## Kunci jawaban
Gabungkan blok ulangi dengan suara.

## Persiapan sebelum kelas
- Buka Scratch
- Cek daftar siswa

## Alat dan starter
- Scratch starter Kucing berjalan

## Catatan keamanan
Jangan minta nomor HP siswa.
`);
    expect(terurai.tujuan).toBe("Siswa bisa memakai blok ulangi.");
    expect(terurai.alur).toHaveLength(2);
    expect(terurai.alur[1]).toEqual({
      waktu: "10–40",
      judul: "Praktik terpandu",
      deskripsi: "Bangun animasi kucing.",
      utama: true,
    });
    expect(terurai.persiapan).toEqual(["Buka Scratch", "Cek daftar siswa"]);
    expect(terurai.catatanKeamanan).toBe("Jangan minta nomor HP siswa.");
  });

  it("mengurai tabel alur, checkbox persiapan, dan segmen tanpa pemisah", () => {
    const terurai = uraiKontenPlaybook(`
## Tujuan sesi
Setelah sesi ini, siswa bisa:
1. Memahami tag \`html\`.
2. Membuat halaman profil.

## Persiapan sebelum kelas
- [ ] Buka starter
- [x] Uji share screen
✓ Siapkan contoh

## Alur sesi (90 menit)
| Menit | Segmen | Kegiatan |
| --- | --- | --- |
| 00–12 | Pembukaan | Demo Inspect Element |
| 12-48 | Praktik terpandu | Menulis \`<h1>\` |

## Alur lain
- **48–72 Tantangan:** Membangun halaman.
`);
    expect(terurai.tujuanBaris).toEqual([
      { teks: "Setelah sesi ini, siswa bisa:", nomor: false },
      { teks: "Memahami tag \`html\`.", nomor: true },
      { teks: "Membuat halaman profil.", nomor: true },
    ]);
    expect(terurai.persiapan).toEqual(["Buka starter", "Uji share screen", "Siapkan contoh"]);
    expect(terurai.alur).toEqual([
      { waktu: "00–12", judul: "Pembukaan", deskripsi: "Demo Inspect Element", utama: false },
      { waktu: "12–48", judul: "Praktik terpandu", deskripsi: "Menulis \`<h1>\`", utama: true },
      { waktu: "48–72", judul: "Tantangan", deskripsi: "Membangun halaman.", utama: false },
    ]);
  });
});
