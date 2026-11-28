import { describe, expect, it } from "vitest";
import { skemaOrangTua, skemaSiswa } from "./auth";

const pesanTidakSama = "Password tidak sama. Ketik ulang password yang sama.";
const galatUlangi = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.error?.issues.filter((i) => i.path[0] === "ulangi_password").map((i) => i.message) ?? [];

describe("ulangi password", () => {
  it("pesan 'tidak sama' muncul walau centang privasi belum dicentang (AUD-AUT-01)", () => {
    const r = skemaOrangTua.safeParse({
      peran: "orang_tua",
      nama: "Ratna Dewi",
      email: "ratna@example.com",
      password: "KuatSekali123!",
      ulangi_password: "BedaBanget123!",
      no_wa: "081234567890",
      setuju_privasi: false,
    });
    expect(r.success).toBe(false);
    expect(galatUlangi(r)).toContain(pesanTidakSama);
  });

  it("siswa: pesan 'tidak sama' muncul walau field lain kosong", () => {
    const r = skemaSiswa.safeParse({
      peran: "siswa",
      nama: "",
      email: "",
      password: "KuatSekali123!",
      ulangi_password: "BedaBanget123!",
      tanggal_lahir: "",
      kelas: "",
      nama_orang_tua: "",
    });
    expect(galatUlangi(r)).toContain(pesanTidakSama);
  });

  it("ulangi kosong hanya memberi pesan wajib, bukan 'tidak sama'", () => {
    const r = skemaOrangTua.safeParse({ peran: "orang_tua", password: "KuatSekali123!", ulangi_password: "" });
    expect(galatUlangi(r)).toEqual(["Ulangi password Anda."]);
  });

  it("password sama lolos", () => {
    const r = skemaOrangTua.safeParse({
      peran: "orang_tua",
      nama: "Ratna Dewi",
      email: "ratna@example.com",
      password: "KuatSekali123!",
      ulangi_password: "KuatSekali123!",
      no_wa: "081234567890",
      setuju_privasi: true,
    });
    expect(r.success).toBe(true);
  });
});
