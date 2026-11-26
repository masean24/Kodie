import { ObjekBidang } from "@/components/kategori";

/** Ilustrasi vektor sederhana per program (dekoratif, sesuai kartu Figma). */
export function GambarProgram({ slug }: { slug: string }) {
  if (slug === "coding-dasar") {
    return (
      <div aria-hidden className="relative h-32 overflow-hidden rounded-card-sm bg-white/60">
        <span className="absolute left-[14%] top-5 h-7 w-[38%] rounded-full bg-lime" />
        <span className="absolute left-[30%] top-14 h-7 w-[44%] rounded-full border-2 border-lime bg-white" />
        <span className="absolute left-[52%] top-[92px] h-7 w-[34%] rounded-full bg-lime" />
      </div>
    );
  }
  if (slug === "kelas-reguler-teknologi") {
    return (
      <div aria-hidden className="grid h-32 place-items-center rounded-card-sm bg-white/60">
        <div className="flex h-20 w-[72%] flex-col gap-2 rounded-md bg-lime p-3">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-royal" />
            <span className="size-2 rounded-full bg-white" />
          </span>
          <span className="h-1.5 w-3/4 rounded-full bg-white" />
          <span className="h-1.5 w-1/2 rounded-full bg-sky-soft" />
          <span className="h-1.5 w-2/3 rounded-full bg-white" />
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden className="relative h-32 rounded-card-sm bg-white/60">
      <ObjekBidang bidang="software" ukuran={44} miring={-6} className="absolute left-[22%] top-3" />
      <ObjekBidang bidang="jaringan" ukuran={40} miring={6} className="absolute left-[54%] top-2" />
      <ObjekBidang bidang="iot" ukuran={40} miring={4} className="absolute left-[36%] top-[66px]" />
      <ObjekBidang bidang="ai_data" ukuran={40} miring={-4} className="absolute left-[62%] top-[62px]" />
    </div>
  );
}
