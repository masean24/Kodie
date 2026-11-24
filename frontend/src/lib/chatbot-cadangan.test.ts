import { describe, expect, it } from "vitest";
import { CHATBOT_LAUNCHER_CONFIG } from "@/components/chatbot/chatbot.config";
import { jawabanCadanganKiko } from "./chatbot-cadangan";

describe("jawabanCadanganKiko", () => {
  it("selalu memberi jawaban, termasuk untuk pertanyaan bebas", () => {
    expect(jawabanCadanganKiko("Apa kabar Kiko?").isi.length).toBeGreaterThan(0);
  });

  it("menjawab pertanyaan biaya dengan harga ketiga program", () => {
    const j = jawabanCadanganKiko("Berapa biaya program Coding Dasar?").isi;
    expect(j).toContain("Rp200.000");
    expect(j).toContain("Rp275.000");
    expect(j).toContain("Rp300.000");
  });

  it("memakai jawaban pertanyaan populer bila cocok persis", () => {
    const populer = CHATBOT_LAUNCHER_CONFIG.suggestedPrompts[0];
    expect(populer).toBeTruthy();
    expect(jawabanCadanganKiko(populer!).isi).toContain("Coding Dasar");
  });

  it("tidak salah menangkap kata yang hanya mengandung huruf rp", () => {
    expect(jawabanCadanganKiko("Apakah kelasnya terpisah per jenjang?").isi).not.toContain("Rp275.000 per paket");
  });

  it("mengenali Tes Minat dan Kodie Lab", () => {
    expect(jawabanCadanganKiko("tes minat itu apa").isi).toContain("12 soal");
    expect(jawabanCadanganKiko("apa itu kodie lab").isi).toContain("4 mode");
  });
});
