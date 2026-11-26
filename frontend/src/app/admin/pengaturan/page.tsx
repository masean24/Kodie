import type { Metadata } from "next";
import { ambilPengaturanAdmin } from "@/lib/api/admin";
import { ambilPengaturanChatbotAdmin } from "@/lib/api/chatbot";
import { FormPengaturanAdmin, FormPengaturanChatbotAdmin } from "@/components/admin/aksi-kelola";

export const metadata: Metadata = { title: "Pengaturan sistem & pembayaran" };

export default async function HalamanPengaturanAdmin() {
  const [awal, chatbotAwal] = await Promise.all([
    ambilPengaturanAdmin(),
    ambilPengaturanChatbotAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-40 md:leading-[46px]">
          Pengaturan rekening, QRIS & asisten AI
        </h1>
        <p className="mt-2 text-text-muted">
          Rekening bank dan gambar QRIS tampil di halaman pembayaran, sementara pengaturan Kiko mengatur widget asisten di seluruh situs.
        </p>
      </div>

      <FormPengaturanAdmin awal={awal} />
      <FormPengaturanChatbotAdmin awal={chatbotAwal} />
    </div>
  );
}
