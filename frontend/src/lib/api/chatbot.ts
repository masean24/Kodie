import { connection } from "next/server";
import type { Database, Pengguna } from "@/types/database";
import {
  KONFIGURASI_CHATBOT_DEFAULT,
  parseSitasi,
  urutkanPercakapanAdmin,
  type KonfigurasiChatbot,
  type PercakapanChat,
  type PesanChat,
  type StatusPercakapanChat,
} from "@/lib/chatbot";
import { storeMock } from "@/lib/mock/store";
import { clientPublik } from "@/lib/supabase/publik";
import { buatClientServer } from "@/lib/supabase/server";
import type { InputPengaturanChatbot } from "@/lib/validasi/admin";
import { ambilPenggunaSaya, daftarPenggunaMock } from "./auth";
import { lemparJikaError, pakaiMock } from "./sumber";

/** API & operasi server untuk AI Chatbot "Kiko" dan Live Admin Takeover. */

async function wajibMasuk(): Promise<Pengguna> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p) throw new Error("TIDAK_BERHAK");
  return p;
}

async function wajibAdmin(): Promise<Pengguna> {
  const p = await wajibMasuk();
  if (p.peran !== "admin") throw new Error("TIDAK_BERHAK");
  return p;
}

function petakanKonfigurasi(rows: { kunci: string | null; nilai: string | null }[]): KonfigurasiChatbot {
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.kunci && typeof r.nilai === "string") map[r.kunci] = r.nilai;
  }
  return {
    chatbot_aktif:
      map.chatbot_aktif !== undefined ? map.chatbot_aktif === "true" : KONFIGURASI_CHATBOT_DEFAULT.chatbot_aktif,
    chatbot_nama: map.chatbot_nama?.trim() || KONFIGURASI_CHATBOT_DEFAULT.chatbot_nama,
    chatbot_sapaan: map.chatbot_sapaan?.trim() || KONFIGURASI_CHATBOT_DEFAULT.chatbot_sapaan,
    chatbot_kontak_wa: map.chatbot_kontak_wa?.trim() || KONFIGURASI_CHATBOT_DEFAULT.chatbot_kontak_wa,
    chatbot_kontak_email: map.chatbot_kontak_email?.trim() || KONFIGURASI_CHATBOT_DEFAULT.chatbot_kontak_email,
  };
}

/** Konfigurasi publik chatbot untuk semua pengunjung (dibaca dari view `chatbot_konfigurasi_publik`). */
export async function ambilKonfigurasiChatbotPublik(): Promise<KonfigurasiChatbot> {
  if (pakaiMock) {
    return storeMock().chatbotConfig;
  }
  try {
    const { data, error } = await clientPublik().from("chatbot_konfigurasi_publik").select("kunci, nilai");
    if (error || !data || data.length === 0) return KONFIGURASI_CHATBOT_DEFAULT;
    return petakanKonfigurasi(data as { kunci: string | null; nilai: string | null }[]);
  } catch {
    return KONFIGURASI_CHATBOT_DEFAULT;
  }
}

export interface DetailPercakapanChat {
  percakapan: PercakapanChat;
  pesan: PesanChat[];
}

export async function ambilRiwayatPercakapanPengguna(percakapanId: string): Promise<DetailPercakapanChat | null> {
  const p = await ambilPenggunaSaya();
  if (!p || !percakapanId) return null;

  if (pakaiMock) {
    const store = storeMock();
    const pc = store.percakapanChat.find(
      (x) => x.id === percakapanId && (x.pengguna_id === p.id || p.peran === "admin"),
    );
    if (!pc) return null;
    const pesan = store.pesanChat
      .filter((m) => m.percakapan_id === pc.id)
      .sort((a, b) => Date.parse(a.dibuat_pada) - Date.parse(b.dibuat_pada));
    return { percakapan: pc, pesan };
  }

  const supabase = await buatClientServer();
  const { data: pcData, error: pcErr } = await supabase
    .from("percakapan_chat")
    .select("*")
    .eq("id", percakapanId)
    .maybeSingle();
  if (pcErr || !pcData) return null;

  const { data: pesanData, error: pesanErr } = await supabase
    .from("pesan_chat")
    .select("*")
    .eq("percakapan_id", percakapanId)
    .order("dibuat_pada", { ascending: true });
  lemparJikaError(pesanErr);

  type BarisPesan = Database["public"]["Tables"]["pesan_chat"]["Row"];
  const pesan: PesanChat[] = ((pesanData ?? []) as BarisPesan[]).map((m) => ({
    ...m,
    sitasi: parseSitasi(m.sitasi),
  }));

  return { percakapan: pcData as PercakapanChat, pesan };
}

export async function mintaBantuanAdminChat({
  percakapanId,
  buatTiket,
  ringkasanMasalah,
}: {
  percakapanId?: string | null;
  buatTiket?: boolean;
  ringkasanMasalah?: string;
}): Promise<{ percakapan_id: string; status: StatusPercakapanChat; laporan_masalah_id: string | null }> {
  const p = await wajibMasuk();
  const ringkasan = ringkasanMasalah?.trim() || undefined;

  if (pakaiMock) {
    const store = storeMock();
    const sekarang = new Date().toISOString();
    let id = percakapanId ?? null;
    let pc = id ? store.percakapanChat.find((x) => x.id === id) : undefined;
    if (!pc) {
      id = crypto.randomUUID();
      pc = {
        id,
        pengguna_id: p.id,
        admin_id: null,
        judul: ringkasan?.slice(0, 80) || "Bantuan langsung Admin",
        status: "menunggu_admin",
        laporan_masalah_id: null,
        dibuat_pada: sekarang,
        diperbarui_pada: sekarang,
      };
      store.percakapanChat.unshift(pc);
    }
    if (pc.pengguna_id !== p.id) throw new Error("TIDAK_BERHAK");

    let tiketId = pc.laporan_masalah_id;
    if (buatTiket && !tiketId && (p.peran === "orang_tua" || p.peran === "siswa")) {
      const pengajarDefault = store.profilPengajar[0]?.pengguna_id ?? p.id;
      tiketId = crypto.randomUUID();
      store.laporanMasalah.unshift({
        id: tiketId,
        pelapor_id: p.id,
        sesi_id: null,
        pengajar_id: pengajarDefault,
        kategori: "lainnya",
        deskripsi: ringkasan || `Eskalasi bantuan dari percakapan chat dengan Kiko (${pc.judul})`,
        prioritas: "normal",
        status: "baru",
        dibuat_pada: sekarang,
      });
    }

    pc.status = pc.status === "ditangani_admin" ? "ditangani_admin" : "menunggu_admin";
    pc.laporan_masalah_id = tiketId;
    pc.diperbarui_pada = sekarang;

    store.pesanChat.push({
      id: crypto.randomUUID(),
      percakapan_id: pc.id,
      pengirim_id: p.id,
      pengirim_peran: "sistem",
      isi: "Permintaan bicara dengan Admin telah dikirim. Mohon tunggu, Admin Kodie akan segera bergabung ke percakapan ini.",
      sitasi: [],
      dibuat_pada: sekarang,
    });

    for (const adm of daftarPenggunaMock().filter((u) => u.peran === "admin")) {
      store.notifikasi.push({
        id: crypto.randomUUID(),
        pengguna_id: adm.id,
        tipe: "chat_handoff",
        judul: "Permintaan Live Chat Admin",
        isi: `${p.nama} meminta bantuan langsung di chat.`,
        tautan: `/admin/chat/${pc.id}`,
        dibaca_pada: null,
        dibuat_pada: sekarang,
      });
    }
    return { percakapan_id: pc.id, status: pc.status, laporan_masalah_id: tiketId };
  }

  const supabase = await buatClientServer();
  let targetId = percakapanId ?? null;
  if (!targetId) {
    const { data: baru, error: errBuat } = await supabase
      .from("percakapan_chat")
      .insert({
        pengguna_id: p.id,
        judul: ringkasan?.slice(0, 80) || "Bantuan langsung Admin",
      })
      .select("id")
      .single();
    lemparJikaError(errBuat);
    targetId = (baru as { id: string }).id;
  }

  const { data, error } = await supabase.rpc("minta_bantuan_admin_chat", {
    p_percakapan_id: targetId,
    p_buat_tiket: Boolean(buatTiket),
    p_ringkasan_masalah: ringkasan,
  });
  lemparJikaError(error);
  return data as { percakapan_id: string; status: StatusPercakapanChat; laporan_masalah_id: string | null };
}

export async function kirimPesanLiveChat({
  percakapanId,
  isi,
}: {
  percakapanId: string;
  isi: string;
}): Promise<PesanChat> {
  const p = await wajibMasuk();
  const teks = isi.trim();
  if (!teks || teks.length > 1500) throw new Error("VALIDASI_GAGAL");

  if (pakaiMock) {
    const store = storeMock();
    const pc = store.percakapanChat.find((x) => x.id === percakapanId);
    if (!pc) throw new Error("VALIDASI_GAGAL");
    if (p.peran !== "admin" && pc.pengguna_id !== p.id) throw new Error("TIDAK_BERHAK");

    const sekarang = new Date().toISOString();
    const peranPengirim = p.peran === "admin" ? "admin" : "pengguna";
    if (peranPengirim === "admin") {
      pc.status = "ditangani_admin";
      pc.admin_id ??= p.id;
    }
    pc.diperbarui_pada = sekarang;

    const baru: PesanChat = {
      id: crypto.randomUUID(),
      percakapan_id: pc.id,
      pengirim_id: p.id,
      pengirim_peran: peranPengirim,
      isi: teks,
      sitasi: [],
      dibuat_pada: sekarang,
    };
    store.pesanChat.push(baru);
    return baru;
  }

  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("kirim_pesan_live_chat", {
    p_percakapan_id: percakapanId,
    p_isi: teks,
  });
  lemparJikaError(error);
  const hasil = data as { id: string; percakapan_id: string; pengirim_peran: "pengguna" | "admin"; dibuat_pada: string };
  return {
    id: hasil.id,
    percakapan_id: hasil.percakapan_id,
    pengirim_id: p.id,
    pengirim_peran: hasil.pengirim_peran,
    isi: teks,
    sitasi: [],
    dibuat_pada: hasil.dibuat_pada,
  };
}

export async function selesaikanAtauKembaliKeBotChat({
  percakapanId,
  kembaliKeBot,
}: {
  percakapanId: string;
  kembaliKeBot: boolean;
}): Promise<{ percakapan_id: string; status: StatusPercakapanChat }> {
  const p = await wajibMasuk();

  if (pakaiMock) {
    const store = storeMock();
    const pc = store.percakapanChat.find((x) => x.id === percakapanId);
    if (!pc) throw new Error("VALIDASI_GAGAL");
    if (p.peran !== "admin" && pc.pengguna_id !== p.id) throw new Error("TIDAK_BERHAK");

    const sekarang = new Date().toISOString();
    const statusBaru: StatusPercakapanChat = kembaliKeBot ? "bot" : "selesai";
    pc.status = statusBaru;
    pc.diperbarui_pada = sekarang;

    store.pesanChat.push({
      id: crypto.randomUUID(),
      percakapan_id: pc.id,
      pengirim_id: p.id,
      pengirim_peran: "sistem",
      isi: kembaliKeBot
        ? "Sesi dengan Admin selesai. Percakapan dikembalikan ke asisten Kiko."
        : "Percakapan telah ditandai selesai.",
      sitasi: [],
      dibuat_pada: sekarang,
    });
    return { percakapan_id: pc.id, status: statusBaru };
  }

  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("admin_selesaikan_chat", {
    p_percakapan_id: percakapanId,
    p_kembali_ke_bot: kembaliKeBot,
  });
  lemparJikaError(error);
  return data as { percakapan_id: string; status: StatusPercakapanChat };
}

// ---------------------------------------------------------------------------
// Operasi khusus Admin (/admin/chat dan /admin/pengaturan)
// ---------------------------------------------------------------------------

export interface ItemPercakapanAdmin {
  percakapan: PercakapanChat;
  penggunaNama: string;
  penggunaPeran: string;
  pesanTerakhir: string | null;
}

export interface DetailPercakapanAdmin extends DetailPercakapanChat {
  penggunaNama: string;
  penggunaPeran: string;
}

export async function ambilPengaturanChatbotAdmin(): Promise<KonfigurasiChatbot> {
  await wajibAdmin();
  return ambilKonfigurasiChatbotPublik();
}

export async function adminSimpanPengaturanChatbot(input: InputPengaturanChatbot): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    store.chatbotConfig = {
      chatbot_aktif: input.chatbot_aktif,
      chatbot_nama: input.chatbot_nama.trim(),
      chatbot_sapaan: input.chatbot_sapaan.trim(),
      chatbot_kontak_wa: input.chatbot_kontak_wa.trim(),
      chatbot_kontak_email: input.chatbot_kontak_email.trim(),
    };
    store.logAdmin.unshift({
      id: crypto.randomUUID(),
      admin_id: admin.id,
      aksi: "ubah_pengaturan_chatbot",
      target_tipe: "pengaturan",
      target_id: "chatbot",
      detail: { chatbot_aktif: input.chatbot_aktif, chatbot_nama: input.chatbot_nama.trim() },
      dibuat_pada: new Date().toISOString(),
    });
    return;
  }

  const supabase = await buatClientServer();
  const entri: { kunci: string; nilai: string }[] = [
    { kunci: "chatbot_aktif", nilai: input.chatbot_aktif ? "true" : "false" },
    { kunci: "chatbot_nama", nilai: input.chatbot_nama.trim() },
    { kunci: "chatbot_sapaan", nilai: input.chatbot_sapaan.trim() },
    { kunci: "chatbot_kontak_wa", nilai: input.chatbot_kontak_wa.trim() },
    { kunci: "chatbot_kontak_email", nilai: input.chatbot_kontak_email.trim() },
  ];
  const { error } = await supabase.from("pengaturan").upsert(entri, { onConflict: "kunci" });
  lemparJikaError(error);
}

export async function ambilDaftarPercakapanChatAdmin(): Promise<ItemPercakapanAdmin[]> {
  await wajibAdmin();

  if (pakaiMock) {
    const store = storeMock();
    const uMap = new Map(daftarPenggunaMock().map((u) => [u.id, u]));
    const items = store.percakapanChat.map((pc) => {
      const pesanPc = store.pesanChat
        .filter((m) => m.percakapan_id === pc.id)
        .sort((a, b) => Date.parse(b.dibuat_pada) - Date.parse(a.dibuat_pada));
      const u = uMap.get(pc.pengguna_id);
      return {
        percakapan: pc,
        penggunaNama: u?.nama ?? "Pengguna",
        penggunaPeran: u?.peran ?? "orang_tua",
        pesanTerakhir: pesanPc[0]?.isi ?? null,
        status: pc.status,
        diperbarui_pada: pc.diperbarui_pada,
      };
    });
    return urutkanPercakapanAdmin(items).map(({ percakapan, penggunaNama, penggunaPeran, pesanTerakhir }) => ({
      percakapan,
      penggunaNama,
      penggunaPeran,
      pesanTerakhir,
    }));
  }

  const supabase = await buatClientServer();
  const { data: pcData, error: pcErr } = await supabase
    .from("percakapan_chat")
    .select("*")
    .order("diperbarui_pada", { ascending: false })
    .limit(60);
  lemparJikaError(pcErr);
  const list = (pcData ?? []) as PercakapanChat[];
  if (list.length === 0) return [];

  const userIds = [...new Set(list.map((x) => x.pengguna_id))];
  const pcIds = list.map((x) => x.id);

  const [uRes, mRes] = await Promise.all([
    supabase.from("pengguna").select("id, nama, peran").in("id", userIds),
    supabase.from("pesan_chat").select("percakapan_id, isi, dibuat_pada").in("percakapan_id", pcIds).order("dibuat_pada", { ascending: false }),
  ]);
  lemparJikaError(uRes.error);
  lemparJikaError(mRes.error);

  const uMap = new Map(((uRes.data ?? []) as Pick<Pengguna, "id" | "nama" | "peran">[]).map((u) => [u.id, u]));
  const lastMsgMap = new Map<string, string>();
  for (const m of (mRes.data ?? []) as { percakapan_id: string; isi: string }[]) {
    if (!lastMsgMap.has(m.percakapan_id)) lastMsgMap.set(m.percakapan_id, m.isi);
  }

  const terurut = urutkanPercakapanAdmin(list);
  return terurut.map((pc) => {
    const u = uMap.get(pc.pengguna_id);
    return {
      percakapan: pc,
      penggunaNama: u?.nama ?? "Pengguna",
      penggunaPeran: u?.peran ?? "pengguna",
      pesanTerakhir: lastMsgMap.get(pc.id) ?? null,
    };
  });
}

export async function ambilDetailPercakapanChatAdmin(percakapanId: string): Promise<DetailPercakapanAdmin | null> {
  await wajibAdmin();

  if (pakaiMock) {
    const store = storeMock();
    const pc = store.percakapanChat.find((x) => x.id === percakapanId);
    if (!pc) return null;
    const u = daftarPenggunaMock().find((x) => x.id === pc.pengguna_id);
    const pesan = store.pesanChat
      .filter((m) => m.percakapan_id === pc.id)
      .sort((a, b) => Date.parse(a.dibuat_pada) - Date.parse(b.dibuat_pada));
    return {
      percakapan: pc,
      penggunaNama: u?.nama ?? "Pengguna",
      penggunaPeran: u?.peran ?? "pengguna",
      pesan,
    };
  }

  const supabase = await buatClientServer();
  const { data: pcData, error: pcErr } = await supabase
    .from("percakapan_chat")
    .select("*")
    .eq("id", percakapanId)
    .maybeSingle();
  lemparJikaError(pcErr);
  if (!pcData) return null;
  const pc = pcData as PercakapanChat;

  const [uRes, mRes] = await Promise.all([
    supabase.from("pengguna").select("id, nama, peran").eq("id", pc.pengguna_id).maybeSingle(),
    supabase.from("pesan_chat").select("*").eq("percakapan_id", percakapanId).order("dibuat_pada", { ascending: true }),
  ]);
  lemparJikaError(uRes.error);
  lemparJikaError(mRes.error);

  type BarisPesan = Database["public"]["Tables"]["pesan_chat"]["Row"];
  const u = uRes.data as Pick<Pengguna, "id" | "nama" | "peran"> | null;
  const pesan: PesanChat[] = ((mRes.data ?? []) as BarisPesan[]).map((m) => ({
    ...m,
    sitasi: parseSitasi(m.sitasi),
  }));

  return {
    percakapan: pc,
    penggunaNama: u?.nama ?? "Pengguna",
    penggunaPeran: u?.peran ?? "pengguna",
    pesan,
  };
}

export async function adminAmbilAlihChat(percakapanId: string): Promise<void> {
  const admin = await wajibAdmin();
  if (pakaiMock) {
    const store = storeMock();
    const pc = store.percakapanChat.find((x) => x.id === percakapanId);
    if (!pc) throw new Error("VALIDASI_GAGAL");
    const sekarang = new Date().toISOString();
    pc.status = "ditangani_admin";
    pc.admin_id = admin.id;
    pc.diperbarui_pada = sekarang;
    store.pesanChat.push({
      id: crypto.randomUUID(),
      percakapan_id: pc.id,
      pengirim_id: admin.id,
      pengirim_peran: "sistem",
      isi: "Admin Kodie telah bergabung ke percakapan.",
      sitasi: [],
      dibuat_pada: sekarang,
    });
    store.logAdmin.unshift({
      id: crypto.randomUUID(),
      admin_id: admin.id,
      aksi: "ambil_alih_chat",
      target_tipe: "percakapan_chat",
      target_id: percakapanId,
      detail: { pengguna_id: pc.pengguna_id },
      dibuat_pada: sekarang,
    });
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("admin_ambil_alih_chat", { p_percakapan_id: percakapanId });
  lemparJikaError(error);
}
