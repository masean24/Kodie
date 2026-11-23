import { describe, expect, it } from "vitest";
import { CHATBOT_AVATAR_CONFIG, CHATBOT_LAUNCHER_CONFIG } from "../components/chatbot/chatbot.config";
import {
  buatUrlWhatsApp,
  parseSitasi,
  sanitasiUrlAman,
  urutkanPercakapanAdmin,
} from "./chatbot";
import { buatUuid } from "./uuid";
import { skemaPengaturanChatbot } from "./validasi/admin";

describe("helper keamanan dan logika chatbot Kiko", () => {
  it("memfilter URL sitasi agar menolak javascript:, data:, dan protocol-relative //", () => {
    expect(sanitasiUrlAman("javascript:alert(1)")).toBeNull();
    expect(sanitasiUrlAman("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitasiUrlAman("//evil.example.com")).toBeNull();
    expect(sanitasiUrlAman("   ")).toBeNull();
    expect(sanitasiUrlAman("/program/coding-dasar")).toBe("/program/coding-dasar");
    expect(sanitasiUrlAman("https://wa.me/6281100000001")).toBe("https://wa.me/6281100000001");
    expect(sanitasiUrlAman("mailto:bantuan@kodie.id")).toBe("mailto:bantuan@kodie.id");
  });

  it("membuat tautan WhatsApp aman dari nomor admin", () => {
    expect(buatUrlWhatsApp("+62 811-0000-0001")).toBe("https://wa.me/6281100000001");
    expect(buatUrlWhatsApp("6281100000001", "Halo Admin")).toBe(
      "https://wa.me/6281100000001?text=Halo%20Admin",
    );
  });

  it("mem-parse sitasi JSON dan menyaring URL berbahaya", () => {
    const hasil = parseSitasi([
      { index: 1, title: "Coding Dasar", url: "/program/coding-dasar" },
      { index: 2, title: "XSS", url: "javascript:void(0)" },
      null,
    ]);
    expect(hasil).toEqual([{ index: 1, title: "Coding Dasar", url: "/program/coding-dasar", headingPath: undefined }]);
  });

  it("mengurutkan antrean live chat admin: menunggu_admin -> ditangani_admin -> bot -> selesai", () => {
    const list = [
      { id: "bot-lama", status: "bot" as const, diperbarui_pada: "2026-11-23T12:00:00Z" },
      { id: "selesai", status: "selesai" as const, diperbarui_pada: "2026-11-23T13:00:00Z" },
      { id: "tunggu-lama", status: "menunggu_admin" as const, diperbarui_pada: "2026-11-23T09:00:00Z" },
      { id: "tangani", status: "ditangani_admin" as const, diperbarui_pada: "2026-11-23T11:00:00Z" },
      { id: "tunggu-baru", status: "menunggu_admin" as const, diperbarui_pada: "2026-11-23T10:00:00Z" },
    ];
    expect(urutkanPercakapanAdmin(list).map((x) => x.id)).toEqual([
      "tunggu-baru",
      "tunggu-lama",
      "tangani",
      "bot-lama",
      "selesai",
    ]);
  });

  it("memvalidasi pengaturan chatbot admin (WA format 62 dan email)", () => {
    expect(
      skemaPengaturanChatbot.safeParse({
        chatbot_aktif: true,
        chatbot_nama: "Kiko",
        chatbot_sapaan: "Hai! Aku Kiko, ada yang bisa dibantu?",
        chatbot_kontak_wa: "6281100000001",
        chatbot_kontak_email: "bantuan@kodie.id",
      }).success,
    ).toBe(true);

    expect(
      skemaPengaturanChatbot.safeParse({
        chatbot_aktif: true,
        chatbot_nama: "Kiko",
        chatbot_sapaan: "Hai! Aku Kiko, ada yang bisa dibantu?",
        chatbot_kontak_wa: "081100000001",
        chatbot_kontak_email: "bantuan@kodie.id",
      }).success,
    ).toBe(false);
  });

  it("memisahkan konfigurasi avatar Kiko agar siap pakai maskot 2D atau gambar", () => {
    expect(CHATBOT_AVATAR_CONFIG.mode).toBe("kiko-2d");
    expect(CHATBOT_LAUNCHER_CONFIG.shape).toBe("mascot");
    expect(CHATBOT_LAUNCHER_CONFIG.suggestedPrompts.length).toBeGreaterThanOrEqual(3);
  });

  it("menghasilkan UUID v4 valid via buatUuid termasuk saat randomUUID tidak tersedia di HTTP LAN", () => {
    const polaUuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(buatUuid()).toMatch(polaUuidV4);

    const asli = globalThis.crypto.randomUUID;
    Object.defineProperty(globalThis.crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      expect(buatUuid()).toMatch(polaUuidV4);
    } finally {
      Object.defineProperty(globalThis.crypto, "randomUUID", { value: asli, configurable: true });
    }
  });
});
