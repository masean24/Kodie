import type { Metadata } from "next";
import { Kartu, Kontainer } from "@/components/ui/dasar";

export const metadata: Metadata = {
  title: "Kebijakan privasi",
  description: "Data yang dikumpulkan Kodie, tujuan penggunaannya, dan persetujuan orang tua untuk siswa di bawah 18 tahun.",
  alternates: { canonical: "/kebijakan-privasi" },
};

const BAGIAN = [
  {
    judul: "Data yang kami kumpulkan",
    isi: [
      "Orang tua: nama lengkap, email, dan nomor WhatsApp.",
      "Siswa: nama lengkap, tanggal lahir, jenjang, kelas, dan nama sekolah (opsional). Siswa tidak diminta foto, alamat, atau nomor identitas.",
      "Pengajar: data diri, kampus atau status kerja, keahlian, foto profil, kartu identitas, dan SKCK untuk verifikasi.",
      "Data kegiatan belajar: pemesanan kelas, bukti bayar, kehadiran, laporan sesi, rapor, hasil tes minat, dan rating.",
    ],
  },
  {
    judul: "Tujuan pemakaian data",
    isi: [
      "Menjalankan kelas: menjadwalkan sesi, membuat link Google Meet, dan mengirim notifikasi di aplikasi.",
      "Memverifikasi pembayaran dan memverifikasi pengajar.",
      "Memberi laporan perkembangan belajar kepada siswa dan orang tua.",
      "Menjaga keamanan kelas, termasuk menindaklanjuti laporan masalah.",
    ],
  },
  {
    judul: "Persetujuan orang tua",
    isi: [
      "Siswa SMP dan SMA yang mendaftar sendiri baru aktif setelah orang tua menyetujui lewat link persetujuan, sesuai Pasal 25 UU Pelindungan Data Pribadi.",
      "Waktu persetujuan dan akun orang tua yang menyetujui disimpan sebagai bukti.",
      "Siswa SD tidak punya akun sendiri. Profilnya dibuat dan dikelola orang tua.",
    ],
  },
  {
    judul: "Siapa yang bisa melihat data",
    isi: [
      "Catatan pengajar tentang siswa hanya terlihat oleh siswa itu dan orang tuanya.",
      "Pengajar hanya melihat data siswa di kelas yang ia ajar.",
      "Dokumen pengajar dan bukti bayar disimpan privat dan hanya dibuka admin lewat tautan sementara.",
      "Profil publik hanya untuk pengajar yang sudah diverifikasi, tanpa dokumen pribadi.",
    ],
  },
  {
    judul: "Hak Anda",
    isi: [
      "Melihat dan memperbarui data di dashboard masing-masing.",
      "Meminta salinan atau penghapusan data dengan menghubungi kami. Data yang wajib disimpan untuk catatan pembayaran akan kami jelaskan saat permintaan diproses.",
      "Hasil tes minat tamu tidak disimpan di server.",
    ],
  },
  {
    judul: "Asisten AI Kiko",
    isi: [
      "Kiko adalah asisten berbasis AI yang menjawab pertanyaan seputar program, kelas, dan cara memakai situs Kodie.",
      "Jawaban Kiko dibuat otomatis dan bisa keliru. Untuk hal penting seperti pembayaran atau jadwal, cek halaman terkait atau minta bantuan admin.",
      "Pesan yang ditulis di chat dikirim ke layanan AI untuk dibuatkan jawaban. Jangan menulis data pribadi seperti nomor HP, alamat, password, atau data anak.",
      "Riwayat chat tamu disimpan sementara di browser perangkat ini dan terhapus saat menekan tombol mulai percakapan baru.",
      "Jika meminta bantuan admin lewat live chat, percakapan itu disimpan di sistem Kodie agar admin bisa membalas.",
    ],
  },
];

export default function HalamanPrivasi() {
  return (
    <Kontainer className="max-w-[864px] py-10 md:py-16">
      <h1 className="text-[28px] leading-[36px] font-extrabold tracking-tight sm:text-[36px] sm:leading-[46px] md:text-[42px] md:leading-[52px]">
        Kebijakan privasi
      </h1>
      <div className="mt-8 flex flex-col gap-6">
        {BAGIAN.map((b) => (
          <Kartu key={b.judul}>
            <h2 className="text-2xl font-bold">{b.judul}</h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
              {b.isi.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Kartu>
        ))}
        <Kartu>
          <h2 className="text-2xl font-bold">Kontak</h2>
          <p className="mt-3">
            Untuk pertanyaan atau permintaan penghapusan data, hubungi tim Kodie di{" "}
            <span className="font-bold">halo@contoh.id</span> (alamat contoh, akan diganti).
          </p>
        </Kartu>
      </div>
    </Kontainer>
  );
}
