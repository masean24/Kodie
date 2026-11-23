import { ambilPenggunaSaya } from "@/lib/api/auth";
import { ambilKonfigurasiChatbotPublik } from "@/lib/api/chatbot";
import { WidgetKiko } from "./widget-kiko";

/**
 * Pembungkus Server Component untuk Widget Kiko di KerangkaSitus.
 * Wajib berada di dalam `<Suspense fallback={null}>` agar kompatibel dengan Next.js `cacheComponents`.
 */
export async function ChatbotSitus() {
  const [konfigurasi, pengguna] = await Promise.all([
    ambilKonfigurasiChatbotPublik(),
    ambilPenggunaSaya(),
  ]);

  if (!konfigurasi.chatbot_aktif) return null;

  return (
    <WidgetKiko
      konfigurasi={konfigurasi}
      pengguna={pengguna ? { id: pengguna.id, nama: pengguna.nama, peran: pengguna.peran } : null}
    />
  );
}
