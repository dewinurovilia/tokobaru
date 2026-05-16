/* =========================
FIREBASE IMPORT
========================= */

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

/* =========================
CONFIG FIREBASE
========================= */

const firebaseConfig = {

apiKey: "AIzaSyCvco9APepbM1YRhDLGzE2uxFBVtLL2NLs",
authDomain: "fauz2327-b8dfa.firebaseapp.com",
databaseURL: "https://fauz2327-b8dfa-default-rtdb.asia-southeast1.firebasedatabase.app",
projectId: "fauz2327-b8dfa",
storageBucket: "fauz2327-b8dfa.firebasestorage.app",
messagingSenderId: "625104866445",
appId: "1:625104866445:web:129165fbc539edb36466c4",

};

/* =========================
INIT FIREBASE
========================= */

const app = !getApps().length
? initializeApp(firebaseConfig)
: getApp();

const firebaseDB =
getDatabase(app);

/* =========================
TOKO DEFANA FULL SCRIPT
========================= */

let produk = [];
let kategoriAktif = 'Semua';
let cart = [];
let selectedProduct = null;

/* =========================
LOAD AWAL
========================= */

document.addEventListener('DOMContentLoaded', () => {

loadProduk();

toggleQR();

updateCart();

toggleMetode();

});

/* =========================
LOAD PRODUK FIREBASE
========================= */

function loadProduk(){

const produkRef =
ref(firebaseDB);

onValue(produkRef,(snapshot)=>{

const data = snapshot.val();

if(!data){

console.log('Data kosong');

return;

}

/* FILTER HANYA PRODUK */

produk =
Object.values(data).filter(item =>

item &&
item.nama

);

renderKategori();

renderProduk();

});

}

/* =========================
RENDER KATEGORI
========================= */

function renderKategori(){

const kategoriList =
document.getElementById('kategoriList');

if(!kategoriList) return;

const kategoriUnik = [

'Semua',

...new Set(
produk.map(item =>
item.kategori || 'Lainnya'
))

];

kategoriList.innerHTML='';

kategoriUnik.forEach(kat=>{

kategoriList.innerHTML += `

<button onclick="filterKategori('${kat}')">

${kat}

</button>

`;

});

}

/* =========================
FILTER KATEGORI
========================= */

window.filterKategori = function(kat){

kategoriAktif = kat;

renderProduk();

}

/* =========================
RENDER PRODUK
========================= */

function renderProduk(){

const list =
document.getElementById('productList');

if(!list) return;

const searchInput =
document.getElementById('searchInput');

const search =
searchInput
? searchInput.value.toLowerCase()
: '';

list.innerHTML='';

const filtered =
produk.filter(item=>{

const cocokKategori =

kategoriAktif==='Semua'
||
item.kategori===kategoriAktif;

const cocokSearch =

item.nama
.toLowerCase()
.includes(search);

return cocokKategori && cocokSearch;

});

if(filtered.length===0){

list.innerHTML = `

<p style="padding:20px;">

Produk tidak ditemukan

</p>

`;

return;

}

filtered.forEach(item=>{

list.innerHTML += `

<div class="produk-row">

<div class="kategori-badge">

${item.kategori || 'Produk'}

</div>

<div class="produk-info">

<h3>${item.nama}</h3>

<div class="price">

Rp ${Number(item.harga).toLocaleString()}

</div>

<div class="stok-produk">

📦 Stock : ${item.stok || 0}

</div>

${Number(item.stok) <= 0

? `

<button
class="btn-stok-habis"
disabled>

❌ STOK HABIS

</button>

`

: `

<button
class="btn-cart-modern"
onclick="openPopup('${item.id}')">

🛒 Tambah Keranjang

</button>

`

}

</div>

</div>

`;

});

}

/* =========================
POPUP PRODUK
========================= */

window.openPopup = function(id){

selectedProduct =
produk.find(
p => p.id == id
);

if(!selectedProduct){
return;
}

if(Number(selectedProduct.stok) <= 0){

showToast('Stok habis');

return;

}

document.getElementById(
'popupNama'
).innerHTML =
selectedProduct.nama;

document.getElementById(
'popupHarga'
).innerHTML =

'Rp ' +
Number(
selectedProduct.harga
).toLocaleString();

document.getElementById(
'popupQty'
).value = 1;

document.getElementById(
'popupBox'
).classList.add('active');

}

/* =========================
TUTUP POPUP
========================= */

window.closePopup = function(){

document.getElementById(
'popupBox'
).classList.remove('active');

}

/* =========================
QTY +
========================= */

window.popupTambah = function(){

const qty =
document.getElementById(
'popupQty'
);

const jumlah =
parseInt(qty.value);

const stok =
parseInt(selectedProduct.stok || 0);

if(jumlah >= stok){

showToast(
'Stock hanya tersisa ' + stok
);

return;

}

qty.value = jumlah + 1;

}

/* =========================
QTY -
========================= */

window.popupKurang = function(){

const qty =
document.getElementById(
'popupQty'
);

if(qty.value > 1){

qty.value--;

}

}

/* =========================
CONFIRM TAMBAH CART
========================= */

window.confirmAddCart = function(){

const qty =
parseInt(
document.getElementById(
'popupQty'
).value
);

const stok =
parseInt(
selectedProduct.stok || 0
);

const existing =
cart.find(
i => i.id == selectedProduct.id
);

if(qty > stok){

showToast(
'Jumlah melebihi stock'
);

return;

}

if(existing){

const totalQty =
existing.qty + qty;

if(totalQty > stok){

showToast(
'Stock tidak cukup'
);

return;

}

existing.qty += qty;

}else{

cart.push({

...selectedProduct,

qty:qty

});

}

updateCart();

toggleMetode();

closePopup();

showToast(
selectedProduct.nama +
' ditambahkan ke keranjang'
);

}
