"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Bot, CheckCircle2, Headset, MessageSquare, RefreshCw, SendHorizontal, UserCheck } from "lucide-react";
import type { Peran } from "@/types/database";
import {
  aksiAdminAmbilAlihChat,
  aksiAdminAmbilDaftarChat,
  aksiAdminAmbilDetailChat,
  aksiAdminKirimPesanChat,
  aksiAdminSelesaikanChat,
} from "@/lib/aksi/chatbot";
import type { DetailPercakapanAdmin, ItemPercakapanAdmin } from "@/lib/api/chatbot";
import { pakaiMock } from "@/lib/api/sumber";
import {
  LABEL_STATUS_CHAT,
  parseSitasi,
  type PengirimPesanChat,
  type StatusPercakapanChat,
} from "@/lib/chatbot";
import { cx } from "@/lib/cx";
import { formatTanggalJam } from "@/lib/format";
import { NAMA_PERAN } from "@/lib/peran";
import { buatClientBrowser } from "@/lib/supabase/browser";
import { MarkdownAman } from "@/components/chatbot/markdown-aman";
import { PesanFormulir } from "@/components/auth/bagian";
import { Kartu, Lencana, StateKosong } from "@/components/ui/dasar";
import { Tombol } from "@/components/ui/tombol";

type FilterStatus = "semua" | StatusPercakapanChat;

const NADA_STATUS: Record<StatusPercakapanChat, "netral" | "peringatan" | "info" | "sukses"> = {
  bot: "netral",
  menunggu_admin: "peringatan",
  ditangani_admin: "info",
  selesai: "sukses",
};

const OPSI_FILTER: { nilai: FilterStatus; label: string }[] = [
  { nilai: "semua", label: "Semua" },
  { nilai: "menunggu_admin", label: "Menunggu admin" },
  { nilai: "ditangani_admin", label: "Ditangani" },
  { nilai: "bot", label: "Bot Kiko" },
  { nilai: "selesai", label: "Selesai" },
];

function namaPeranLabel(peran: string) {
  return NAMA_PERAN[peran as Peran] ?? peran;
}

/** Panel Live Chat & Takeover Admin (`/admin/chat` dan `/admin/chat/[id]`). */
export function PanelLiveChat({
  daftarAwal,
  detailAwal,
}: {
  daftarAwal: ItemPercakapanAdmin[];
  detailAwal: DetailPercakapanAdmin | null;
}) {
  const [daftar, setDaftar] = useState<ItemPercakapanAdmin[]>(daftarAwal);
  const [detail, setDetail] = useState<DetailPercakapanAdmin | null>(detailAwal);
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [balasan, setBalasan] = useState("");
  const [galat, setGalat] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [menunggu, mulai] = useTransition();

  const aktifId = detail?.percakapan.id ?? null;
  const gulirRef = useRef<HTMLDivElement>(null);
  const realtimeOkRef = useRef(false);

  const jumlahMenunggu = useMemo(
    () => daftar.filter((x) => x.percakapan.status === "menunggu_admin").length,
    [daftar],
  );

  const daftarTersaring = useMemo(
    () => (filter === "semua" ? daftar : daftar.filter((x) => x.percakapan.status === filter)),
    [daftar, filter],
  );

  const muatUlangSemua = useCallback(async (idTarget?: string | null) => {
    try {
      const listBaru = await aksiAdminAmbilDaftarChat();
      setDaftar(listBaru);
      const id = idTarget ?? aktifId;
      if (id) {
        const detBaru = await aksiAdminAmbilDetailChat(id);
        if (detBaru) setDetail(detBaru);
      }
    } catch {
      // Abaikan gangguan sementara
    }
  }, [aktifId]);

  const pilihPercakapan = (id: string) => {
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const det = await aksiAdminAmbilDetailChat(id);
      if (det) {
        setDetail(det);
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `/admin/chat/${id}`);
        }
      }
    });
  };

  // Langganan Supabase Realtime untuk antrean `percakapan_chat` + pesan aktif `pesan_chat`.
  useEffect(() => {
    if (pakaiMock) {
      const t = setInterval(() => {
        void muatUlangSemua();
      }, 6_000);
      return () => clearInterval(t);
    }

    const supabase = buatClientBrowser();
    const channel = supabase
      .channel(`admin-live-chat-${aktifId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "percakapan_chat" },
        () => {
          void muatUlangSemua();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pesan_chat" },
        (payload) => {
          const m = payload.new as {
            id?: string;
            percakapan_id?: string;
            pengirim_id?: string | null;
            pengirim_peran?: PengirimPesanChat;
            isi?: string;
            sitasi?: unknown;
            dibuat_pada?: string;
          };
          if (!m?.id || !m.percakapan_id || typeof m.isi !== "string") return;
          if (aktifId && m.percakapan_id === aktifId) {
            setDetail((prev) => {
              if (!prev || prev.percakapan.id !== m.percakapan_id) return prev;
              if (prev.pesan.some((x) => x.id === m.id)) return prev;
              return {
                ...prev,
                pesan: [
                  ...prev.pesan,
                  {
                    id: m.id!,
                    percakapan_id: m.percakapan_id!,
                    pengirim_id: m.pengirim_id ?? null,
                    pengirim_peran: m.pengirim_peran ?? "sistem",
                    isi: m.isi!,
                    sitasi: parseSitasi(m.sitasi),
                    dibuat_pada: m.dibuat_pada ?? new Date().toISOString(),
                  },
                ],
              };
            });
          }
          void muatUlangSemua();
        },
      )
      .subscribe((st) => {
        realtimeOkRef.current = st === "SUBSCRIBED";
      });

    const fallback = setInterval(() => {
      if (!realtimeOkRef.current) void muatUlangSemua();
    }, 20_000);

    return () => {
      clearInterval(fallback);
      void supabase.removeChannel(channel);
    };
  }, [aktifId, muatUlangSemua]);

  useEffect(() => {
    const el = gulirRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [detail?.pesan.length, aktifId]);

  const ambilAlih = () => {
    if (!detail) return;
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminAmbilAlihChat(detail.percakapan.id);
      if (res.galat) setGalat(res.galat);
      else {
        setInfo("Percakapan diambil alih. Anda sekarang terhubung secara realtime.");
        await muatUlangSemua(detail.percakapan.id);
      }
    });
  };

  const selesaikan = (kembaliKeBot: boolean) => {
    if (!detail) return;
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminSelesaikanChat(detail.percakapan.id, kembaliKeBot);
      if (res.galat) setGalat(res.galat);
      else {
        setInfo(
          kembaliKeBot
            ? "Sesi live selesai. Percakapan dikembalikan ke asisten Kiko."
            : "Percakapan ditandai selesai.",
        );
        await muatUlangSemua(detail.percakapan.id);
      }
    });
  };

  const kirimBalasan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    const isi = balasan.trim();
    if (!isi) return;
    setGalat(undefined);
    setInfo(undefined);
    mulai(async () => {
      const res = await aksiAdminKirimPesanChat(detail.percakapan.id, isi);
      if (res.galat) setGalat(res.galat);
      else {
        setBalasan("");
        await muatUlangSemua(detail.percakapan.id);
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Bar Filter & Tombol Segarkan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status percakapan">
          {OPSI_FILTER.map((op) => {
            const aktif = filter === op.nilai;
            return (
              <button
                key={op.nilai}
                type="button"
                role="tab"
                aria-selected={aktif}
                onClick={() => setFilter(op.nilai)}
                className={cx(
                  "inline-flex min-h-[40px] max-md:min-h-touch items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-bold transition-colors",
                  aktif
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-text hover:bg-surface-sunken",
                )}
              >
                <span>{op.label}</span>
                {op.nilai === "menunggu_admin" && jumlahMenunggu > 0 ? (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-sm text-danger-foreground tabular-nums">
                    {jumlahMenunggu}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Tombol varian="kedua" disabled={menunggu} onClick={() => void muatUlangSemua()}>
          <RefreshCw aria-hidden className={cx("size-4", menunggu && "animate-spin")} />
          Segarkan
        </Tombol>
      </div>

      {daftar.length === 0 ? (
        <StateKosong
          judul="Belum ada percakapan chat"
          keterangan="Permintaan live chat dari pengguna widget Kiko akan muncul secara realtime di sini."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Daftar Percakapan */}
          <div className="flex min-w-0 flex-col gap-2.5 lg:col-span-5">
            {daftarTersaring.length === 0 ? (
              <Kartu className="p-6 text-center text-sm text-text-muted">
                Tidak ada percakapan pada filter status ini.
              </Kartu>
            ) : (
              daftarTersaring.map((item) => {
                const terpilih = item.percakapan.id === aktifId;
                return (
                  <button
                    key={item.percakapan.id}
                    type="button"
                    onClick={() => pilihPercakapan(item.percakapan.id)}
                    className={cx(
                      "flex flex-col gap-2 rounded-card-sm border p-4 text-left transition-colors",
                      terpilih
                        ? "border-primary bg-primary-subtle/50"
                        : "border-border bg-surface hover:bg-surface-sunken",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 break-words font-display font-bold text-text">{item.penggunaNama}</span>
                      <Lencana nada={NADA_STATUS[item.percakapan.status]}>
                        {LABEL_STATUS_CHAT[item.percakapan.status]}
                      </Lencana>
                    </div>
                    <p className="text-sm font-semibold text-text-muted">
                      {namaPeranLabel(item.penggunaPeran)} · {formatTanggalJam(item.percakapan.diperbarui_pada)}
                    </p>
                    <p className="line-clamp-2 text-sm text-text-muted [overflow-wrap:anywhere]">
                      {item.pesanTerakhir ?? item.percakapan.judul}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail Percakapan */}
          <div className="min-w-0 lg:col-span-7">
            {!detail ? (
              <Kartu className="flex min-h-[360px] flex-col items-center justify-center gap-2 p-8 text-center text-text-muted">
                <MessageSquare aria-hidden className="size-8 text-primary" />
                <p className="font-display font-bold text-text">Pilih salah satu percakapan</p>
                <p className="text-sm">Klik percakapan di sebelah kiri untuk melihat riwayat pesan dan membalas.</p>
              </Kartu>
            ) : (
              <Kartu className="flex h-[620px] flex-col overflow-hidden p-0">
                {/* Header Detail */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-sunken px-5 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold">{detail.penggunaNama}</h2>
                      <Lencana nada={NADA_STATUS[detail.percakapan.status]}>
                        {LABEL_STATUS_CHAT[detail.percakapan.status]}
                      </Lencana>
                    </div>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {namaPeranLabel(detail.penggunaPeran)} · Diperbarui {formatTanggalJam(detail.percakapan.diperbarui_pada)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {detail.percakapan.status !== "ditangani_admin" && detail.percakapan.status !== "selesai" ? (
                      <Tombol disabled={menunggu} onClick={ambilAlih}>
                        <UserCheck aria-hidden className="size-4" /> Ambil Alih
                      </Tombol>
                    ) : null}
                    {detail.percakapan.status !== "bot" ? (
                      <Tombol varian="kedua" disabled={menunggu} onClick={() => selesaikan(true)}>
                        <Bot aria-hidden className="size-4" /> Kembalikan ke Kiko
                      </Tombol>
                    ) : null}
                    {detail.percakapan.status !== "selesai" ? (
                      <Tombol varian="kedua" disabled={menunggu} onClick={() => selesaikan(false)}>
                        <CheckCircle2 aria-hidden className="size-4" /> Selesai
                      </Tombol>
                    ) : null}
                  </div>
                </div>

                {/* Pesan Error / Info */}
                {galat || info ? (
                  <div className="border-b border-border px-5 py-2.5">
                    <PesanFormulir galat={galat} info={info} />
                  </div>
                ) : null}

                {/* Timeline Pesan */}
                <div ref={gulirRef} className="flex-1 overflow-y-auto bg-bg/40 px-5 py-4">
                  <div className="flex flex-col gap-3">
                    {detail.pesan.length === 0 ? (
                      <p className="py-10 text-center text-sm text-text-muted">Belum ada pesan di percakapan ini.</p>
                    ) : (
                      detail.pesan.map((m) => {
                        if (m.pengirim_peran === "sistem") {
                          return (
                            <div
                              key={m.id}
                              className="mx-auto max-w-[90%] rounded-full border border-border bg-surface px-3.5 py-1 text-center text-sm text-text-muted"
                            >
                              {m.isi}
                            </div>
                          );
                        }
                        const dariAdmin = m.pengirim_peran === "admin";
                        const dariBot = m.pengirim_peran === "bot";
                        return (
                          <div key={m.id} className={cx("flex flex-col gap-1", dariAdmin ? "items-end" : "items-start")}>
                            <div className="flex items-center gap-1.5 px-1 text-sm font-semibold text-text-muted">
                              {dariAdmin ? (
                                <>
                                  <Headset aria-hidden className="size-3.5 text-primary" /> Admin Kodie
                                </>
                              ) : dariBot ? (
                                <>
                                  <Bot aria-hidden className="size-3.5 text-primary" /> Kiko
                                </>
                              ) : (
                                <span>{detail.penggunaNama}</span>
                              )}
                              <span>· {formatTanggalJam(m.dibuat_pada)}</span>
                            </div>
                            <div
                              className={cx(
                                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-kartu",
                                dariAdmin
                                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                                  : dariBot
                                    ? "rounded-tl-sm border border-border bg-surface text-text"
                                    : "rounded-tl-sm border border-primary/25 bg-primary-subtle/50 text-text",
                              )}
                            >
                              {dariBot ? (
                                <MarkdownAman teks={m.isi} sitasi={m.sitasi} />
                              ) : (
                                <p className="whitespace-pre-wrap break-words leading-6">{m.isi}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Form Kirim Balasan Admin */}
                <form onSubmit={kirimBalasan} className="flex items-center gap-2 border-t border-border bg-surface px-4 py-3">
                  <label htmlFor="admin-balas-chat" className="sr-only">
                    Tulis balasan untuk {detail.penggunaNama}
                  </label>
                  <input
                    id="admin-balas-chat"
                    type="text"
                    maxLength={1500}
                    value={balasan}
                    onChange={(e) => setBalasan(e.target.value)}
                    placeholder={`Tulis balasan untuk ${detail.penggunaNama}…`}
                    className="min-h-control flex-1 rounded-full border-[1.5px] border-border-strong bg-bg px-4 text-base text-text placeholder:text-text-muted"
                  />
                  <Tombol type="submit" disabled={menunggu || !balasan.trim()}>
                    <SendHorizontal aria-hidden className="size-4" />
                    Kirim
                  </Tombol>
                </form>
              </Kartu>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
