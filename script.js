import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvco9APepbM1YRhDLGzE2uxFBVtLL2NLs",
  authDomain: "fauz2327-b8dfa.firebaseapp.com",
  databaseURL: "https://fauz2327-b8dfa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fauz2327-b8dfa",
  storageBucket: "fauz2327-b8dfa.firebasestorage.app",
  messagingSenderId: "625104866445",
  appId: "1:625104866445:web:129165fbc539edb36466c4"
};

const WHATSAPP_NUMBER = "6281554041777";
const MAPS_URL = "https://maps.app.goo.gl/Sqf951NhZioxFuC2A";
const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxWfHVxDop4n8SqwP1vxGLj1D4jnTe7_iTrqGJ4bm9dDW0BiDDSxOPpy7X5Dcvb1dEa/exec";
const MINIMUM_CHECKOUT = 50000;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firebaseDB = getDatabase(app);

let produk = [];
let kategoriAktif = "Semua";
let cart = [];
let selectedProduct = null;
let lokasiUser = "";
let toastTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  loadProduk();
  renderKategori();
  renderProduk();
  toggleQR();
  updateCart();
});

function byId(id) {
  return document.getElementById(id);
}

function productKey(item) {
  return String(item.id ?? item.firebaseKey ?? "");
}

function normalizeProduk(key, value) {
  const item = value || {};

  return {
    ...item,
    firebaseKey: key,
    id: item.id ?? key,
    nama: item.nama || "Produk tanpa nama",
    kategori: item.kategori || "Lainnya",
    harga: Number(item.harga || 0),
    stok: Number(item.stok || 0)
  };
}

function formatRupiah(angka) {
  return Number(angka || 0).toLocaleString("id-ID");
}

function setPopupState(id, open) {
  const popup = byId(id);

  if (!popup) return;

  popup.classList.toggle("active", open);
  popup.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.classList.toggle("popup-open", open);
}

function loadProduk() {
  onValue(ref(firebaseDB, "produk"), (snapshot) => {
    const data = snapshot.val();

    console.log("DATA PRODUK:", data);

    produk = data
      ? Object.entries(data).map(([key, value]) => ({
          firebaseKey: key,
          id: key,
          nama: value.nama || "",
          harga: Number(value.harga || 0),
          stok: Number(value.stok || 0),
          kategori: value.kategori || "Lainnya"
        }))
      : [];

    console.log("HASIL ARRAY:", produk);

    renderKategori();
    renderProduk();
  });
}

  onValue(
    ref(firebaseDB),
    (snapshot) => {
      const data = snapshot.val();

      produk = data
        ? Object.entries(data).map(([key, value]) => normalizeProduk(key, value))
        : [];

      renderKategori();
      renderProduk();
    },
    (error) => {
      console.log("Gagal memuat produk:", error);
      produk = [];
      renderKategori();
      renderProduk("Gagal memuat produk. Coba refresh halaman.");
    }
  );
}

function renderKategori() {
  const kategoriLists = [
    byId("kategoriList"),
    byId("kategoriListSidebar")
  ].filter(Boolean);

  const kategoriUnik = [
    "Semua",
    ...new Set(produk.map((item) => item.kategori || "Lainnya"))
  ];

  kategoriLists.forEach((container) => {
    container.innerHTML = "";

    kategoriUnik.forEach((kategori) => {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = kategori;
      button.classList.toggle("active", kategori === kategoriAktif);
      button.addEventListener("click", () => pilihKategori(kategori));

      container.appendChild(button);
    });
  });
}

window.filterKategori = function(kategori) {
  kategoriAktif = kategori;
  renderKategori();
  renderProduk();
};

window.pilihKategori = function(kategori) {
  window.filterKategori(kategori);
  closeSidebar();
};

window.renderProduk = function(message) {
  const list = byId("productList");
  const searchInput = byId("searchInput");

  if (!list) return;

  const search = (searchInput?.value || "").trim().toLowerCase();
  const filtered = produk.filter((item) => {
    const cocokKategori = kategoriAktif === "Semua" || item.kategori === kategoriAktif;
    const nama = String(item.nama || "").toLowerCase();
    const kategori = String(item.kategori || "").toLowerCase();
    const cocokSearch = nama.includes(search) || kategori.includes(search);

    return cocokKategori && cocokSearch;
  });

  list.innerHTML = "";

  if (message) {
    list.innerHTML = `<div class="empty-state">${message}</div>`;
    return;
  }

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">Produk tidak ditemukan.</div>';
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("button");
    const stokHabis = Number(item.stok) <= 0;

    card.type = "button";
    card.className = `produk-card${stokHabis ? " produk-habis" : ""}`;
    card.addEventListener("click", () => openPopup(productKey(item)));

    const meta = document.createElement("div");
    meta.className = "produk-left";

    const kategori = document.createElement("div");
    kategori.className = "produk-kategori";
    kategori.textContent = item.kategori;

    const stok = document.createElement("div");
    stok.className = "produk-stok";
    stok.textContent = stokHabis ? "Stok habis" : `Stok: ${item.stok}`;

    const nama = document.createElement("div");
    nama.className = "produk-nama";
    nama.textContent = item.nama;

    const harga = document.createElement("div");
    harga.className = "produk-harga";
    harga.textContent = `Rp ${formatRupiah(item.harga)}`;

    meta.append(kategori, stok);
    card.append(meta, nama, harga);
    list.appendChild(card);
  });
};

window.openPopup = function(id) {
  selectedProduct = produk.find((item) => productKey(item) === String(id));

  if (!selectedProduct) return;

  if (Number(selectedProduct.stok) <= 0) {
    showToast("Stok habis");
    return;
  }

  byId("popupNama").textContent = selectedProduct.nama;
  byId("popupHarga").textContent = `Rp ${formatRupiah(selectedProduct.harga)}`;
  byId("popupQty").value = 1;

  setPopupState("popupBox", true);
};

window.closePopup = function() {
  setPopupState("popupBox", false);
};

window.popupTambah = function() {
  const qty = byId("popupQty");
  const jumlah = Number(qty.value || 1);
  const stok = Number(selectedProduct?.stok || 0);

  if (jumlah >= stok) {
    showToast(`Stok hanya tersisa ${stok}`);
    return;
  }

  qty.value = jumlah + 1;
};

window.popupKurang = function() {
  const qty = byId("popupQty");
  const jumlah = Number(qty.value || 1);

  qty.value = Math.max(jumlah - 1, 1);
};

window.confirmAddCart = function() {
  if (!selectedProduct) return;

  const qty = Math.max(Number(byId("popupQty").value || 1), 1);
  const stok = Number(selectedProduct.stok || 0);
  const existing = cart.find((item) => productKey(item) === productKey(selectedProduct));

  if (qty > stok) {
    showToast("Jumlah melebihi stok");
    return;
  }

  if (existing) {
    const totalQty = existing.qty + qty;

    if (totalQty > stok) {
      existing.qty = stok;
      showToast(`Maksimal stok hanya ${stok}`);
    } else {
      existing.qty = totalQty;
    }
  } else {
    cart.push({
      ...selectedProduct,
      qty
    });
  }

  updateCart();
  closePopup();
  showToast(`${selectedProduct.nama} ditambahkan ke keranjang`);
};

window.clearSearch = function() {
  const input = byId("searchInput");

  if (!input) return;

  input.value = "";
  renderProduk();
};

window.toggleCart = function() {
  byId("cartBox")?.classList.toggle("active");
};

window.toggleQR = function() {
  const pembayaran = byId("pembayaran");
  const qr = byId("qrBox");

  if (!pembayaran || !qr) return;

  qr.hidden = pembayaran.value !== "Transfer";
};

window.toggleMetode = function() {
  const btnWA = byId("btnWA");

  if (!btnWA) return;

  btnWA.disabled = cart.length === 0;
};

function updateCart() {
  const menuCart = document.querySelector(".menu-cart");
  const cartBox = byId("cartItems");
  const totalBox = byId("cartTotal");
  const bottomCount = byId("bottomCartCount");
  const btnWA = byId("btnWA");

  if (!cartBox) return;

  cartBox.innerHTML = "";

  if (bottomCount) {
    bottomCount.textContent = cart.length;
  }

  if (menuCart) {
    menuCart.classList.toggle("active", cart.length > 0);
  }

  if (btnWA) {
    btnWA.disabled = cart.length === 0;
  }

  if (cart.length === 0) {
    cartBox.innerHTML = '<div class="empty-cart">Keranjang masih kosong.</div>';

    if (totalBox) {
      totalBox.innerHTML = "";
    }

    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = Number(item.harga || 0) * Number(item.qty || 0);
    total += subtotal;

    const row = document.createElement("div");
    row.className = "cart-item";

    const details = document.createElement("div");

    const title = document.createElement("h4");
    title.textContent = item.nama;

    const info = document.createElement("p");
    info.textContent = `${item.qty} x Rp ${formatRupiah(item.harga)}`;

    const price = document.createElement("b");
    price.textContent = `Rp ${formatRupiah(subtotal)}`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn-hapus-modern";
    remove.textContent = "Hapus";
    remove.addEventListener("click", () => hapusCart(index));

    details.append(title, info);
    row.append(details, price, remove);
    cartBox.appendChild(row);
  });

  if (totalBox) {
    const kurang = MINIMUM_CHECKOUT - total;
    const alertClass = kurang > 0 ? "cart-alert-warning" : "cart-alert-success";
    const alertText = kurang > 0
      ? `Belanja kurang Rp ${formatRupiah(kurang)} lagi untuk checkout.`
      : "Checkout WhatsApp tersedia.";

    totalBox.innerHTML = `
      <div class="cart-total-amount">
        <span>Total</span>
        <strong>Rp ${formatRupiah(total)}</strong>
      </div>
      <div class="cart-alert ${alertClass}">${alertText}</div>
    `;
  }
}

window.hapusCart = function(index) {
  cart.splice(index, 1);
  updateCart();
};

async function kirimRekap(nama, pengiriman, pembayaran, total, items) {
  const data = {
    nama,
    pengiriman,
    pembayaran,
    total,
    lokasi: lokasiUser,
    items: items.map((item) => ({
      nama: item.nama,
      qty: item.qty,
      harga: item.harga,
      subtotal: Number(item.harga || 0) * Number(item.qty || 0)
    }))
  };

  try {
    await fetch(SHEETS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.log("Gagal kirim rekap:", error);
  }
}

window.checkoutWA = async function() {
  const btn = byId("btnWA");
  const namaInput = byId("namaPemesan");
  const warningNama = byId("warningNama");
  const nama = (namaInput?.value || "").trim();
  const pembayaran = byId("pembayaran")?.value || "COD";
  const pengiriman = byId("pengiriman")?.value || "Diantar";

  if (!btn || btn.disabled) return;

  btn.disabled = true;
  btn.textContent = "Mengirim...";

  if (warningNama) {
    warningNama.hidden = Boolean(nama);
  }

  if (!nama) {
    showToast("Nama wajib diisi");
    btn.disabled = cart.length === 0;
    btn.textContent = "Pesan via WhatsApp";
    namaInput?.focus();
    return;
  }

  if (cart.length === 0) {
    showToast("Keranjang kosong");
    btn.disabled = true;
    btn.textContent = "Pesan via WhatsApp";
    return;
  }

  const totalBelanja = cart.reduce(
    (total, item) => total + Number(item.harga || 0) * Number(item.qty || 0),
    0
  );

  if (totalBelanja < MINIMUM_CHECKOUT) {
    showToast(`Minimal checkout Rp ${formatRupiah(MINIMUM_CHECKOUT)}`);
    btn.disabled = false;
    btn.textContent = "Pesan via WhatsApp";
    return;
  }

  if (pengiriman === "Diantar") {
    const izinLokasi = await ambilLokasiUser();

    if (!izinLokasi) {
      btn.disabled = false;
      btn.textContent = "Pesan via WhatsApp";
      return;
    }
  }

  const lines = [
    "*PESANAN BARU*",
    "",
    `Nama: ${nama}`,
    `Pembayaran: ${pembayaran}`,
    `Pengiriman: ${pengiriman}`,
    "",
    "*RINCIAN PESANAN*"
  ];

  cart.forEach((item) => {
    const subtotal = Number(item.harga || 0) * Number(item.qty || 0);

    lines.push(
      "",
      `- ${item.nama}`,
      `${item.qty} x Rp ${formatRupiah(item.harga)}`,
      `Subtotal: Rp ${formatRupiah(subtotal)}`
    );
  });

  lines.push("", `TOTAL: Rp ${formatRupiah(totalBelanja)}`);

  if (lokasiUser) {
    lines.push("", `Lokasi: ${lokasiUser}`);
  }

  lines.push("", "Terima kasih.");

  await kirimRekap(nama, pengiriman, pembayaran, totalBelanja, cart);
  await kurangiStockCheckout();

  cart = [];
  updateCart();

  window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

  setTimeout(() => {
    btn.disabled = cart.length === 0;
    btn.textContent = "Pesan via WhatsApp";
  }, 1200);
};

async function kurangiStockCheckout() {
  for (const itemCart of cart) {
    const indexProduk = produk.findIndex((item) => productKey(item) === productKey(itemCart));

    if (indexProduk === -1) continue;

    const stokSekarang = Number(produk[indexProduk].stok || 0);
    const stokBaru = Math.max(stokSekarang - Number(itemCart.qty || 0), 0);

    await set(
      ref(firebaseDB, `${produk[indexProduk].firebaseKey}/stok`),
      stokBaru
    );

    produk[indexProduk].stok = stokBaru;
  }
}

window.resetCart = function() {
  if (cart.length === 0) {
    showToast("Keranjang sudah kosong");
    return;
  }

  if (!confirm("Yakin ingin mengosongkan keranjang?")) return;

  cart = [];
  updateCart();
  showToast("Keranjang dikosongkan");
};

window.toggleSidebar = function() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  if (!sidebar || !overlay) return;

  const active = !sidebar.classList.contains("active");

  sidebar.classList.toggle("active", active);
  overlay.classList.toggle("active", active);
};

window.closeSidebar = function() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  sidebar?.classList.remove("active");
  overlay?.classList.remove("active");
};

window.bukaLokasiPopup = function() {
  setPopupState("popupLokasi", true);
};

window.tutupPopupLokasi = function() {
  setPopupState("popupLokasi", false);
};

window.bukaMaps = function() {
  window.open(MAPS_URL, "_blank", "noopener");
  tutupPopupLokasi();
};

async function ambilLokasiUser() {
  if (!navigator.geolocation) {
    showToast("Browser tidak mendukung lokasi");
    return false;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        lokasiUser = `https://www.google.com/maps?q=${lat},${lng}`;
        resolve(true);
      },
      (error) => {
        if (error.code === 1) {
          showToast("Aktifkan lokasi untuk checkout");
        } else {
          showToast("Gagal mengambil lokasi");
        }

        resolve(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

window.openBantuan = function() {
  setPopupState("popupBantuan", true);
};

window.closeBantuan = function() {
  setPopupState("popupBantuan", false);
};

window.showToast = function(text) {
  const toast = byId("toast");

  if (!toast) return;

  window.clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.add("show");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
};
