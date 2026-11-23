/** Kode contoh Kodie Lab. Dipakai saat pertama membuka Lab dan saat tombol "Kembalikan contoh" ditekan. */

export const CONTOH_HTML = `<main class="kartu">
  <h1>Halo, aku Kiko! 👋</h1>
  <p>Ubah teks ini, lalu klik <strong>Jalankan</strong>.</p>
  <button id="tombol">Klik aku</button>
  <p id="hitung">Kamu belum mengeklik.</p>
</main>
`;

export const CONTOH_CSS = `body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #1d4ed8, #60a5fa);
}

.kartu {
  background: white;
  padding: 32px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
}

button {
  background: #c6f64d;
  border: none;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}
`;

export const CONTOH_JS = `let jumlah = 0;
const tombol = document.getElementById("tombol");
const hitung = document.getElementById("hitung");

tombol.addEventListener("click", () => {
  jumlah = jumlah + 1;
  hitung.textContent = "Kamu sudah mengeklik " + jumlah + " kali.";
  console.log("Klik ke-" + jumlah);
});

console.log("Halaman siap!");
`;

export const CONTOH_PYTHON = `# Selamat datang di Kodie Lab!
# Ubah kodenya, lalu klik Jalankan (atau tekan Ctrl + Enter).

nama = "Kiko"
print(f"Halo, {nama}! 🤖")

# Perulangan: tabel perkalian 7
for i in range(1, 6):
    print(f"7 x {i} = {7 * i}")

# Fungsi sederhana
def rata_rata(angka):
    return sum(angka) / len(angka)

nilai = [80, 92, 75, 88]
print("Rata-rata nilai:", rata_rata(nilai))
`;
