import type { Metadata } from "next";
import { ambilDaftarPercakapanChatAdmin, ambilDetailPercakapanChatAdmin } from "@/lib/api/chatbot";
import { PanelLiveChat } from "@/components/admin/panel-live-chat";

export const metadata: Metadata = { title: "Live chat & eskalasi Kiko" };

export default async function HalamanLiveChatAdmin() {
  const daftar = await ambilDaftarPercakapanChatAdmin();
  const pertamaId = daftar[0]?.percakapan.id;
  const detailAwal = pertamaId ? await ambilDetailPercakapanChatAdmin(pertamaId) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-40 md:leading-[46px]">
          Live chat & eskalasi Kiko
        </h1>
        <p className="mt-2 text-text-muted">
          Ambil alih percakapan saat pengguna meminta bantuan langsung atau Kiko meneruskan pertanyaan ke tim Admin.
        </p>
      </div>

      <PanelLiveChat daftarAwal={daftar} detailAwal={detailAwal} />
    </div>
  );
}
