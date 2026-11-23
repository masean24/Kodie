import { connection } from "next/server";
import type {
  Booking,
  Honor,
  InputLaporanSiswa,
  InputRaporJurusan,
  KelasKatalog,
  LaporanSesi,
  LaporanSiswa,
  PengajarProgram,
  Pengguna,
  Playbook,
  ProfilPengajar,
  Program,
  RaporJurusan,
  SesiSaya,
  StatusKelas,
} from "@/types/database";
import {
  batasKapasitas,
  bisaBukaPlaybook,
  bisaIsiLaporan,
  bisaMasukKelas,
  buatJadwal4Sesi,
  cekBentrokJadwal,
  laporanTerkunci,
  normalisasiJam,
  perluPengingatLaporan,
  perluRaporJurusan,
  ringkasHonor,
} from "@/lib/mengajar";
import { buatKelasMock, playbookMock, programMock } from "@/lib/mock/data";
import { storeMock } from "@/lib/mock/store";
import { buatClientServer } from "@/lib/supabase/server";
import type { InputBukaKelas, InputLaporanForm, InputProfilPengajar } from "@/lib/validasi/mengajar";
import { ambilPenggunaSaya } from "./auth";
import type { SiswaRingkas } from "./booking";
import { ambilDaftarProgram } from "./program";
import { lemparJikaError, pakaiMock } from "./sumber";

/** Area pengajar: F7, F8, F9, F10, F11, F13. Hanya untuk server (memakai sesi di cookie). */

async function wajibPengajar(): Promise<Pengguna> {
  await connection();
  const p = await ambilPenggunaSaya();
  if (!p || p.peran !== "pengajar") throw new Error("TIDAK_BERHAK");
  return p;
}

export interface ProfilLengkapPengajar {
  pengguna: Pengguna;
  profil: ProfilPengajar | null;
  programDipilih: PengajarProgram[];
  semuaProgram: Program[];
  fotoUrl: string | null;
}

export async function ambilProfilLengkapPengajar(): Promise<ProfilLengkapPengajar> {
  const p = await wajibPengajar();
  const semuaProgram = await ambilDaftarProgram();

  if (pakaiMock) {
    const store = storeMock();
    const profil = store.profilPengajar.find((x) => x.pengguna_id === p.id) ?? null;
    const programDipilih = store.pengajarProgram.filter((x) => x.pengajar_id === p.id);
    return { pengguna: p, profil, programDipilih, semuaProgram, fotoUrl: null };
  }

  const supabase = await buatClientServer();
  const [profRes, progRes] = await Promise.all([
    supabase.from("profil_pengajar").select("*").eq("pengguna_id", p.id).maybeSingle(),
    supabase.from("pengajar_program").select("*").eq("pengajar_id", p.id),
  ]);
  lemparJikaError(profRes.error);
  lemparJikaError(progRes.error);
  const profilRaw = (profRes.data as (Omit<ProfilPengajar, "status_kerja"> & { status_kerja: ProfilPengajar["status_kerja"] | null }) | null) ?? null;
  const profil: ProfilPengajar | null = profilRaw
    ? { ...profilRaw, status_kerja: profilRaw.status_kerja ?? "mahasiswa" }
    : null;
  const fotoUrl = profil?.foto_path
    ? supabase.storage.from("foto-pengajar").getPublicUrl(profil.foto_path).data.publicUrl
    : null;

  return {
    pengguna: p,
    profil,
    programDipilih: (progRes.data ?? []) as PengajarProgram[],
    semuaProgram,
    fotoUrl,
  };
}

export async function simpanProfilPengajar(input: InputProfilPengajar): Promise<void> {
  const p = await wajibPengajar();
  if (pakaiMock) {
    const store = storeMock();
    store.profilPengguna[p.id] = { nama: input.nama.trim(), no_wa: input.no_wa.trim() };
    const ada = store.profilPengajar.find((x) => x.pengguna_id === p.id);
    const dataProfil = {
      status_kerja: input.status_kerja,
      kampus: input.kampus.trim(),
      jurusan: input.jurusan.trim(),
      keahlian: input.keahlian,
      cv_url: input.cv_url ? input.cv_url.trim() : null,
    };
    if (ada) {
      Object.assign(ada, dataProfil);
    } else {
      store.profilPengajar.push({
        pengguna_id: p.id,
        ...dataProfil,
        foto_path: null,
        identitas_path: null,
        skck_path: null,
        wawancara_selesai: false,
        alasan_penolakan: null,
        diverifikasi_pada: null,
        diverifikasi_oleh: null,
      });
    }
    // Pertahankan status `disetujui` program yang sudah ada, tambahkan yang baru dengan disetujui = false.
    const lama = store.pengajarProgram.filter((x) => x.pengajar_id === p.id);
    const disetujuiLama = new Set(lama.filter((x) => x.disetujui).map((x) => x.program_id));
    store.pengajarProgram = [
      ...store.pengajarProgram.filter((x) => x.pengajar_id !== p.id),
      ...input.program_ids.map((program_id) => ({
        pengajar_id: p.id,
        program_id,
        disetujui: disetujuiLama.has(program_id),
      })),
    ];
    return;
  }

  const supabase = await buatClientServer();
  const [uRes, pRes, progLamaRes] = await Promise.all([
    supabase.from("pengguna").update({ nama: input.nama.trim(), no_wa: input.no_wa.trim() }).eq("id", p.id),
    supabase
      .from("profil_pengajar")
      .update({
        status_kerja: input.status_kerja,
        kampus: input.kampus.trim(),
        jurusan: input.jurusan.trim(),
        keahlian: input.keahlian,
        cv_url: input.cv_url ? input.cv_url.trim() : null,
      })
      .eq("pengguna_id", p.id),
    supabase.from("pengajar_program").select("*").eq("pengajar_id", p.id),
  ]);
  lemparJikaError(uRes.error);
  lemparJikaError(pRes.error);
  lemparJikaError(progLamaRes.error);

  const lama = (progLamaRes.data ?? []) as PengajarProgram[];
  const lamaIds = new Set(lama.map((x) => x.program_id));
  const baruIds = new Set(input.program_ids);
  const hapusIds = lama.filter((x) => !baruIds.has(x.program_id)).map((x) => x.program_id);
  const tambahIds = input.program_ids.filter((id) => !lamaIds.has(id));

  if (hapusIds.length > 0) {
    const { error } = await supabase
      .from("pengajar_program")
      .delete()
      .eq("pengajar_id", p.id)
      .in("program_id", hapusIds);
    lemparJikaError(error);
  }
  if (tambahIds.length > 0) {
    const { error } = await supabase
      .from("pengajar_program")
      .insert(tambahIds.map((program_id) => ({ pengajar_id: p.id, program_id, disetujui: false })));
    lemparJikaError(error);
  }
}

export async function simpanDokumenPengajar(
  kolom: "foto_path" | "identitas_path" | "skck_path",
  path: string,
): Promise<void> {
  const p = await wajibPengajar();
  if (!path.startsWith(`${p.id}/`)) throw new Error("FILE_TIDAK_VALID");
  if (pakaiMock) {
    const store = storeMock();
    const ada = store.profilPengajar.find((x) => x.pengguna_id === p.id);
    if (!ada) throw new Error("TIDAK_BERHAK");
    ada[kolom] = path;
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.from("profil_pengajar").update({ [kolom]: path }).eq("pengguna_id", p.id);
  lemparJikaError(error);
}

export interface KelasPengajarRinci {
  id: string;
  program: Program;
  level: number;
  kapasitas: number;
  jam_mulai: string;
  status: StatusKelas;
  dibuat_pada?: string;
  sesi: SesiSaya[];
  siswa: SiswaRingkas[];
  laporanBySesi: Record<string, LaporanSesi>;
}

type BarisKelasSupabase = {
  id: string;
  program_id: string;
  pengajar_id: string;
  kapasitas: number;
  jam_mulai: string;
  status: StatusKelas;
  level: number;
  dibuat_pada: string;
  program: Program | Program[];
};

async function ambilKelasMilikPengajar(pengajarId: string): Promise<KelasPengajarRinci[]> {
  const sekarang = new Date();
  if (pakaiMock) {
    const store = storeMock();
    const semuaKelas = buatKelasMock(sekarang).filter((k) => k.pengajar_id === pengajarId);
    const kelasIds = semuaKelas.map((k) => k.id);
    const sesiSemua = store.sesi.filter((s) => kelasIds.includes(s.kelas_id));
    const laporanSemua = store.laporanSesi.filter((l) => l.pengajar_id === pengajarId);
    const bookingTerkonfirmasi = store.booking.filter(
      (b) => kelasIds.includes(b.kelas_id) && (b.status === "terkonfirmasi" || b.status === "selesai"),
    );

    return semuaKelas
      .map((k) => {
        const program = programMock.find((pr) => pr.id === k.program_id)!;
        const sesi = sesiSemua
          .filter((s) => s.kelas_id === k.id)
          .sort((a, b) => a.nomor - b.nomor)
          .map((s) => ({ ...s, bisa_masuk_kelas: bisaMasukKelas(s.mulai_pada, s.selesai_pada, s.status, sekarang) }));
        const siswaIds = [...new Set(bookingTerkonfirmasi.filter((b) => b.kelas_id === k.id).map((b) => b.siswa_id))];
        const siswa = store.siswa
          .filter((s) => siswaIds.includes(s.id))
          .map(({ id, nama, jenjang, kelas }) => ({ id, nama, jenjang, kelas }));
        const laporanBySesi: Record<string, LaporanSesi> = {};
        for (const l of laporanSemua) {
          if (sesi.some((s) => s.id === l.sesi_id)) laporanBySesi[l.sesi_id] = l;
        }
        return {
          id: k.id,
          program,
          level: k.level,
          kapasitas: k.kapasitas,
          jam_mulai: k.jam_mulai,
          status: k.status,
          sesi,
          siswa,
          laporanBySesi,
        };
      })
      .sort((a, b) => (a.sesi[0]?.mulai_pada ?? "").localeCompare(b.sesi[0]?.mulai_pada ?? ""));
  }

  const supabase = await buatClientServer();
  const { data: kelasData, error: kelasErr } = await supabase
    .from("kelas")
    .select("*, program(*)")
    .eq("pengajar_id", pengajarId)
    .order("dibuat_pada", { ascending: false });
  lemparJikaError(kelasErr);
  const barisKelas = (kelasData ?? []) as BarisKelasSupabase[];
  if (barisKelas.length === 0) return [];

  const kelasIds = barisKelas.map((k) => k.id);
  const [sesiRes, bookingRes] = await Promise.all([
    supabase.from("sesi_saya").select("*").in("kelas_id", kelasIds).order("nomor"),
    supabase.from("booking").select("kelas_id, siswa_id, status").in("kelas_id", kelasIds).in("status", ["terkonfirmasi", "selesai"]),
  ]);
  lemparJikaError(sesiRes.error);
  lemparJikaError(bookingRes.error);

  const semuaSesi = (sesiRes.data ?? []) as SesiSaya[];
  const semuaBooking = (bookingRes.data ?? []) as Pick<Booking, "kelas_id" | "siswa_id" | "status">[];
  const sesiIds = semuaSesi.map((s) => s.id);
  const siswaIds = [...new Set(semuaBooking.map((b) => b.siswa_id))];

  const [laporanRes, siswaRes] = await Promise.all([
    sesiIds.length ? supabase.from("laporan_sesi").select("*").in("sesi_id", sesiIds) : Promise.resolve({ data: [], error: null }),
    siswaIds.length ? supabase.from("siswa").select("id, nama, jenjang, kelas").in("id", siswaIds) : Promise.resolve({ data: [], error: null }),
  ]);
  lemparJikaError(laporanRes.error);
  lemparJikaError(siswaRes.error);

  const semuaLaporan = (laporanRes.data ?? []) as LaporanSesi[];
  const semuaSiswa = (siswaRes.data ?? []) as SiswaRingkas[];

  return barisKelas.map((k) => {
    const sesi = semuaSesi.filter((s) => s.kelas_id === k.id).sort((a, b) => a.nomor - b.nomor);
    const sIds = new Set(semuaBooking.filter((b) => b.kelas_id === k.id).map((b) => b.siswa_id));
    const siswa = semuaSiswa.filter((s) => sIds.has(s.id));
    const laporanBySesi: Record<string, LaporanSesi> = {};
    for (const l of semuaLaporan) {
      if (sesi.some((s) => s.id === l.sesi_id)) laporanBySesi[l.sesi_id] = l;
    }
    const prog = Array.isArray(k.program) ? k.program[0]! : k.program;
    return {
      id: k.id,
      program: prog,
      level: k.level ?? 1,
      kapasitas: k.kapasitas,
      jam_mulai: k.jam_mulai,
      status: k.status,
      dibuat_pada: k.dibuat_pada,
      sesi,
      siswa,
      laporanBySesi,
    };
  });
}

export async function ambilDaftarKelasPengajar(): Promise<KelasPengajarRinci[]> {
  const p = await wajibPengajar();
  return ambilKelasMilikPengajar(p.id);
}

export async function ambilDetailKelasPengajar(kelasId: string): Promise<KelasPengajarRinci | null> {
  const p = await wajibPengajar();
  const daftar = await ambilKelasMilikPengajar(p.id);
  return daftar.find((k) => k.id === kelasId) ?? null;
}

export async function bukaKelas(input: InputBukaKelas): Promise<{ kelasId: string }> {
  const p = await wajibPengajar();
  if (p.status !== "terverifikasi") throw new Error("PENGAJAR_BELUM_TERVERIFIKASI");

  if (pakaiMock) {
    const store = storeMock();
    const program = programMock.find((pr) => pr.id === input.program_id && pr.aktif);
    if (!program) throw new Error("VALIDASI_GAGAL");
    const disetujui = store.pengajarProgram.some(
      (x) => x.pengajar_id === p.id && x.program_id === program.id && x.disetujui,
    );
    if (!disetujui) throw new Error("TIDAK_BERHAK");
    if (input.kapasitas < 1 || input.kapasitas > batasKapasitas(program.jenjang)) {
      throw new Error("KAPASITAS_TIDAK_VALID");
    }
    const jadwal = buatJadwal4Sesi(input.tanggal_mulai, input.jam_mulai, program.durasi_menit);
    if (jadwal.length !== 4 || new Date(jadwal[0].mulai_pada) <= new Date()) {
      throw new Error("VALIDASI_GAGAL");
    }
    const kelasMilik = buatKelasMock(new Date()).filter((k) => k.pengajar_id === p.id).map((k) => k.id);
    const sesiAda = store.sesi.filter((s) => kelasMilik.includes(s.kelas_id));
    if (cekBentrokJadwal(jadwal, sesiAda)) throw new Error("JADWAL_BENTROK");

    const kelasId = crypto.randomUUID();
    const jam = normalisasiJam(input.jam_mulai);
    const wibMulai = new Date(new Date(jadwal[0].mulai_pada).getTime() + 7 * 3_600_000);
    const hari_mingguan = ((wibMulai.getUTCDay() + 6) % 7) + 1;
    const baru: KelasKatalog = {
      id: kelasId,
      program_id: program.id,
      level: input.level,
      pengajar_id: p.id,
      kapasitas: input.kapasitas,
      jam_mulai: jam,
      status: "terbuka",
      kursi_terpakai: 0,
      sisa_kursi: input.kapasitas,
      bisa_dibooking: true,
      hari_mingguan,
      program_slug: program.slug,
      program_nama: program.nama,
      jenjang: program.jenjang,
      durasi_menit: program.durasi_menit,
      jumlah_sesi: program.jumlah_sesi,
      harga_paket: program.harga_paket,
      pengajar_nama: p.nama,
      pengajar_foto_url: null,
      mulai_pada: jadwal[0].mulai_pada,
    };
    store.kelasTambahan.push(baru);
    for (const j of jadwal) {
      store.sesi.push({
        id: crypto.randomUUID(),
        kelas_id: kelasId,
        nomor: j.nomor,
        mulai_pada: j.mulai_pada,
        selesai_pada: j.selesai_pada,
        status: "terjadwal",
        bisa_masuk_kelas: false,
      });
    }
    return { kelasId };
  }

  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("buka_kelas", {
    p_program_id: input.program_id,
    p_tanggal_mulai: input.tanggal_mulai,
    p_jam_mulai: normalisasiJam(input.jam_mulai),
    p_kapasitas: input.kapasitas,
    p_level: input.level,
  });
  lemparJikaError(error);
  const kelasId = (data as { kelas_id: string }).kelas_id;
  // Buat ruang Google Meet via Edge Function; jika gagal sementara, cron backend mencoba ulang.
  try {
    await supabase.functions.invoke("buat-meet", { body: { kelas_id: kelasId } });
  } catch {
    // Tetap arahkan ke detail kelas.
  }
  return { kelasId };
}

export async function geserSesi(sesiId: string, mulaiPadaIso: string): Promise<void> {
  const p = await wajibPengajar();
  if (pakaiMock) {
    const store = storeMock();
    const daftarKelas = await ambilKelasMilikPengajar(p.id);
    const kelasPemilik = daftarKelas.find((k) => k.sesi.some((s) => s.id === sesiId));
    if (!kelasPemilik) throw new Error("TIDAK_BERHAK");
    const sesi = store.sesi.find((s) => s.id === sesiId);
    if (!sesi || sesi.status !== "terjadwal") throw new Error("VALIDASI_GAGAL");
    const sekarang = new Date();
    if (new Date(sesi.mulai_pada).getTime() - sekarang.getTime() < 24 * 3_600_000) {
      throw new Error("VALIDASI_GAGAL");
    }
    const baruMulai = new Date(mulaiPadaIso);
    if (Number.isNaN(baruMulai.getTime()) || baruMulai.getTime() - sekarang.getTime() < 24 * 3_600_000) {
      throw new Error("VALIDASI_GAGAL");
    }
    const durasiMs = new Date(sesi.selesai_pada).getTime() - new Date(sesi.mulai_pada).getTime();
    const baruSelesai = new Date(baruMulai.getTime() + durasiMs).toISOString();
    const semuaSesiPengajar = daftarKelas.flatMap((k) => k.sesi);
    if (cekBentrokJadwal([{ mulai_pada: baruMulai.toISOString(), selesai_pada: baruSelesai }], semuaSesiPengajar, sesiId)) {
      throw new Error("JADWAL_BENTROK");
    }
    sesi.mulai_pada = baruMulai.toISOString();
    sesi.selesai_pada = baruSelesai;
    for (const st of kelasPemilik.siswa) {
      const barisSiswa = store.siswa.find((x) => x.id === st.id);
      const penerima: { id: string; prefix: string }[] = [];
      if (barisSiswa?.orang_tua_id) penerima.push({ id: barisSiswa.orang_tua_id, prefix: "/orang-tua" });
      if (barisSiswa?.pengguna_id) penerima.push({ id: barisSiswa.pengguna_id, prefix: "/siswa" });
      for (const target of penerima) {
        store.notifikasi.push({
          id: crypto.randomUUID(),
          pengguna_id: target.id,
          tipe: "sesi_dijadwal_ulang",
          judul: `Jadwal Sesi ${sesi.nomor} digeser`,
          isi: `${kelasPemilik.program.nama} Sesi ${sesi.nomor} dipindahkan oleh ${p.nama}.`,
          tautan: `${target.prefix}/sesi/${sesiId}`,
          dibaca_pada: null,
          dibuat_pada: new Date().toISOString(),
        });
      }
    }
    return;
  }

  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("geser_sesi", { p_sesi_id: sesiId, p_mulai_pada: mulaiPadaIso });
  lemparJikaError(error);
}

export async function ambilLinkMasukSesi(sesiId: string): Promise<{ meet_uri: string }> {
  const p = await wajibPengajar();
  if (pakaiMock) {
    const daftarKelas = await ambilKelasMilikPengajar(p.id);
    const sesi = daftarKelas.flatMap((k) => k.sesi).find((s) => s.id === sesiId);
    if (!sesi) throw new Error("TIDAK_BERHAK");
    if (!bisaMasukKelas(sesi.mulai_pada, sesi.selesai_pada, sesi.status, new Date())) {
      throw new Error("SESI_BELUM_DIBUKA");
    }
    return { meet_uri: "https://meet.google.com/kodie-contoh-sesi" };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("link_masuk_sesi", { p_sesi_id: sesiId });
  lemparJikaError(error);
  return data as { meet_uri: string };
}

export interface DataHalamanPlaybook {
  sesi: SesiSaya;
  kelas: { id: string; level: number };
  program: Program;
  jumlahSiswa: number;
  terbuka: boolean;
  bisaMasuk: boolean;
  playbook: Playbook | null;
}

export async function ambilHalamanPlaybook(sesiId: string): Promise<DataHalamanPlaybook | null> {
  const p = await wajibPengajar();
  const daftarKelas = await ambilKelasMilikPengajar(p.id);
  const kelas = daftarKelas.find((k) => k.sesi.some((s) => s.id === sesiId));
  if (!kelas) return null;
  const sesi = kelas.sesi.find((s) => s.id === sesiId)!;
  const sekarang = new Date();
  const terbuka = bisaBukaPlaybook(sesi.mulai_pada, sekarang);
  const bisaMasuk = bisaMasukKelas(sesi.mulai_pada, sesi.selesai_pada, sesi.status, sekarang);

  let playbook: Playbook | null = null;
  if (terbuka) {
    if (pakaiMock) {
      playbook =
        playbookMock.find(
          (pb) => pb.program_id === kelas.program.id && pb.level === kelas.level && pb.nomor_sesi === sesi.nomor,
        ) ??
        playbookMock.find((pb) => pb.program_id === kelas.program.id && pb.nomor_sesi === sesi.nomor) ??
        null;
    } else {
      const supabase = await buatClientServer();
      const { data, error } = await supabase.rpc("playbook_sesi", { p_sesi_id: sesiId });
      lemparJikaError(error);
      playbook = (data as Playbook | null) ?? null;
    }
  }

  return {
    sesi,
    kelas: { id: kelas.id, level: kelas.level },
    program: kelas.program,
    jumlahSiswa: kelas.siswa.length,
    terbuka,
    bisaMasuk,
    playbook,
  };
}

export interface DataHalamanLaporan {
  sesi: SesiSaya;
  kelas: { id: string; level: number };
  program: Program;
  siswa: SiswaRingkas[];
  laporanSesi: LaporanSesi | null;
  laporanSiswa: LaporanSiswa[];
  raporJurusan: RaporJurusan[];
  bisaIsi: boolean;
  terkunci: boolean;
  wajibRapor: boolean;
}

export async function ambilHalamanLaporan(sesiId: string): Promise<DataHalamanLaporan | null> {
  const p = await wajibPengajar();
  const daftarKelas = await ambilKelasMilikPengajar(p.id);
  const kelas = daftarKelas.find((k) => k.sesi.some((s) => s.id === sesiId));
  if (!kelas) return null;
  const sesi = kelas.sesi.find((s) => s.id === sesiId)!;
  const laporanSesi = kelas.laporanBySesi[sesi.id] ?? null;

  let laporanSiswa: LaporanSiswa[] = [];
  let raporJurusan: RaporJurusan[] = [];
  if (laporanSesi) {
    if (pakaiMock) {
      const store = storeMock();
      laporanSiswa = store.laporanSiswa.filter((x) => x.laporan_sesi_id === laporanSesi.id);
      raporJurusan = store.raporJurusan.filter((x) => x.sesi_id === sesi.id);
    } else {
      const supabase = await buatClientServer();
      const [lsRes, rjRes] = await Promise.all([
        supabase.from("laporan_siswa").select("*").eq("laporan_sesi_id", laporanSesi.id),
        supabase.from("rapor_jurusan").select("*").eq("sesi_id", sesi.id),
      ]);
      lemparJikaError(lsRes.error);
      lemparJikaError(rjRes.error);
      laporanSiswa = (lsRes.data ?? []) as LaporanSiswa[];
      raporJurusan = (rjRes.data ?? []) as RaporJurusan[];
    }
  }

  const sekarang = new Date();
  return {
    sesi,
    kelas: { id: kelas.id, level: kelas.level },
    program: kelas.program,
    siswa: kelas.siswa,
    laporanSesi,
    laporanSiswa,
    raporJurusan,
    bisaIsi: bisaIsiLaporan(sesi.mulai_pada, sekarang),
    terkunci: laporanSesi ? laporanTerkunci(laporanSesi.dikirim_pada, sekarang) : false,
    wajibRapor: perluRaporJurusan(kelas.program.slug, sesi.nomor),
  };
}

export async function kirimAtauUbahLaporan(sesiId: string, data: InputLaporanForm): Promise<{ kelasId: string }> {
  const p = await wajibPengajar();
  const halaman = await ambilHalamanLaporan(sesiId);
  if (!halaman) throw new Error("TIDAK_BERHAK");
  if (!halaman.bisaIsi) throw new Error("VALIDASI_GAGAL");
  if (halaman.terkunci) throw new Error("LAPORAN_TERKUNCI");

  const pSiswa: InputLaporanSiswa[] = halaman.siswa.map((s) => {
    const masukan = data.siswa.find((x) => x.siswa_id === s.id);
    const hadir = masukan?.hadir ?? false;
    return {
      siswa_id: s.id,
      hadir,
      catatan: hadir ? (masukan?.catatan?.trim() ?? "") : null,
      karya_url: hadir && masukan?.karya_url ? masukan.karya_url.trim() : null,
    };
  });

  const hadirIds = new Set(pSiswa.filter((s) => s.hadir).map((s) => s.siswa_id));
  const pRapor: InputRaporJurusan[] | null = halaman.wajibRapor
    ? (data.rapor ?? [])
        .filter((r) => hadirIds.has(r.siswa_id))
        .map((r) => ({
          siswa_id: r.siswa_id,
          skor_software: r.skor_software,
          skor_jaringan: r.skor_jaringan,
          skor_iot: r.skor_iot,
          skor_ai_data: r.skor_ai_data,
          bidang_rekomendasi: r.bidang_rekomendasi,
          alasan: r.alasan.trim(),
          saran: r.saran.trim(),
        }))
    : null;

  if (pakaiMock) {
    const store = storeMock();
    const sekarangIso = new Date().toISOString();
    const sesi = store.sesi.find((s) => s.id === sesiId);
    if (!sesi) throw new Error("TIDAK_BERHAK");

    if (halaman.laporanSesi) {
      const ada = store.laporanSesi.find((l) => l.id === halaman.laporanSesi!.id)!;
      ada.ringkasan = data.ringkasan.trim();
      ada.rekaman_url = data.rekaman_url ? data.rekaman_url.trim() : null;
      ada.kendala = data.kendala ? data.kendala.trim() : null;
      ada.diubah_pada = sekarangIso;

      store.laporanSiswa = store.laporanSiswa.filter((x) => x.laporan_sesi_id !== ada.id);
      for (const s of pSiswa) {
        store.laporanSiswa.push({
          id: crypto.randomUUID(),
          laporan_sesi_id: ada.id,
          siswa_id: s.siswa_id,
          hadir: s.hadir,
          catatan: s.catatan ?? null,
          karya_url: s.karya_url ?? null,
        });
      }
      if (pRapor) {
        store.raporJurusan = store.raporJurusan.filter((r) => r.sesi_id !== sesiId);
        for (const r of pRapor) {
          store.raporJurusan.push({ id: crypto.randomUUID(), sesi_id: sesiId, ...r, dibuat_pada: sekarangIso });
        }
      }
    } else {
      const laporanId = crypto.randomUUID();
      store.laporanSesi.push({
        id: laporanId,
        sesi_id: sesiId,
        pengajar_id: p.id,
        ringkasan: data.ringkasan.trim(),
        rekaman_url: data.rekaman_url ? data.rekaman_url.trim() : null,
        kendala: data.kendala ? data.kendala.trim() : null,
        dikirim_pada: sekarangIso,
        diubah_pada: null,
      });
      for (const s of pSiswa) {
        store.laporanSiswa.push({
          id: crypto.randomUUID(),
          laporan_sesi_id: laporanId,
          siswa_id: s.siswa_id,
          hadir: s.hadir,
          catatan: s.catatan ?? null,
          karya_url: s.karya_url ?? null,
        });
      }
      if (pRapor) {
        for (const r of pRapor) {
          store.raporJurusan.push({ id: crypto.randomUUID(), sesi_id: sesiId, ...r, dibuat_pada: sekarangIso });
        }
      }
      sesi.status = "selesai";
      if (!store.honor.some((h) => h.sesi_id === sesiId)) {
        store.honor.push({
          id: crypto.randomUUID(),
          pengajar_id: p.id,
          sesi_id: sesiId,
          jumlah: halaman.program.honor_per_sesi,
          status: "belum_dibayar",
          dibayar_pada: null,
          dibayar_oleh: null,
        });
      }
      if (sesi.nomor === 4) {
        for (const b of store.booking) {
          if (b.kelas_id === halaman.kelas.id && b.status === "terkonfirmasi") b.status = "selesai";
        }
      }
      for (const st of halaman.siswa) {
        const barisSiswa = store.siswa.find((x) => x.id === st.id);
        const penerima: { id: string; prefix: string }[] = [];
        if (barisSiswa?.orang_tua_id) penerima.push({ id: barisSiswa.orang_tua_id, prefix: "/orang-tua" });
        if (barisSiswa?.pengguna_id) penerima.push({ id: barisSiswa.pengguna_id, prefix: "/siswa" });
        for (const target of penerima) {
          store.notifikasi.push({
            id: crypto.randomUUID(),
            pengguna_id: target.id,
            tipe: "laporan_dikirim",
            judul: `Laporan baru dari ${p.nama}`,
            isi: `Laporan ${halaman.program.nama} Sesi ${sesi.nomor} untuk ${st.nama} sudah tersedia.`,
            tautan: `${target.prefix}/sesi/${sesiId}`,
            dibaca_pada: null,
            dibuat_pada: sekarangIso,
          });
        }
      }
    }
    return { kelasId: halaman.kelas.id };
  }

  const supabase = await buatClientServer();
  const rpc = halaman.laporanSesi ? "ubah_laporan" : "kirim_laporan";
  const { error } = await supabase.rpc(rpc, {
    p_sesi_id: sesiId,
    p_ringkasan: data.ringkasan.trim(),
    p_rekaman_url: data.rekaman_url ? data.rekaman_url.trim() : null,
    p_kendala: data.kendala ? data.kendala.trim() : null,
    p_siswa: pSiswa,
    p_rapor: pRapor,
  });
  lemparJikaError(error);
  return { kelasId: halaman.kelas.id };
}

export interface ItemHonorRinci {
  honor: Honor;
  programNama: string;
  programSlug: string;
  level: number;
  kelasId: string;
  nomorSesi: number;
  mulaiPada: string;
}

export interface DataPenghasilan {
  bulanIni: number;
  belumDibayar: number;
  daftar: ItemHonorRinci[];
}

export async function ambilPenghasilanPengajar(): Promise<DataPenghasilan> {
  const p = await wajibPengajar();
  const daftarKelas = await ambilKelasMilikPengajar(p.id);
  let daftarHonor: Honor[];

  if (pakaiMock) {
    daftarHonor = storeMock().honor.filter((h) => h.pengajar_id === p.id);
  } else {
    const supabase = await buatClientServer();
    const { data, error } = await supabase.from("honor").select("*").eq("pengajar_id", p.id);
    lemparJikaError(error);
    daftarHonor = (data ?? []) as Honor[];
  }

  const sesiMap = new Map<string, { kelas: KelasPengajarRinci; sesi: SesiSaya }>();
  for (const k of daftarKelas) {
    for (const s of k.sesi) sesiMap.set(s.id, { kelas: k, sesi: s });
  }

  const daftar: ItemHonorRinci[] = daftarHonor
    .map((honor) => {
      const info = sesiMap.get(honor.sesi_id);
      if (!info) return null;
      return {
        honor,
        programNama: info.kelas.program.nama,
        programSlug: info.kelas.program.slug,
        level: info.kelas.level,
        kelasId: info.kelas.id,
        nomorSesi: info.sesi.nomor,
        mulaiPada: info.sesi.mulai_pada,
      };
    })
    .filter((x): x is ItemHonorRinci => Boolean(x))
    .sort((a, b) => b.mulaiPada.localeCompare(a.mulaiPada));

  const ringkas = ringkasHonor(
    daftar.map((d) => ({ jumlah: d.honor.jumlah, status: d.honor.status, waktu: d.mulaiPada })),
    new Date(),
  );

  return { ...ringkas, daftar };
}

export interface RingkasanDashboardPengajar {
  pengguna: Pengguna;
  profil: ProfilPengajar | null;
  pengingatLaporan: { kelasId: string; programNama: string; level: number; sesi: SesiSaya }[];
  sesiBerikutnya: {
    kelasId: string;
    programNama: string;
    programSlug: string;
    level: number;
    jumlahSiswa: number;
    sesi: SesiSaya;
    adaLaporan: boolean;
    bisaMasuk: boolean;
    bisaPlaybook: boolean;
    bisaLaporan: boolean;
  }[];
  jumlahKelas: number;
  honorBulanIni: number;
  honorBelumDibayar: number;
}

export async function ambilRingkasanPengajar(): Promise<RingkasanDashboardPengajar> {
  const [profilLengkap, daftarKelas, penghasilan] = await Promise.all([
    ambilProfilLengkapPengajar(),
    ambilDaftarKelasPengajar(),
    ambilPenghasilanPengajar(),
  ]);
  const sekarang = new Date();

  const pengingatLaporan: RingkasanDashboardPengajar["pengingatLaporan"] = [];
  const sesiBerikutnya: RingkasanDashboardPengajar["sesiBerikutnya"] = [];

  for (const k of daftarKelas) {
    for (const s of k.sesi) {
      const adaLaporan = Boolean(k.laporanBySesi[s.id]);
      if (perluPengingatLaporan(s.selesai_pada, s.status, adaLaporan, sekarang)) {
        pengingatLaporan.push({ kelasId: k.id, programNama: k.program.nama, level: k.level, sesi: s });
      }
      const sedangAktif = bisaMasukKelas(s.mulai_pada, s.selesai_pada, s.status, sekarang);
      const akanDatang = s.status === "terjadwal" && new Date(s.selesai_pada) >= sekarang;
      const butuhLaporan = !adaLaporan && bisaIsiLaporan(s.mulai_pada, sekarang) && s.status !== "dibatalkan";
      if (sedangAktif || akanDatang || butuhLaporan) {
        sesiBerikutnya.push({
          kelasId: k.id,
          programNama: k.program.nama,
          programSlug: k.program.slug,
          level: k.level,
          jumlahSiswa: k.siswa.length,
          sesi: s,
          adaLaporan,
          bisaMasuk: sedangAktif,
          bisaPlaybook: bisaBukaPlaybook(s.mulai_pada, sekarang),
          bisaLaporan: bisaIsiLaporan(s.mulai_pada, sekarang),
        });
      }
    }
  }

  sesiBerikutnya.sort((a, b) => a.sesi.mulai_pada.localeCompare(b.sesi.mulai_pada));

  return {
    pengguna: profilLengkap.pengguna,
    profil: profilLengkap.profil,
    pengingatLaporan,
    sesiBerikutnya: sesiBerikutnya.slice(0, 5),
    jumlahKelas: daftarKelas.length,
    honorBulanIni: penghasilan.bulanIni,
    honorBelumDibayar: penghasilan.belumDibayar,
  };
}
