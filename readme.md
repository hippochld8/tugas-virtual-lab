# AlgoLab: Virtual Lab Berpikir Komputasional

Virtual lab berbasis web untuk memvisualisasikan algoritma dan empat pilar berpikir komputasional. Dibuat untuk tugas Virtual Lab mata kuliah TPB ITB. Seluruh logika berjalan di browser (frontend), tanpa server.

## Deskripsi singkat

Berpikir komputasional sering terasa abstrak jika hanya dibaca. AlgoLab membuat konsepnya bisa dicoba langsung: pengguna mengubah parameter, menjalankan algoritma, lalu mengamati setiap langkahnya pada canvas. Target pengguna adalah mahasiswa TPB yang baru mengenal algoritma.

## Fitur

### 1. Visualisasi pengurutan
- Lima algoritma: Bubble, Selection, Insertion, Quick, dan Merge sort
- Jumlah data (8 sampai 100) dan kecepatan dapat diatur
- Tombol mulai, jeda, lanjut, dan acak data
- Penghitung perbandingan serta operasi tukar atau tulis secara langsung
- Panel penjelasan dan kompleksitas waktu tiap algoritma
- Seret di kanvas untuk menggambar data sendiri, serta opsi suara nada
- Efek konfeti saat kuis empat pilar dijawab benar semua

### 2. Pencarian jalur
- Tiga algoritma: BFS, DFS, dan A*
- Gambar dinding dengan klik atau seret
- Pindahkan titik A (awal) dan B (tujuan) dengan drag
- Dinding acak, hapus jejak, dan kosongkan kisi
- Hasil berupa panjang jalur dan jumlah sel yang dikunjungi

### 3. Balapan pencarian
- Adu pencarian linear dan biner pada data terurut, lengkap dengan hitungan langkah
- Klik kotak untuk memilih target, jumlah data dapat diatur sampai 120

### 4. Cocokkan empat pilar
- Seret nama pilar (dekomposisi, pengenalan pola, abstraksi, algoritma) ke situasi yang sesuai
- Mendukung layar sentuh lewat ketuk pilar lalu ketuk situasinya
- Pemeriksaan jawaban dengan skor

## Penerapan kriteria penilaian

| Kriteria | Penerapan |
|---|---|
| Fitur HTML5 | Elemen semantik (`header`, `nav`, `main`, `section`, `figure`, `aside`, `details`, `footer`), `canvas`, Drag and Drop API, `input type="range"`, `output` |
| Kreativitas CSS | Glassmorphism minimalis, palet `#000957` `#344CB7` `#577BC1` `#FFEB00`, font Outfit dan Montserrat, layout responsif dengan grid, mode gelap, dukungan `prefers-reduced-motion` |
| Kompleksitas JavaScript | Algoritma berbasis generator agar dapat dijalankan bertahap dan dijeda, rendering canvas, pointer events, state management, animasi dengan timer |

## Struktur berkas

```
tugas-virtual-lab/
├── index.html   # struktur halaman
├── style.css    # tampilan dan responsivitas
├── script.js    # logika algoritma dan interaksi
└── README.md
```

## Cara menjalankan

1. Clone repositori: `git clone https://github.com/hippochld8/tugas-virtual-lab.git`
2. Buka `index.html` di browser modern (Chrome, Edge, Firefox, atau Safari)

Koneksi internet hanya diperlukan untuk memuat font dari Google Fonts.

## Teknologi

HTML5, CSS3, dan JavaScript (ES6+) murni, tanpa framework dan tanpa library tambahan.