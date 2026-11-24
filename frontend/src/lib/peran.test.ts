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
  const dasar = { nama: "Raka Pratama", email: "raka@contoh.id", password: "Belajar#Kode26", ulangi_password: "Belajar#Kode26", setuju_privasi: true };

  it("menerima orang tua yang lengkap dan menolak nomor WA salah", () => {
    expect(skemaDaftar.safeParse({ ...dasar, peran: "orang_tua", no_wa: "081234567890" }).success).toBe(true);
    expect(skemaDaftar.safeParse({ ...dasar, peran: "orang_tua", no_wa: "12345" }).success).toBe(false);
  });

  it("menolak password kurang dari 8 karakter", () => {
    const r = skemaDaftar.safeParse({ ...dasar, password: "1234567", ulangi_password: "1234567", peran: "orang_tua", no_wa: "081234567890" });
    expect(r.success).toBe(false);
  });

  it("mewajibkan persetujuan Kebijakan Privasi", () => {
    const r = skemaDaftar.safeParse({ ...dasar, setuju_privasi: false, peran: "orang_tua", no_wa: "081234567890" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path.join(".") === "setuju_privasi")).toBe(true);
  });

  it("menolak password yang mudah ditebak", () => {
    for (const pw of ["password123", "12345678", "aaaaaaaa", "20100314", "abcabcabc"]) {
      const r = skemaDaftar.safeParse({ ...dasar, password: pw, ulangi_password: pw, peran: "orang_tua", no_wa: "081234567890" });
      expect(r.success, pw).toBe(false);
    }
  });

  it("menolak ulangi password yang tidak sama, dengan galat di isian ulangi_password", () => {
    const r = skemaDaftar.safeParse({ ...dasar, ulangi_password: "Belajar#Kode27", peran: "orang_tua", no_wa: "081234567890" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path.join(".") === "ulangi_password")).toBe(true);
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
  it("membuang email, password, ulangi password, dan isian kosong; mengirim privasi_disetujui", () => {
    expect(
      dataSignUp({
        peran: "orang_tua",
        nama: "Sari",
        email: "a@b.id",
        password: "Belajar#Kode26",
        ulangi_password: "Belajar#Kode26",
        no_wa: "081234567890",
        setuju_privasi: true,
      }),
    ).toEqual({ peran: "orang_tua", nama: "Sari", no_wa: "081234567890", privasi_disetujui: true });
  });
});
