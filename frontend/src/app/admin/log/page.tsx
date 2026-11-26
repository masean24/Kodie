import type { Metadata } from "next";
import { ambilLogAdmin } from "@/lib/api/admin";
import { formatTanggalJam } from "@/lib/format";
import { Kartu, Lencana, StateKosong } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Log aksi admin" };

function formatDetailLog(detail: Record<string, unknown> | string | null): string {
  if (!detail) return "—";
  if (typeof detail === "string") return detail;
  const pasangan = Object.entries(detail).map(([k, v]) => `${k}: ${String(v)}`);
  return pasangan.length ? pasangan.join(" · ") : "—";
}

export default async function HalamanLogAdmin() {
  const daftar = await ambilLogAdmin(50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-32 leading-[38px] font-extrabold md:text-40 md:leading-[46px]">
          Log aksi admin
        </h1>
        <p className="mt-2 text-text-muted">
          50 catatan aktivitas terbaru admin untuk transparansi verifikasi, honor, dan perubahan pengaturan.
        </p>
      </div>

      {daftar.length === 0 ? (
        <StateKosong judul="Belum ada catatan aksi admin" />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-card bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Waktu (WIB)</th>
                  <th className="px-5 py-3.5 font-semibold">Admin</th>
                  <th className="px-5 py-3.5 font-semibold">Aksi</th>
                  <th className="px-5 py-3.5 font-semibold">Target</th>
                  <th className="px-5 py-3.5 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {daftar.map(({ log, adminNama }) => (
                  <tr key={log.id} className="align-top hover:bg-surface-sunken/50">
                    <td className="px-5 py-4 whitespace-nowrap text-text-muted">
                      {formatTanggalJam(log.dibuat_pada)}
                    </td>
                    <td className="px-5 py-4 font-semibold">{adminNama}</td>
                    <td className="px-5 py-4">
                      <Lencana nada="info">{log.aksi.replaceAll("_", " ")}</Lencana>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{log.target_tipe}</p>
                      <p className="font-mono text-sm break-all text-text-muted">{log.target_id}</p>
                    </td>
                    <td className="px-5 py-4 text-sm break-all text-text-muted">{formatDetailLog(log.detail)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {daftar.map(({ log, adminNama }) => (
              <Kartu key={log.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Lencana nada="info">{log.aksi.replaceAll("_", " ")}</Lencana>
                  <span className="text-sm text-text-muted">{formatTanggalJam(log.dibuat_pada)}</span>
                </div>
                <p className="text-sm font-semibold">{adminNama}</p>
                <p className="text-sm text-text-muted">
                  Target: <strong className="text-ink">{log.target_tipe}</strong>{" "}
                  <span className="font-mono break-all">({log.target_id})</span>
                </p>
                {log.detail ? (
                  <p className="rounded bg-surface-sunken px-3 py-2 font-mono text-sm break-all text-text-muted">
                    {formatDetailLog(log.detail)}
                  </p>
                ) : null}
              </Kartu>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
