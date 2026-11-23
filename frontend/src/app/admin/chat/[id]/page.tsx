import type { Metadata } from "next";
import { ambilDaftarPercakapanChatAdmin, ambilDetailPercakapanChatAdmin } from "@/lib/api/chatbot";
import { PanelLiveChat } from "@/components/admin/panel-live-chat";

export const metadata: Metadata = { title: "Detail live chat" };

export default async function HalamanDetailLiveChatAdmin({ params }: PageProps<"/admin/chat/[id]">) {
  const { id } = await params;
  const [daftar, detail] = await Promise.all([
    ambilDaftarPercakapanChatAdmin(),
    ambilDetailPercakapanChatAdmin(id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] leading-[38px] font-extrabold md:text-[40px] md:leading-[46px]">
          Live chat & eskalasi Kiko
        </h1>
        <p className="mt-2 text-text-muted">
          Ambil alih percakapan saat pengguna meminta bantuan langsung atau Kiko meneruskan pertanyaan ke tim Admin.
        </p>
      </div>

      <PanelLiveChat daftarAwal={daftar} detailAwal={detail} />
    </div>
  );
}
