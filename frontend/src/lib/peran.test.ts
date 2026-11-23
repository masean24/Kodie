import { describe, expect, it } from "vitest";
import { lanjutAman, peranArea, tujuanSetelahDaftar, tujuanSetelahMasuk } from "./peran";
import { dataSignUp, skemaDaftar } from "./validasi/auth";

describe("peranArea", () => {
  it("mengenali prefix area dan tidak tertipu prefix mirip", () => {
    expect(peranArea("/orang-tua/booking/1")).toBe("orang_tua");
    expect(peranArea("/mengajar")).toBe("pengajar");
    expect(peranArea("/admin/log")).toBe("admin");
    expect(peranArea("/siswa-baru")).toBeNull();
    expect(peranArea("/kelas")).toBeNull();
  });
});

describe("lanjutAman", () => {
  it("menolak redirect ke situs lain", () => {
    expect(lanjutAman("https://evil.com")).toBeNull();
    expect(lanjutAman("//evil.com")).toBeNull();
    expect(lanjutAman("/\\evil.com")).toBeNull();
    expect(lanjutAman("/kelas/1")).toBe("/kelas/1");
  });
});

describe("tujuanSetelahMasuk", () => {
  it("kembali ke halaman asal jika boleh untuk perannya", () => {
    expect(tujuanSetelahMasuk("orang_tua", "/kelas/abc")).toBe("/kelas/abc");
    expect(tujuanSetelahMasuk("orang_tua", "/orang-tua/booking")).toBe("/orang-tua/booking");
  });

  it("ke dashboard jika lanjut milik peran lain, tidak aman, atau kosong", () => {
    expect(tujuanSetelahMasuk("siswa", "/admin")).toBe("/siswa");
    expect(tujuanSetelahMasuk("pengajar", "//evil.com")).toBe("/mengajar");
    expect(tujuanSetelahMasuk("admin", "/masuk")).toBe("/admin");
    expect(tujuanSetelahMasuk("admin")).toBe("/admin");
  });

  it("siswa baru diarahkan ke halaman persetujuan", () => {
    expect(tujuanSetelahDaftar("siswa")).toBe("/siswa/persetujuan");
    expect(tujuanSetelahDaftar("orang_tua")).toBe("/orang-tua");
  });
});

describe("skemaDaftar", () => {
  const dasar = { nama: "Raka Pratama", email: "raka@contoh.id", password: "rahasia123" };

  it("menerima orang tua yang lengkap dan menolak nomor WA salah", () => {
    expect(skemaDaftar.safeParse({ ...dasar, peran: "orang_tua", no_wa: "081234567890" }).success).toBe(true);
    expect(skemaDaftar.safeParse({ ...dasar, peran: "orang_tua", no_wa: "12345" }).success).toBe(false);
  });

  it("menolak password kurang dari 8 karakter", () => {
    const r = skemaDaftar.safeParse({ ...dasar, password: "1234567", peran: "orang_tua", no_wa: "081234567890" });
    expect(r.success).toBe(false);
  });

  it("menolak kelas yang tidak sesuai jenjang siswa", () => {
    const siswa = {
      ...dasar,
      peran: "siswa",
      tanggal_lahir: "2010-03-14",
      jenjang: "SMA",
      nama_orang_tua: "Sari Wulandari",
    };
    expect(skemaDaftar.safeParse({ ...siswa, kelas: "11" }).success).toBe(true);
    expect(skemaDaftar.safeParse({ ...siswa, kelas: "8" }).success).toBe(false);
    expect(skemaDaftar.safeParse({ ...siswa, jenjang: "SD", kelas: "5" }).success).toBe(false);
  });

  it("pengajar wajib memilih minimal satu keahlian", () => {
    const pengajar = {
      ...dasar,
      peran: "pengajar",
      no_wa: "081234567890",
      status_kerja: "mahasiswa",
      kampus: "Universitas Contoh",
      jurusan: "Informatika",
    };
    expect(skemaDaftar.safeParse({ ...pengajar, keahlian: [] }).success).toBe(false);
    expect(skemaDaftar.safeParse({ ...pengajar, keahlian: ["iot"] }).success).toBe(true);
  });
});

describe("dataSignUp", () => {
  it("membuang email, password, dan isian kosong", () => {
    expect(
      dataSignUp({
        peran: "orang_tua",
        nama: "Sari",
        email: "a@b.id",
        password: "12345678",
        no_wa: "081234567890",
      }),
    ).toEqual({ peran: "orang_tua", nama: "Sari", no_wa: "081234567890" });
  });
});
