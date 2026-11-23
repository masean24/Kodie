"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Headset,
  Mail,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  Square,
  Ticket,
  UserCheck,
  X,
} from "lucide-react";
import type { Peran } from "@/types/database";
import {
  aksiBalasMockKiko,
  aksiKirimPesanLiveChat,
  aksiMintaBantuanAdmin,
  aksiMuatPercakapanChat,
  aksiSelesaikanAtauKembaliKeKiko,
} from "@/lib/aksi/chatbot";
import { pakaiMock } from "@/lib/api/sumber";
import {
  buatUrlWhatsApp,
  parseSitasi,
  sanitasiUrlAman,
  type HandoffChatbot,
  type KonfigurasiChatbot,
  type PengirimPesanChat,
  type SitasiChatbot,
  type StatusPercakapanChat,
} from "@/lib/chatbot";
import { cx } from "@/lib/cx";
import { buatClientBrowser } from "@/lib/supabase/browser";
import { buatUuid } from "@/lib/uuid";
import { AvatarKiko } from "./avatar-kiko";
import { CHATBOT_LAUNCHER_CONFIG } from "./chatbot.config";
import { MarkdownAman } from "./markdown-aman";

interface ItemPesanUI {
  id: string;
  peran: PengirimPesanChat;
  isi: string;
  sitasi: SitasiChatbot[];
  dibuatPada: string;
  tampilkanHandoff?: boolean;
  galat?: boolean;
  pertanyaanUlang?: string;
}

const KEY_PERCAKAPAN = "kodie_kiko_percakapan_id";
const KEY_TAMU_RIWAYAT = "kodie_kiko_tamu_riwayat";
const KEY_TOOLTIP_DITUTUP = "kodie_kiko_tooltip_tutup";

function kelasBentukLauncher(bentuk: typeof CHATBOT_LAUNCHER_CONFIG.shape) {
  switch (bentuk) {
    case "circle":
      return "size-14 rounded-full p-0";
    case "squircle":
      return "size-14 rounded-[18px] p-0";
    case "rounded":
      return "rounded-2xl px-4 py-2.5";
    case "pill":
    default:
      return "rounded-full px-4 py-2.5";
  }
}

function ekstrakKonteksHalaman(pathname: string) {
  if (typeof window === "undefined") {
    return { url: pathname, title: "Kodie", snippet: "" };
  }
  const utama = document.querySelector("main");
  const rawText = (utama?.textContent ?? document.body.textContent ?? "").replace(/\s+/g, " ").trim();
  return {
    url: window.location.pathname,
    title: document.title || "Kodie",
    snippet: rawText.slice(0, 2500),
  };
}

/**
 * Widget Floating AI Chatbot ("Kiko") + Live Admin Takeover.
 * Mendukung streaming SSE (`fetch` + `ReadableStream` + `AbortController`), sitasi interaktif,
 * Markdown aman, dan 3 jalur eskalasi ke manusia (WhatsApp/Email, Tiket, dan Live Chat Realtime).
 */
export function WidgetKiko({
  konfigurasi,
  pengguna,
}: {
  konfigurasi: KonfigurasiChatbot;
  pengguna: { id: string; nama: string; peran: Peran } | null;
}) {
  const pathname = usePathname() ?? "/";
  const [terbuka, setTerbuka] = useState(false);
  const [menutup, setMenutup] = useState(false);
  const [tooltipTampil, setTooltipTampil] = useState(false);
  const [panelHandoffBuka, setPanelHandoffBuka] = useState(false);

  const [percakapanId, setPercakapanId] = useState<string | null>(null);
  const [statusPercakapan, setStatusPercakapan] = useState<StatusPercakapanChat>("bot");
  const [pesanList, setPesanList] = useState<ItemPesanUI[]>([]);
  const [masukan, setMasukan] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [menungguTokenPertama, setMenungguTokenPertama] = useState(false);
  const [prosesHandoff, setProsesHandoff] = useState(false);
  const [pesanInfo, setPesanInfo] = useState<string | null>(null);
  const [pesanGalat, setPesanGalat] = useState<string | null>(null);
  const [disalinId, setDisalinId] = useState<string | null>(null);
  const [handoffTerakhir, setHandoffTerakhir] = useState<HandoffChatbot>({
    waUrl: buatUrlWhatsApp(konfigurasi.chatbot_kontak_wa),
    email: konfigurasi.chatbot_kontak_email,
    canLiveTakeover: Boolean(pengguna),
  });

  const abortRef = useRef<AbortController | null>(null);
  const gulirRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tutupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeOkRef = useRef(false);

  const namaBot = konfigurasi.chatbot_nama || "Kiko";

  const tutupPanel = useCallback(() => {
    if (!terbuka || menutup) return;
    setMenutup(true);
    tutupTimerRef.current = setTimeout(() => {
      setTerbuka(false);
      setMenutup(false);
    }, 200);
  }, [terbuka, menutup]);

  const bukaPanel = useCallback(() => {
    if (tutupTimerRef.current) clearTimeout(tutupTimerRef.current);
    setMenutup(false);
    setTerbuka(true);
    setTooltipTampil(false);
    try {
      sessionStorage.setItem(KEY_TOOLTIP_DITUTUP, "1");
    } catch {
      // Abaikan
    }
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const togglePanel = () => {
    if (terbuka && !menutup) tutupPanel();
    else bukaPanel();
  };

  // Proactive tooltip ringan di desktop sekali per sesi.
  useEffect(() => {
    if (!konfigurasi.chatbot_aktif || terbuka) return;
    let sudahDitutup = false;
    try {
      sudahDitutup = sessionStorage.getItem(KEY_TOOLTIP_DITUTUP) === "1";
    } catch {
      sudahDitutup = true;
    }
    if (sudahDitutup) return;
    const t = setTimeout(() => setTooltipTampil(true), 2200);
    return () => clearTimeout(t);
  }, [konfigurasi.chatbot_aktif, terbuka]);

  // Esc menutup widget.
  useEffect(() => {
    if (!terbuka) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutupPanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terbuka, tutupPanel]);

  // Pulihkan percakapan atau riwayat tamu saat mount / ganti status login.
  useEffect(() => {
    let batal = false;
    async function pulihkan() {
      if (pengguna) {
        let savedId: string | null = null;
        try {
          savedId = localStorage.getItem(KEY_PERCAKAPAN);
        } catch {
          savedId = null;
        }
        if (savedId) {
          const detail = await aksiMuatPercakapanChat(savedId);
          if (batal) return;
          if (detail) {
            setPercakapanId(detail.percakapan.id);
            setStatusPercakapan(detail.percakapan.status);
            setPesanList(
              detail.pesan.map((m) => ({
                id: m.id,
                peran: m.pengirim_peran,
                isi: m.isi,
                sitasi: m.sitasi,
                dibuatPada: m.dibuat_pada,
              })),
            );
            return;
          }
          try {
            localStorage.removeItem(KEY_PERCAKAPAN);
          } catch {
            // Abaikan
          }
        }
        if (!batal) {
          setPercakapanId(null);
          setStatusPercakapan("bot");
          setPesanList([]);
        }
      } else {
        try {
          const raw = localStorage.getItem(KEY_TAMU_RIWAYAT);
          if (raw) {
            const parsed = JSON.parse(raw) as ItemPesanUI[];
            if (Array.isArray(parsed) && !batal) setPesanList(parsed.slice(-20));
          }
        } catch {
          // Abaikan
        }
      }
    }
    void pulihkan();
    return () => {
      batal = true;
    };
  }, [pengguna]);

  // Simpan riwayat tamu sementara ke localStorage.
  useEffect(() => {
    if (pengguna) return;
    try {
      if (pesanList.length === 0) localStorage.removeItem(KEY_TAMU_RIWAYAT);
      else localStorage.setItem(KEY_TAMU_RIWAYAT, JSON.stringify(pesanList.slice(-20)));
    } catch {
      // Abaikan
    }
  }, [pengguna, pesanList]);

  // Langganan Supabase Realtime (atau polling fallback) saat percakapan dalam mode tunggu/ditangani admin.
  const dalamModeAdmin = statusPercakapan === "menunggu_admin" || statusPercakapan === "ditangani_admin";

  const segarkanPercakapan = useCallback(async () => {
    if (!percakapanId || !pengguna) return;
    const detail = await aksiMuatPercakapanChat(percakapanId);
    if (!detail) return;
    setStatusPercakapan(detail.percakapan.status);
    setPesanList(
      detail.pesan.map((m) => ({
        id: m.id,
        peran: m.pengirim_peran,
        isi: m.isi,
        sitasi: m.sitasi,
        dibuatPada: m.dibuat_pada,
      })),
    );
  }, [percakapanId, pengguna]);

  useEffect(() => {
    if (!percakapanId || !pengguna || !dalamModeAdmin) return;

    if (pakaiMock) {
      const timer = setInterval(() => {
        void segarkanPercakapan();
      }, 4_000);
      return () => clearInterval(timer);
    }

    const supabase = buatClientBrowser();
    const channel = supabase
      .channel(`widget-chat-${percakapanId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "percakapan_chat",
          filter: `id=eq.${percakapanId}`,
        },
        (payload) => {
          const baru = payload.new as { status?: StatusPercakapanChat };
          if (baru?.status) setStatusPercakapan(baru.status);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pesan_chat",
          filter: `percakapan_id=eq.${percakapanId}`,
        },
        (payload) => {
          const m = payload.new as {
            id?: string;
            pengirim_peran?: PengirimPesanChat;
            isi?: string;
            sitasi?: unknown;
            dibuat_pada?: string;
          };
          if (!m?.id || typeof m.isi !== "string") return;
          const item: ItemPesanUI = {
            id: m.id,
            peran: m.pengirim_peran ?? "sistem",
            isi: m.isi,
            sitasi: parseSitasi(m.sitasi),
            dibuatPada: m.dibuat_pada ?? new Date().toISOString(),
          };
          setPesanList((prev) => {
            if (prev.some((x) => x.id === item.id)) return prev;
            return [...prev, item];
          });
        },
      )
      .subscribe((st) => {
        realtimeOkRef.current = st === "SUBSCRIBED";
      });

    const fallback = setInterval(() => {
      if (!realtimeOkRef.current) void segarkanPercakapan();
    }, 8_000);

    return () => {
      clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [percakapanId, pengguna, dalamModeAdmin, segarkanPercakapan]);

  // Gulir otomatis ke bawah saat ada pesan baru atau streaming token.
  useEffect(() => {
    const el = gulirRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pesanList, terbuka, menungguTokenPertama]);

  const historyPayload = useMemo(
    () =>
      pesanList
        .filter((m) => (m.peran === "pengguna" || m.peran === "bot") && !m.galat && m.isi.trim().length > 0)
        .slice(-6)
        .map((m) => ({
          role: m.peran === "pengguna" ? ("user" as const) : ("assistant" as const),
          content: m.isi,
        })),
    [pesanList],
  );

  const resetPercakapan = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMenungguTokenPertama(false);
    setPercakapanId(null);
    setStatusPercakapan("bot");
    setPesanList([]);
    setPanelHandoffBuka(false);
    setPesanInfo(null);
    setPesanGalat(null);
    try {
      localStorage.removeItem(KEY_PERCAKAPAN);
      localStorage.removeItem(KEY_TAMU_RIWAYAT);
    } catch {
      // Abaikan
    }
  };

  const salinPesan = async (id: string, isi: string) => {
    try {
      await navigator.clipboard.writeText(isi);
      setDisalinId(id);
      setTimeout(() => setDisalinId((cur) => (cur === id ? null : cur)), 1600);
    } catch {
      // Abaikan
    }
  };

  const hentikanStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setMenungguTokenPertama(false);
  };

  const kirimPesan = async (teksKirim?: string) => {
    const teks = (teksKirim ?? masukan).trim();
    if (!teks || streaming) return;

    setMasukan("");
    setPesanInfo(null);
    setPesanGalat(null);

    const sekarang = new Date().toISOString();
    const msgUserId = `usr-${buatUuid()}`;

    // Jalur 1: Sedang dalam sesi Live Admin -> panggil RPC `kirim_pesan_live_chat`.
    if (dalamModeAdmin && percakapanId && pengguna) {
      const res = await aksiKirimPesanLiveChat(percakapanId, teks);
      if (res.galat || !res.data) {
        setPesanGalat(res.galat ?? "Gagal mengirim pesan live chat.");
        setMasukan(teks);
        return;
      }
      const tersimpan = res.data;
      setPesanList((prev) =>
        prev.some((x) => x.id === tersimpan.id)
          ? prev
          : [
              ...prev,
              {
                id: tersimpan.id,
                peran: tersimpan.pengirim_peran,
                isi: tersimpan.isi,
                sitasi: [],
                dibuatPada: tersimpan.dibuat_pada,
              },
            ],
      );
      return;
    }

    // Jalur 2: Mode Bot AI (Mock fallback atau Streaming SSE Supabase Edge Function `chat`).
    const botTempId = `bot-${buatUuid()}`;
    setPesanList((prev) => [
      ...prev,
      { id: msgUserId, peran: "pengguna", isi: teks, sitasi: [], dibuatPada: sekarang },
      { id: botTempId, peran: "bot", isi: "", sitasi: [], dibuatPada: sekarang },
    ]);

    if (pakaiMock) {
      setStreaming(true);
      setMenungguTokenPertama(true);
      const balas = await aksiBalasMockKiko(teks, namaBot);
      setStreaming(false);
      setMenungguTokenPertama(false);
      setPesanList((prev) =>
        prev.map((m) =>
          m.id === botTempId
            ? {
                ...m,
                isi: balas.isi,
                sitasi: balas.sitasi,
                tampilkanHandoff: balas.lowConfidence,
              }
            : m,
        ),
      );
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setMenungguTokenPertama(true);

    try {
      const supabase = buatClientBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const resp = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${session?.access_token ?? anonKey}`,
        },
        body: JSON.stringify({
          message: teks,
          percakapan_id: percakapanId ?? undefined,
          history: historyPayload,
          activePageContext: ekstrakKonteksHalaman(pathname),
        }),
      });

      if (!resp.ok || !resp.body) {
        let pesanServer = `Layanan ${namaBot} sedang sibuk. Silakan coba lagi atau hubungi Admin.`;
        try {
          const errJson = (await resp.json()) as { error?: string; message?: string };
          if (errJson.error === "TERLALU_BANYAK_PERMINTAAN") {
            pesanServer = "Terlalu banyak pesan dalam waktu singkat. Tunggu sebentar lalu coba lagi ya.";
          } else if (errJson.message) {
            pesanServer = errJson.message;
          }
        } catch {
          // Gunakan fallback pesan
        }
        setPesanList((prev) =>
          prev.map((m) =>
            m.id === botTempId
              ? { ...m, isi: pesanServer, galat: true, tampilkanHandoff: true, pertanyaanUlang: teks }
              : m,
          ),
        );
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const prosesBlokSse = (blok: string) => {
        const barisBlok = blok.split(/\r?\n/);
        let jenisEvent = "message";
        const dataBaris: string[] = [];
        for (const l of barisBlok) {
          if (l.startsWith("event:")) jenisEvent = l.slice(6).trim();
          else if (l.startsWith("data:")) dataBaris.push(l.slice(5).trim());
        }
        if (dataBaris.length === 0) return;
        const rawData = dataBaris.join("\n");
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(rawData) as Record<string, unknown>;
        } catch {
          return;
        }

        if (jenisEvent === "delta") {
          const chunk = typeof parsed.content === "string" ? parsed.content : "";
          if (!chunk) return;
          setMenungguTokenPertama(false);
          setPesanList((prev) =>
            prev.map((m) => (m.id === botTempId ? { ...m, isi: m.isi + chunk } : m)),
          );
        } else if (jenisEvent === "citations") {
          const list = parseSitasi(parsed.citations);
          setPesanList((prev) => prev.map((m) => (m.id === botTempId ? { ...m, sitasi: list } : m)));
        } else if (jenisEvent === "guardrail_refusal") {
          setMenungguTokenPertama(false);
          const msg =
            typeof parsed.message === "string"
              ? parsed.message
              : "Maaf, pertanyaan ini di luar cakupan informasi resmi Kodie.";
          setPesanList((prev) =>
            prev.map((m) =>
              m.id === botTempId ? { ...m, isi: msg, tampilkanHandoff: true } : m,
            ),
          );
        } else if (jenisEvent === "done") {
          setMenungguTokenPertama(false);
          const pcId = typeof parsed.percakapan_id === "string" ? parsed.percakapan_id : null;
          if (pcId) {
            setPercakapanId(pcId);
            try {
              localStorage.setItem(KEY_PERCAKAPAN, pcId);
            } catch {
              // Abaikan
            }
          }
          if (typeof parsed.mode === "string") {
            setStatusPercakapan(parsed.mode as StatusPercakapanChat);
          }
          if (parsed.handoff && typeof parsed.handoff === "object") {
            const h = parsed.handoff as HandoffChatbot;
            setHandoffTerakhir({
              waUrl: sanitasiUrlAman(h.waUrl) ?? buatUrlWhatsApp(konfigurasi.chatbot_kontak_wa),
              email: h.email || konfigurasi.chatbot_kontak_email,
              canLiveTakeover: Boolean(h.canLiveTakeover ?? pengguna),
              percakapanId: h.percakapanId ?? pcId,
              percakapanStatus: h.percakapanStatus ?? null,
            });
          }
          if (parsed.low_confidence) {
            setPesanList((prev) =>
              prev.map((m) => (m.id === botTempId ? { ...m, tampilkanHandoff: true } : m)),
            );
          }
        } else if (jenisEvent === "error") {
          setMenungguTokenPertama(false);
          const msg =
            typeof parsed.message === "string"
              ? parsed.message
              : `Maaf, ${namaBot} mengalami gangguan. Kamu tetap bisa menghubungi Admin secara langsung.`;
          setPesanList((prev) =>
            prev.map((m) =>
              m.id === botTempId
                ? { ...m, isi: msg, galat: true, tampilkanHandoff: true, pertanyaanUlang: teks }
                : m,
            ),
          );
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (part.trim()) prosesBlokSse(part);
        }
      }
      if (buffer.trim()) prosesBlokSse(buffer);

      // Pastikan pesan kosong (mis. aborted sebelum token pertama) tidak tertinggal aneh.
      setPesanList((prev) =>
        prev.map((m) =>
          m.id === botTempId && m.isi.trim() === ""
            ? { ...m, isi: "Respons dihentikan.", galat: false }
            : m,
        ),
      );
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        setPesanList((prev) =>
          prev.map((m) =>
            m.id === botTempId && m.isi.trim() === ""
              ? { ...m, isi: "Respons dihentikan." }
              : m,
          ),
        );
      } else {
        setPesanList((prev) =>
          prev.map((m) =>
            m.id === botTempId
              ? {
                  ...m,
                  isi: `Tidak dapat terhubung ke ${namaBot}. Coba ulangi atau hubungi Admin melalui opsi di bawah.`,
                  galat: true,
                  tampilkanHandoff: true,
                  pertanyaanUlang: teks,
                }
              : m,
          ),
        );
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setMenungguTokenPertama(false);
    }
  };

  const jalankanHandoffAdmin = async (buatTiket: boolean) => {
    if (!pengguna || prosesHandoff) return;
    setProsesHandoff(true);
    setPesanGalat(null);
    setPesanInfo(null);

    const pertanyaanTerakhir = [...pesanList].reverse().find((m) => m.peran === "pengguna")?.isi;
    const res = await aksiMintaBantuanAdmin({
      percakapanId,
      buatTiket,
      ringkasanMasalah: pertanyaanTerakhir,
    });
    setProsesHandoff(false);

    if (res.galat || !res.data) {
      setPesanGalat(res.galat ?? "Gagal menghubungi Admin.");
      return;
    }

    const { percakapan_id, status, laporan_masalah_id } = res.data;
    setPercakapanId(percakapan_id);
    setStatusPercakapan(status);
    setPanelHandoffBuka(false);
    try {
      localStorage.setItem(KEY_PERCAKAPAN, percakapan_id);
    } catch {
      // Abaikan
    }

    const catatanSistem = laporan_masalah_id
      ? "Tiket bantuan telah dibuat & permintaan Live Chat dikirim. Admin Kodie akan segera membalas di sini."
      : "Permintaan bicara dengan Admin telah dikirim. Mohon tunggu, Admin Kodie akan segera bergabung ke percakapan ini.";

    setPesanList((prev) => [
      ...prev,
      {
        id: `sys-${buatUuid()}`,
        peran: "sistem",
        isi: catatanSistem,
        sitasi: [],
        dibuatPada: new Date().toISOString(),
      },
    ]);
    setPesanInfo(laporan_masalah_id ? "Tiket bantuan dibuat dan sesi diteruskan ke Admin." : null);
  };

  const kembaliKeBot = async () => {
    if (!percakapanId || prosesHandoff) return;
    setProsesHandoff(true);
    const res = await aksiSelesaikanAtauKembaliKeKiko(percakapanId, true);
    setProsesHandoff(false);
    if (res.galat || !res.data) {
      setPesanGalat(res.galat ?? "Gagal mengembalikan percakapan.");
      return;
    }
    setStatusPercakapan(res.data.status);
    setPesanList((prev) => [
      ...prev,
      {
        id: `sys-${buatUuid()}`,
        peran: "sistem",
        isi: `Sesi dengan Admin selesai. Percakapan dikembalikan ke asisten ${namaBot}.`,
        sitasi: [],
        dibuatPada: new Date().toISOString(),
      },
    ]);
  };

  if (!konfigurasi.chatbot_aktif) return null;

  const waHref = sanitasiUrlAman(handoffTerakhir.waUrl) ?? buatUrlWhatsApp(konfigurasi.chatbot_kontak_wa);
  const mailHref = sanitasiUrlAman(`mailto:${handoffTerakhir.email}`) ?? `mailto:${konfigurasi.chatbot_kontak_email}`;

  const renderBlokHandoff = (keySuffix: string) => (
    <div
      key={`handoff-${keySuffix}`}
      className="mt-2 flex flex-col gap-2 rounded-card-sm border border-border bg-surface-sunken p-3 text-xs"
    >
      <p className="font-bold text-text">Terhubung dengan Tim Kodie:</p>
      <div className="flex flex-wrap gap-1.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-cta px-3 py-1 font-bold text-cta-foreground transition-colors hover:bg-cta-hover"
        >
          <MessageCircle aria-hidden className="size-3.5" /> WhatsApp
        </a>
        <a
          href={mailHref}
          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 font-bold text-text transition-colors hover:bg-surface-sunken"
        >
          <Mail aria-hidden className="size-3.5" /> Email
        </a>
        {pengguna ? (
          <>
            <button
              type="button"
              disabled={prosesHandoff || dalamModeAdmin}
              onClick={() => void jalankanHandoffAdmin(false)}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Headset aria-hidden className="size-3.5" /> Live Chat Admin
            </button>
            {(pengguna.peran === "orang_tua" || pengguna.peran === "siswa") && (
              <button
                type="button"
                disabled={prosesHandoff}
                onClick={() => void jalankanHandoffAdmin(true)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 font-bold text-text transition-colors hover:bg-surface-sunken disabled:opacity-50"
              >
                <Ticket aria-hidden className="size-3.5" /> Buat Tiket
              </button>
            )}
          </>
        ) : (
          <Link
            href="/masuk"
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <UserCheck aria-hidden className="size-3.5" /> Masuk untuk Live Chat
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="tanpa-cetak fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2.5 md:right-6 lg:bottom-6">
      {/* Panel Chat Kiko */}
      {terbuka ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-label={`Asisten ${namaBot}`}
          className={cx(
            "flex h-[min(560px,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-[24px] border border-border bg-surface shadow-2xl sm:w-[400px]",
            menutup ? "kiko-panel-out" : "kiko-panel-in",
          )}
        >
          {/* Header Panel */}
          <div className="blok-merek on-block flex items-center justify-between gap-2 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <AvatarKiko diatasBiru />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-display text-base font-bold">{namaBot}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                    {statusPercakapan === "ditangani_admin"
                      ? "Admin Live"
                      : statusPercakapan === "menunggu_admin"
                        ? "Menunggu Admin"
                        : "AI Asisten"}
                  </span>
                </div>
                <p className="truncate text-xs opacity-90">
                  {statusPercakapan === "ditangani_admin"
                    ? "Admin Kodie sedang membantu langsung"
                    : statusPercakapan === "menunggu_admin"
                      ? "Sedang menyambungkan ke Admin Kodie…"
                      : "Asisten resmi Kodie"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Mulai percakapan baru"
                aria-label="Mulai percakapan baru"
                onClick={resetPercakapan}
                className="grid size-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              >
                <RotateCcw aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                title="Tutup chat"
                aria-label="Tutup chat"
                onClick={tutupPanel}
                className="grid size-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>

          {/* Banner Status Live Admin */}
          {dalamModeAdmin ? (
            <div
              aria-live="polite"
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary-subtle px-4 py-2 text-xs font-semibold text-primary"
            >
              <span>
                {statusPercakapan === "ditangani_admin"
                  ? "Terhubung dengan Admin Kodie secara realtime."
                  : "Menunggu Admin bergabung ke percakapan…"}
              </span>
              <button
                type="button"
                disabled={prosesHandoff}
                onClick={() => void kembaliKeBot()}
                className="underline hover:text-primary-hover disabled:opacity-50"
              >
                Kembali ke {namaBot}
              </button>
            </div>
          ) : null}

          {/* Daftar Pesan */}
          <div ref={gulirRef} className="flex-1 overflow-y-auto bg-bg/50 px-3.5 py-4">
            <div className="flex flex-col gap-3">
              {/* Sapaan awal */}
              <div className="flex items-start gap-2">
                <AvatarKiko ukuran="kecil" />
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface px-3.5 py-2.5 text-[14px] leading-[22px] text-text shadow-xs">
                  <p>{konfigurasi.chatbot_sapaan}</p>
                </div>
              </div>

              {/* Saran pertanyaan awal saat belum ada percakapan */}
              {pesanList.length === 0 ? (
                <div className="mt-1 flex flex-col gap-1.5 pl-9">
                  <p className="text-xs font-semibold text-text-muted">Pertanyaan populer:</p>
                  {CHATBOT_LAUNCHER_CONFIG.suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => void kirimPesan(p)}
                      className="rounded-xl border border-border bg-surface px-3 py-2 text-left text-[13px] leading-snug font-medium text-text transition-colors hover:border-primary/40 hover:bg-primary-subtle/50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Riwayat Pesan */}
              {pesanList.map((m) => {
                if (m.peran === "sistem") {
                  return (
                    <div
                      key={m.id}
                      className="mx-auto my-1 max-w-[92%] rounded-full border border-border bg-surface px-3 py-1 text-center text-xs text-text-muted"
                    >
                      {m.isi}
                    </div>
                  );
                }

                const dariSaya = m.peran === "pengguna";
                const dariAdmin = m.peran === "admin";
                const sedangMengetik = !dariSaya && streaming && m.isi === "" && waitingCheck(m, pesanList, menungguTokenPertama);

                return (
                  <div
                    key={m.id}
                    className={cx("flex items-start gap-2", dariSaya ? "justify-end" : "justify-start")}
                  >
                    {!dariSaya ? (
                      dariAdmin ? (
                        <span
                          aria-hidden="true"
                          className="grid size-7 shrink-0 place-items-center rounded-full bg-cta text-cta-foreground"
                        >
                          <Headset className="size-4" />
                        </span>
                      ) : (
                        <AvatarKiko ukuran="kecil" />
                      )
                    ) : null}

                    <div className={cx("flex max-w-[85%] flex-col gap-1", dariSaya && "items-end")}>
                      {dariAdmin ? (
                        <span className="px-1 text-[11px] font-bold text-primary">Admin Kodie</span>
                      ) : null}

                      <div
                        className={cx(
                          "rounded-2xl px-3.5 py-2.5 shadow-xs",
                          dariSaya
                            ? "rounded-tr-sm bg-primary text-[14px] leading-[22px] text-primary-foreground"
                            : "rounded-tl-sm border border-border bg-surface text-text",
                        )}
                      >
                        {sedangMengetik ? (
                          <span className="inline-flex items-center gap-1 py-1" aria-label={`${namaBot} sedang mengetik`}>
                            <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.2s]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.1s]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-text-muted" />
                          </span>
                        ) : dariSaya ? (
                          <p className="whitespace-pre-wrap break-words">{m.isi}</p>
                        ) : (
                          <MarkdownAman teks={m.isi} sitasi={m.sitasi} />
                        )}
                      </div>

                      {/* Daftar sitasi & aksi salin/ulangi */}
                      {!dariSaya && !sedangMengetik && m.isi ? (
                        <div className="flex flex-wrap items-center gap-2 px-1">
                          <button
                            type="button"
                            onClick={() => void salinPesan(m.id, m.isi)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-primary"
                          >
                            {disalinId === m.id ? (
                              <>
                                <Check aria-hidden className="size-3 text-success" /> Disalin
                              </>
                            ) : (
                              <>
                                <Copy aria-hidden className="size-3" /> Salin
                              </>
                            )}
                          </button>
                          {m.galat && m.pertanyaanUlang ? (
                            <button
                              type="button"
                              onClick={() => void kirimPesan(m.pertanyaanUlang)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                            >
                              <RefreshCw aria-hidden className="size-3" /> Coba lagi
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {!dariSaya && m.sitasi.length > 0 ? (
                        <div className="flex flex-wrap gap-1 px-1">
                          {m.sitasi.map((s) => {
                            const href = sanitasiUrlAman(s.url);
                            if (!href) return null;
                            const label = `[${s.index}] ${s.title}`;
                            return href.startsWith("/") ? (
                              <Link
                                key={`${m.id}-cit-${s.index}`}
                                href={href}
                                className="rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary hover:underline"
                              >
                                {label}
                              </Link>
                            ) : (
                              <a
                                key={`${m.id}-cit-${s.index}`}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary hover:underline"
                              >
                                {label}
                              </a>
                            );
                          })}
                        </div>
                      ) : null}

                      {m.tampilkanHandoff ? renderBlokHandoff(m.id) : null}
                    </div>
                  </div>
                );
              })}

              {panelHandoffBuka ? renderBlokHandoff("manual") : null}

              {pesanInfo ? (
                <p role="status" className="rounded-md bg-success-subtle px-3 py-2 text-xs font-semibold text-success">
                  {pesanInfo}
                </p>
              ) : null}
              {pesanGalat ? (
                <p role="alert" className="rounded-md bg-danger-subtle px-3 py-2 text-xs font-semibold text-danger">
                  {pesanGalat}
                </p>
              ) : null}
            </div>
          </div>

          {/* Bar Bantu Manusia & Input Pesan */}
          <div className="border-t border-border bg-surface p-3">
            {!dalamModeAdmin ? (
              <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPanelHandoffBuka((v) => !v)}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <Headset aria-hidden className="size-3.5" />
                  {panelHandoffBuka ? "Tutup opsi Admin" : "Hubungi Admin langsung"}
                </button>
                <span className="text-[11px] text-text-muted">Tekan Enter untuk kirim</span>
              </div>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void kirimPesan();
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="kiko-input" className="sr-only">
                Tulis pesan untuk {namaBot}
              </label>
              <textarea
                ref={inputRef}
                id="kiko-input"
                rows={1}
                maxLength={1500}
                value={masukan}
                onChange={(e) => setMasukan(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void kirimPesan();
                  }
                }}
                placeholder={
                  dalamModeAdmin
                    ? "Tulis pesan untuk Admin Kodie…"
                    : `Tanya ${namaBot} seputar Kodie…`
                }
                disabled={streaming}
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-border bg-bg px-3.5 py-2.5 text-[14px] leading-5 text-text placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-60"
              />

              {streaming ? (
                <button
                  type="button"
                  onClick={hentikanStreaming}
                  aria-label="Hentikan jawaban"
                  title="Hentikan jawaban"
                  className="relative inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-border-strong bg-text px-3.5 py-2 text-xs font-bold text-bg shadow-sm transition-opacity hover:opacity-90"
                >
                  <span className="relative flex size-2.5 items-center justify-center">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                    <Square aria-hidden className="size-2.5 fill-current" />
                  </span>
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!masukan.trim()}
                  aria-label="Kirim pesan"
                  className="grid size-[44px] shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:text-text-muted"
                >
                  <SendHorizontal aria-hidden className="size-5" />
                </button>
              )}
            </form>
          </div>
        </section>
      ) : null}

      {/* Proactive Tooltip */}
      {!terbuka && tooltipTampil ? (
        <div className="hidden items-center gap-2 rounded-full border border-border bg-surface-raised py-1.5 pr-2 pl-3.5 text-xs font-semibold text-text shadow-md md:flex">
          <Sparkles aria-hidden className="size-3.5 text-primary" />
          <button type="button" onClick={bukaPanel} className="hover:underline">
            {CHATBOT_LAUNCHER_CONFIG.proactiveTooltip}
          </button>
          <button
            type="button"
            aria-label="Tutup sapaan"
            onClick={() => {
              setTooltipTampil(false);
              try {
                sessionStorage.setItem(KEY_TOOLTIP_DITUTUP, "1");
              } catch {
                // Abaikan
              }
            }}
            className="grid size-6 place-items-center rounded-full text-text-muted hover:bg-surface-sunken"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </div>
      ) : null}

      {/* Tombol Launcher Mengambang (ber-morph saat panel dibuka/ditutup) */}
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={terbuka && !menutup}
        aria-label={terbuka && !menutup ? `Tutup ${namaBot}` : `${CHATBOT_LAUNCHER_CONFIG.labelPrefix} ${namaBot}`}
        className={cx(
          "inline-flex min-h-[48px] items-center justify-center gap-2.5 border border-primary/20 bg-surface-raised font-display text-sm font-bold text-text shadow-lg transition-all duration-200 hover:border-primary hover:shadow-xl",
          kelasBentukLauncher(CHATBOT_LAUNCHER_CONFIG.shape),
        )}
      >
        <span
          className={cx(
            "transition-transform duration-200",
            terbuka && !menutup ? "rotate-90 scale-95" : "rotate-0 scale-100",
          )}
        >
          {terbuka && !menutup ? (
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <X aria-hidden className="size-4" />
            </span>
          ) : (
            <AvatarKiko ukuran="kecil" />
          )}
        </span>
        {CHATBOT_LAUNCHER_CONFIG.shape === "pill" || CHATBOT_LAUNCHER_CONFIG.shape === "rounded" ? (
          <span className="pr-1">
            {terbuka && !menutup ? "Tutup" : `${CHATBOT_LAUNCHER_CONFIG.labelPrefix} ${namaBot}`}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function waitingCheck(m: ItemPesanUI, list: ItemPesanUI[], waiting: boolean) {
  return waiting && list[list.length - 1]?.id === m.id;
}
