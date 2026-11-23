export type BentukLauncherChatbot = "circle" | "squircle" | "rounded" | "pill" | "mascot";

/**
 * Konfigurasi Avatar & Identitas Visual Kiko.
 * Secara bawaan memakai Maskot 2D SVG interaktif Kiko, dan dapat diganti
 * ke aset gambar statis dengan mengubah `mode` ke "image" serta mengisi `imageUrl`.
 */
export const CHATBOT_AVATAR_CONFIG = {
  /** Gunakan "kiko-2d" untuk SVG maskot 2D interaktif, atau "image" untuk gambar eksternal. */
  mode: "kiko-2d" as "kiko-2d" | "image",
  imageUrl: null as string | null,
  alt: "Kiko — Maskot asisten resmi Kodie",
};

/** Konfigurasi launcher maskot mengambang & saran pertanyaan awal. */
export const CHATBOT_LAUNCHER_CONFIG = {
  shape: "mascot" as BentukLauncherChatbot,
  labelPrefix: "Tanya",
  proactiveTooltip: "Hai! Ada yang bisa kubantu? :)",
  suggestedPrompts: [
    "Program apa yang cocok untuk anak SD kelas 5?",
    "Apa itu Simulasi Jurusan IT dan rapor rekomendasinya?",
    "Bagaimana cara daftar dan persetujuan orang tua?",
    "Bagaimana cara bayar dan masuk kelas Google Meet?",
  ],
};
