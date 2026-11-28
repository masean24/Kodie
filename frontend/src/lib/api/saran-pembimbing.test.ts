import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Pengguna } from "@/types/database";

/**
 * Uji integrasi lapisan data mock untuk saran pembimbing 2026-11-28: booking dengan kode referral, trial gratis,
 * dan bagi hasil 30%/40%. Pengguna login dipalsukan; data dibaca dari store mock yang sama dengan aplikasi.
 */

const ORTU = "00000000-0000-4000-c000-000000000001";
const KELAS_NADIA_REGULER = "00000000-0000-4000-a000-000000000003";
const KELAS_SEKAR_KENAL = "00000000-0000-4000-a000-000000000007";

let pengguna: Pengguna | null = null;

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/api/auth", () => ({ ambilPenggunaSaya: async () => pengguna }));

const ortu: Pengguna = {
  id: ORTU,
  peran: "orang_tua",
  nama: "Sari Wulandari",
  no_wa: null,
  status: "aktif",
  dibuat_pada: "2026-11-01T03:00:00.000Z",
};

async function siapkan() {
  vi.resetModules();
  (globalThis as { __kodieMock?: unknown }).__kodieMock = undefined;
  const { storeMock } = await import("@/lib/mock/store");
  const store = storeMock();
  const anakSmp = {
    id: "00000000-0000-4000-d000-0000000000a1",
    nama: "Bima Uji",
    tanggal_lahir: "2013-05-02",
    jenjang: "SMP" as const,
    kelas: 8,
    sekolah: null,
    orang_tua_id: ORTU,
    pengguna_id: null,
    nama_orang_tua: null,
    email_orang_tua: null,
  };
  const anakTk = { ...anakSmp, id: "00000000-0000-4000-d000-0000000000a2", nama: "Kirana Uji", tanggal_lahir: "2021-03-10", jenjang: "TK" as const, kelas: 0 };
  store.siswa.push(anakSmp, anakTk);
  return { store, anakSmp, anakTk };
}

beforeEach(() => {
  pengguna = ortu;
});

describe("booking dengan kode referral", () => {
  it("memotong 5% bila kode milik pengajar kelas, dan pengajar mendapat 40% untuk siswa itu", async () => {
    const { store, anakSmp } = await siapkan();
    const { buatBooking } = await import("./booking");
    const hasil = await buatBooking(KELAS_NADIA_REGULER, anakSmp.id, { kodeReferral: " nadia-k7q2 " });
    expect(hasil.total).toBe(350_000 - 17_500);
    const b = store.booking.find((x) => x.id === hasil.id)!;
    expect(b).toMatchObject({ jenis: "paket", kode_referral: "NADIA-K7Q2", potongan: 17_500, status: "menunggu_pembayaran" });

    // Setelah admin mengonfirmasi, bagi hasil memakai nominal yang dibayar × 40%.
    b.status = "terkonfirmasi";
    const { buatKelasMock } = await import("@/lib/mock/data");
    const { pesertaBerbayarMock } = await import("./pengajar-lanjutan");
    const { hitungHonorPerSesi } = await import("@/lib/referral");
    const kelas = buatKelasMock(new Date()).find((k) => k.id === KELAS_NADIA_REGULER)!;
    const peserta = pesertaBerbayarMock(kelas, true);
    expect(peserta).toContainEqual({ total: 332_500, pakaiReferral: true });
    const tanpaReferral = peserta.filter((x) => !x.pakaiReferral);
    expect(hitungHonorPerSesi(peserta, 4)).toBe(
      Math.round((tanpaReferral.reduce((n, x) => n + x.total * 0.3, 0) + 332_500 * 0.4) / 4),
    );
  });

  it("menolak kode milik pengajar lain dan format yang salah", async () => {
    const { anakTk } = await siapkan();
    const { buatBooking } = await import("./booking");
    await expect(buatBooking(KELAS_SEKAR_KENAL, anakTk.id, { kodeReferral: "NADIA-K7Q2" })).rejects.toThrow("KODE_REFERRAL_TIDAK_VALID");
    await expect(buatBooking(KELAS_SEKAR_KENAL, anakTk.id, { kodeReferral: "a" })).rejects.toThrow("KODE_REFERRAL_TIDAK_VALID");
  });
});

describe("produksi sebelum backend siap (fitur lanjutan mati)", () => {
  it("menolak trial, kode referral, dan anak TK tanpa memanggil RPC baru", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "false");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://contoh.invalid");
    vi.stubEnv("NEXT_PUBLIC_FITUR_LANJUTAN", "");
    try {
      const { fiturLanjutan, pakaiMock } = await import("./sumber");
      expect(pakaiMock).toBe(false);
      expect(fiturLanjutan).toBe(false);
      const { buatBooking } = await import("./booking");
      await expect(buatBooking(KELAS_SEKAR_KENAL, "x", { jenis: "trial" })).rejects.toThrow("FITUR_BELUM_TERSEDIA");
      await expect(buatBooking(KELAS_NADIA_REGULER, "x", { kodeReferral: "NADIA-K7Q2" })).rejects.toThrow("FITUR_BELUM_TERSEDIA");
      const { ambilDetailProfilPengajar } = await import("./pengajar");
      await expect(ambilDetailProfilPengajar("x")).resolves.toEqual({ pengalaman: [], sertifikat: [] });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("trial gratis", () => {
  it("langsung terkonfirmasi Rp0, sekali per anak, dan tidak menambah honor", async () => {
    const { store, anakTk } = await siapkan();
    const { buatBooking } = await import("./booking");
    const hasil = await buatBooking(KELAS_SEKAR_KENAL, anakTk.id, { jenis: "trial", kodeReferral: "SEKAR-XXXX" });
    expect(hasil).toMatchObject({ status: "terkonfirmasi", total: 0 });
    expect(store.booking.find((x) => x.id === hasil.id)).toMatchObject({ jenis: "trial", kode_referral: null, potongan: 0 });

    await expect(buatBooking(KELAS_NADIA_REGULER, anakTk.id, { jenis: "trial" })).rejects.toThrow("TRIAL_SUDAH_DIPAKAI");

    const { buatKelasMock } = await import("@/lib/mock/data");
    const { pesertaBerbayarMock } = await import("./pengajar-lanjutan");
    const kelas = buatKelasMock(new Date()).find((k) => k.id === KELAS_SEKAR_KENAL)!;
    // Kursi contoh (2) dihitung lunas; trial tidak ikut.
    expect(pesertaBerbayarMock(kelas, true)).toEqual([
      { total: 225_000, pakaiReferral: false },
      { total: 225_000, pakaiReferral: false },
    ]);
  });

  it("anak yang tidak sesuai jenjang tetap ditolak lewat aturan program", async () => {
    const { alasanTidakCocok } = await import("@/lib/booking");
    const { programMock } = await import("@/lib/mock/data");
    const kenal = programMock.find((p) => p.slug === "kenal-komputer")!;
    expect(alasanTidakCocok({ jenjang: "TK", kelas: 0 }, kenal)).toBeNull();
    expect(alasanTidakCocok({ jenjang: "SD", kelas: 1 }, kenal)).toBeNull();
    expect(alasanTidakCocok({ jenjang: "SD", kelas: 2 }, kenal)).toMatch(/TK B sampai SD kelas 1/);
  });
});

describe("slug profil pengajar (custom & redirect UUID)", () => {
  it("memvalidasi format, kata tercadang, dan penolakan bentuk UUID", async () => {
    const { skemaSlugPengajar, buatSlugDariNama } = await import("@/lib/validasi/pengajar-lanjutan");
    expect(buatSlugDariNama("Citra Lestari Handayani!")).toBe("citra-lestari-handayani");
    expect(skemaSlugPengajar.safeParse("citra-lestari").success).toBe(true);
    expect(skemaSlugPengajar.safeParse("admin").success).toBe(false);
    expect(skemaSlugPengajar.safeParse("a323a9fb-976d-4141-89c8-085070598945").success).toBe(false);
    expect(skemaSlugPengajar.safeParse("ab").success).toBe(false);
    expect(skemaSlugPengajar.safeParse("nama--dobel").success).toBe(false);
  });

  it("bisa ubah slug kustom, tetap mencari via UUID maupun slug baru, dan tolak duplikat", async () => {
    await siapkan();
    pengguna = {
      id: "00000000-0000-4000-9000-000000000001",
      peran: "pengajar",
      nama: "Nadia Putri",
      no_wa: null,
      status: "terverifikasi",
      dibuat_pada: "2026-11-01T03:00:00.000Z",
    };
    const { ubahSlugPengajarSaya } = await import("./pengajar-lanjutan");
    const { ambilPengajarPublik } = await import("./pengajar");

    await expect(ubahSlugPengajarSaya("dimas-pratama")).rejects.toThrow("SLUG_SUDAH_DIPAKAI");

    const baru = await ubahSlugPengajarSaya("nadia-kode-it");
    expect(baru).toBe("nadia-kode-it");

    const viaSlug = await ambilPengajarPublik("nadia-kode-it");
    const viaUuid = await ambilPengajarPublik("00000000-0000-4000-9000-000000000001");
    expect(viaSlug?.id).toBe("00000000-0000-4000-9000-000000000001");
    expect(viaSlug?.slug).toBe("nadia-kode-it");
    expect(viaUuid?.slug).toBe("nadia-kode-it");
  });
});
