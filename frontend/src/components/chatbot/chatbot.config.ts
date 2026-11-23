export type BentukLauncherChatbot = "circle" | "squircle" | "rounded" | "pill";

/**
 * Konfigurasi Avatar & Identitas Visual Kiko.
 * Terpisah dari launcher bubble agar aset maskot Kiko dapat langsung dipasang
 * nanti dengan mengganti `mode` ke "image" dan mengisi `imageUrl`.
 */
export const CHATBOT_AVATAR_CONFIG = {
  /** Ganti ke "image" dan isi `imageUrl` (mis. "/logo/kiko-mascot.png") setelah maskot Kiko selesai dibangun. */
  mode: "kodie-symbol" as "kodie-symbol" | "image",
  imageUrl: null as string | null,
  alt: "Kiko — Asisten resmi Kodie",
};

/** Konfigurasi tombol launcher mengambang & saran pertanyaan awal. */
export const CHATBOT_LAUNCHER_CONFIG = {
  shape: "pill" as BentukLauncherChatbot,
  labelPrefix: "Tanya",
  proactiveTooltip: "Bingung pilih kelas IT? Tanya Kiko!",
  suggestedPrompts: [
    "Program apa yang cocok untuk anak SD kelas 5?",
    "Apa itu Simulasi Jurusan IT dan rapor rekomendasinya?",
    "Bagaimana cara daftar dan persetujuan orang tua?",
    "Bagaimana cara bayar dan masuk kelas Google Meet?",
  ],
};
