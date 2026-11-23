"use server";

import { refresh } from "next/cache";
import type { KonfigurasiChatbot, PesanChat, StatusPercakapanChat } from "@/lib/chatbot";
import {
  adminAmbilAlihChat,
  adminSimpanPengaturanChatbot,
  ambilDaftarPercakapanChatAdmin,
  ambilDetailPercakapanChatAdmin,
  ambilRiwayatPercakapanPengguna,
  kirimPesanLiveChat,
  mintaBantuanAdminChat,
  selesaikanAtauKembaliKeBotChat,
  type DetailPercakapanAdmin,
  type DetailPercakapanChat,
  type ItemPercakapanAdmin,
} from "@/lib/api/chatbot";
import { programMock } from "@/lib/mock/data";
import { formatRupiah } from "@/lib/format";
import { pesanError } from "@/lib/errors";
import { skemaPengaturanChatbot } from "@/lib/validasi/admin";
import { pakaiMock } from "@/lib/api/sumber";

export type HasilChatbotAksi<T = undefined> = {
  ok?: true;
  data?: T;
  galat?: string;
  galatIsian?: Record<string, string>;
};

export async function aksiMuatPercakapanChat(percakapanId: string): Promise<DetailPercakapanChat | null> {
  try {
    return await ambilRiwayatPercakapanPengguna(percakapanId);
  } catch {
    return null;
  }
}

export async function aksiMintaBantuanAdmin(masukan: {
  percakapanId?: string | null;
  buatTiket?: boolean;
  ringkasanMasalah?: string;
}): Promise<HasilChatbotAksi<{ percakapan_id: string; status: StatusPercakapanChat; laporan_masalah_id: string | null }>> {
  try {
    const res = await mintaBantuanAdminChat(masukan);
    return { ok: true, data: res };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiKirimPesanLiveChat(
  percakapanId: string,
  isi: string,
): Promise<HasilChatbotAksi<PesanChat>> {
  try {
    const res = await kirimPesanLiveChat({ percakapanId, isi });
    return { ok: true, data: res };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiSelesaikanAtauKembaliKeKiko(
  percakapanId: string,
  kembaliKeBot: boolean,
): Promise<HasilChatbotAksi<{ percakapan_id: string; status: StatusPercakapanChat }>> {
  try {
    const res = await selesaikanAtauKembaliKeBotChat({ percakapanId, kembaliKeBot });
    refresh();
    return { ok: true, data: res };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

/** Fallback jawaban saat `NEXT_PUBLIC_USE_MOCK=true` sehingga mode demo offline tetap interaktif. */
export async function aksiBalasMockKiko(pesan: string, namaBot = "Kiko"): Promise<{
  isi: string;
  sitasi: { index: number; title: string; url: string; headingPath?: string }[];
  lowConfidence?: boolean;
}> {
  if (!pakaiMock) {
    return {
      isi: `Maaf, mode mock tidak aktif. Gunakan koneksi langsung ke server ${namaBot}.`,
      sitasi: [],
      lowConfidence: true,
    };
  }
  const q = pesan.toLowerCase();
  if (q.includes("coding dasar") || q.includes("sd")) {
    const p = programMock.find((x) => x.slug === "coding-dasar") ?? programMock[0];
    return {
      isi:
        `Untuk siswa SD (kelas ${p.kelas_min}–${p.kelas_maks}), kami merekomendasikan **${p.nama}** [1]. ` +
        `Paket terdiri dari **${p.jumlah_sesi} sesi** (durasi ${p.durasi_menit} menit/sesi) dengan biaya **${formatRupiah(p.harga_paket)}**.\n\n` +
        `Anda dapat melihat detail jadwal dan sisa kursi langsung di halaman katalog [2].`,
      sitasi: [
        { index: 1, title: p.nama, url: `/program/${p.slug}`, headingPath: "Ringkasan Program" },
        { index: 2, title: "Katalog Kelas Terbuka", url: "/kelas" },
      ],
    };
  }
  if (q.includes("simulasi") || q.includes("jurusan") || q.includes("sma") || q.includes("rapor")) {
    const p = programMock.find((x) => x.slug === "simulasi-jurusan-it") ?? programMock[2];
    return {
      isi:
        `**${p.nama}** dirancang untuk siswa SMA (kelas ${p.kelas_min}–${p.kelas_maks}) yang ingin merasakan proyek nyata di 4 bidang IT: Software, Jaringan, IoT, dan AI & Data [1].\n\n` +
        `Di akhir 4 sesi (${formatRupiah(p.harga_paket)}), pengajar menerbitkan **Rapor Rekomendasi Jurusan** berisi skor minat & kemampuan. Anda juga bisa mencoba Tes Minat gratis terlebih dahulu [2].`,
      sitasi: [
        { index: 1, title: p.nama, url: `/program/${p.slug}` },
        { index: 2, title: "Tes Minat Jurusan IT", url: "/tes-minat" },
      ],
    };
  }
  if (q.includes("bayar") || q.includes("meet") || q.includes("daftar") || q.includes("persetujuan")) {
    return {
      isi:
        `Berikut alur singkat di **Kodie** [1]:\n` +
        `- **Daftar**: Pilih peran Orang Tua atau Siswa (akun siswa memerlukan persetujuan orang tua lewat tautan email).\n` +
        `- **Booking & Bayar**: Pilih kelas di katalog, transfer/QRIS sesuai nominal tagihan, lalu unggah bukti bayar agar diverifikasi admin.\n` +
        `- **Masuk Kelas**: Tombol Google Meet aktif otomatis **15 menit** sebelum sesi dimulai di halaman sesi [1].`,
      sitasi: [{ index: 1, title: "Katalog Kelas & Jadwal", url: "/kelas" }],
    };
  }
  return {
    isi:
      `Hai! Aku **${namaBot}**, asisten Kodie. Aku dapat membantumu mengecek info program (**Coding Dasar**, **Kelas Reguler Teknologi**, **Simulasi Jurusan IT**), biaya paket, tes minat, hingga alur pembayaran.\n\n` +
      `Jika perlu berbicara langsung dengan tim kami, pilih opsi bantuan Admin di bawah ya!`,
    sitasi: [{ index: 1, title: "Semua Program Kodie", url: "/program" }],
    lowConfidence: true,
  };
}

// ---------------------------------------------------------------------------
// Server Actions Admin (/admin/chat dan /admin/pengaturan)
// ---------------------------------------------------------------------------

export async function aksiAdminAmbilDaftarChat(): Promise<ItemPercakapanAdmin[]> {
  return ambilDaftarPercakapanChatAdmin();
}

export async function aksiAdminAmbilDetailChat(percakapanId: string): Promise<DetailPercakapanAdmin | null> {
  return ambilDetailPercakapanChatAdmin(percakapanId);
}

export async function aksiAdminAmbilAlihChat(percakapanId: string): Promise<HasilChatbotAksi> {
  try {
    await adminAmbilAlihChat(percakapanId);
    refresh();
    return { ok: true };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiAdminKirimPesanChat(
  percakapanId: string,
  isi: string,
): Promise<HasilChatbotAksi<PesanChat>> {
  try {
    const res = await kirimPesanLiveChat({ percakapanId, isi });
    refresh();
    return { ok: true, data: res };
  } catch (e) {
    return { galat: pesanError(e) };
  }
}

export async function aksiAdminSelesaikanChat(
  percakapanId: string,
  kembaliKeBot: boolean,
): Promise<HasilChatbotAksi<{ percakapan_id: string; status: StatusPercakapanChat }>> {
  return aksiSelesaikanAtauKembaliKeKiko(percakapanId, kembaliKeBot);
}

export async function aksiAdminSimpanPengaturanChatbot(
  masukan: KonfigurasiChatbot,
): Promise<HasilChatbotAksi> {
  const cek = skemaPengaturanChatbot.safeParse(masukan);
  if (!cek.success) {
    const galatIsian: Record<string, string> = {};
    for (const i of cek.error.issues) {
      const k = String(i.path[0] ?? "");
      if (k) galatIsian[k] ??= i.message;
    }
    return { galatIsian };
  }
  try {
    await adminSimpanPengaturanChatbot(cek.data);
  } catch (e) {
    return { galat: pesanError(e) };
  }
  refresh();
  return { ok: true };
}
