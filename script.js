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

import {
getAuth,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

const auth = getAuth(app);

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

produk = Object.values(data);

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

window.renderProduk = function(){

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

/* FILTER KATEGORI */

const cocokKategori =

kategoriAktif === 'Semua'
||
(item.kategori || '') === kategoriAktif;

/* FILTER PENCARIAN */

const nama =
(item.nama || '')
.toLowerCase();

const kategori =
(item.kategori || '')
.toLowerCase();

const cocokSearch =

nama.includes(search)
||
kategori.includes(search);

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

<div class="product-card">

<div class="product-info">

<div class="product-category">
${item.kategori || 'Produk'}
</div>

<div class="product-name">
${item.nama}
</div>

<div class="product-detail">
Stock : ${item.stok || 0}
</div>

<div class="product-price">
Rp ${Number(item.harga).toLocaleString()}
</div>

</div>

${Number(item.stok) <= 0

? `

<button
class="btn-stok-habis"
disabled>

Habis

</button>

`

: `

<button
class="buy-btn"
onclick="openPopup('${item.id}')">

+

</button>

`

}

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
</button>

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

/* =========================
VALIDASI STOCK
========================= */

if(qty > stok){

showToast(
'Jumlah melebihi stock'
);

return;

}

/* =========================
JIKA SUDAH ADA DI CART
========================= */

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

/* =========================
CLEAR SEARCH
========================= */

window.clearSearch = function(){

document.getElementById(
'searchInput'
).value='';

renderProduk();

}

/* =========================
TOGGLE CART
========================= */

window.toggleCart = function(){

document
.getElementById('cartBox')
.classList
.toggle('active');

}

/* =========================
TOGGLE QR
========================= */

window.toggleQR = function(){

const pembayaran =
document.getElementById('pembayaran');

const qr =
document.getElementById('qrBox');

if(!pembayaran || !qr) return;

if(pembayaran.value==='Transfer'){

qr.style.display='block';

}else{

qr.style.display='none';

}

}

function updateCart(){

const cartBox =
document.getElementById('cartItems');

const totalBox =
document.getElementById('cartTotal');

const countBox =
document.getElementById('cartCount');

if(!cartBox) return;

cartBox.innerHTML = '';

let total = 0;

if(cart.length===0){

cartBox.innerHTML =
'<p>Keranjang kosong</p>';

if(totalBox){
totalBox.innerHTML='';
}

if(countBox){
countBox.innerHTML='0';
}

return;

}

cart.forEach((item,index)=>{

const subtotal =
item.harga * item.qty;

total += subtotal;

cartBox.innerHTML += `

<div class="cart-item">

<h4>${item.nama}</h4>

<p>
${item.qty} x
Rp ${Number(item.harga).toLocaleString()}
</p>

<b>
Rp ${subtotal.toLocaleString()}
</b>

<br><br>

<button
class="btn-hapus-modern"
onclick="hapusCart(${index})">

🗑 Hapus

</button>

</div>

`;

});

/* TOTAL */

if(totalBox){

let warning = '';

if(total < 50000){

const kurang = 50000 - total;

warning = `

<div style="
margin-top:10px;
padding:10px;
background:#ffebeb;
color:#d60000;
border-radius:8px;
font-size:14px;
font-weight:bold;
">

⚠️ Belanja kurang Rp${kurang.toLocaleString()}
lagi untuk checkout WA dan diantar

</div>

`;

}else{

warning = `

<div style="
margin-top:10px;
padding:10px;
background:#e8fff0;
color:#009944;
border-radius:8px;
font-size:14px;
font-weight:bold;
">

✅ Checkout WhatsApp tersedia

</div>

`;

}

totalBox.innerHTML =

'Total : Rp ' +
total.toLocaleString()
+ warning;

}

/* JUMLAH CART */

if(countBox){

countBox.innerHTML =
cart.length;

}

}
/* =========================
HAPUS CART
========================= */

window.hapusCart = function(index){

cart.splice(index,1);

updateCart();

toggleMetode();

}

/* =========================
KIRIM REKAP GOOGLE SHEET
========================= */

async function kirimRekap(
nama,
pengiriman,
pembayaran,
total,
items
){

const data={

nama:nama,
pengiriman:pengiriman,
pembayaran:pembayaran,
total:total,
items:items

};

try{

await fetch(

'https://script.google.com/macros/s/AKfycbxWfHVxDop4n8SqwP1vxGLj1D4jnTe7_iTrqGJ4bm9dDW0BiDDSxOPpy7X5Dcvb1dEa/exec',

{
method:'POST',
mode:'no-cors',

headers:{
'Content-Type':'text/plain'
},

body:JSON.stringify(data)

}

);

console.log(
'Rekap berhasil dikirim'
);

}catch(error){

console.log(
'Error kirim rekap:',
error
);

}

}

/* =========================
TOGGLE METODE
========================= */

window.toggleMetode = function(){

const pengiriman =
document.getElementById(
'pengiriman'
);

const btnWA =
document.getElementById(
'btnWA'
);

const btnStruk =
document.getElementById(
'btnStruk'
);

const passwordBox =
document.getElementById(
'passwordStrukBox'
);

if(
!pengiriman ||
!btnWA ||
!btnStruk ||
!passwordBox
) return;

btnWA.style.display='none';

btnStruk.style.display='none';

passwordBox.style.display='none';

if(cart.length===0){
return;
}

if(
pengiriman.value==='Diantar'
){

btnWA.style.display='flex';

}

if(
pengiriman.value==='Ambil Sendiri'
){

passwordBox.style.display='block';

}

}

window.cekPasswordStruk = async function(){

const password =
document.getElementById(
'passwordStruk'
).value;

/* EMAIL ADMIN TETAP */
const email = 'adminku@gmail.com';

try{

await signInWithEmailAndPassword(
auth,
email,
password
);

/* JIKA BERHASIL */

document.getElementById(
'btnStruk'
).style.display='flex';

showToast('Akses struk dibuka');

}catch(error){

showToast('Password salah');

console.log(error);

}

}

/* =========================
CHECKOUT WHATSAPP
========================= */

window.checkoutWA = async function(){

showLoading('Mengirim pesanan...');

const nama =
document.getElementById(
'namaPemesan'
).value;

const pengiriman =
document.getElementById(
'pengiriman'
).value;

const pembayaran =
document.getElementById(
'pembayaran'
).value;

if(!nama){

hideLoading();

showToast('Isi nama');

return;

}

if(cart.length===0){

hideLoading();

showToast('Keranjang kosong');

return;

}

let pesan =
'🛒 PESANAN TOKO DEFANA%0A%0A';

pesan +=
'Nama : ' + nama + '%0A';

pesan +=
'Pengiriman : ' + pengiriman + '%0A';

pesan +=
'Pembayaran : ' + pembayaran + '%0A%0A';

let total = 0;

let items = [];

cart.forEach(item=>{

const subtotal =
item.harga * item.qty;

total += subtotal;

pesan +=

item.nama +
' ('+item.qty+') = Rp '+
subtotal.toLocaleString() +
'%0A';

items.push({

nama:item.nama,
qty:item.qty,
harga:item.harga,
subtotal:subtotal

});

});

/* =========================
MINIMAL CHECKOUT
========================= */

if(total < 50000){

hideLoading();

showToast(
'Minimal belanja Rp50.000'
);

return;

}

pesan +=
'%0A TOTAL : Rp ' +
total.toLocaleString();

await kirimRekap(
nama,
pengiriman,
pembayaran,
total,
items
);

await kurangiStockCheckout();

cart = [];

updateCart();

renderProduk();

hideLoading();

window.open(

'https://wa.me/6281554041777?text='+pesan,

'_blank'

);

showToast('Checkout berhasil');

}
/* =========================
CETAK STRUK
========================= */

window.cetakStruk = async function(){

showLoading('Mencetak struk...');

const nama =
document.getElementById(
'namaPemesan'
).value;

const pengiriman =
document.getElementById(
'pengiriman'
).value;

const pembayaran =
document.getElementById(
'pembayaran'
).value;

if(!nama){

hideLoading();

showToast('Isi nama');

return;

}

if(cart.length===0){

hideLoading();

showToast('Keranjang kosong');

return;

}

let total = 0;

let items = [];

let text = '';

text += 'TOKO DEFANA\n';
text += '====================\n';

text += 'Nama : '+nama+'\n';
text += 'Pengiriman : '+pengiriman+'\n';
text += 'Pembayaran : '+pembayaran+'\n';

text += '====================\n';

cart.forEach(item=>{

const subtotal =
item.harga * item.qty;

total += subtotal;

text +=
item.nama +
' ('+item.qty+') = Rp '+
subtotal +
'\n';

items.push({

nama:item.nama,
qty:item.qty,
harga:item.harga,
subtotal:subtotal

});

});

text += '====================\n';

text +=
'TOTAL : ' + total + '\n';

text +=
'TERIMA KASIH';

await kirimRekap(
nama,
pengiriman,
pembayaran,
total,
items
);

await kurangiStockCheckout();

hideLoading();

const printWindow = window.open('', '', 'width=400,height=700');

printWindow.document.write(`
<html>
<head>
<title>Struk</title>

<style>

body{
font-family: monospace;
width:58mm;
margin:0;
padding:8px;
font-size:11px;
color:#000;
}

.center{
text-align:center;
}

.line{
border-top:1px dashed #000;
margin:5px 0;
}

.item{
margin-bottom:6px;
}

.total{
font-weight:bold;
font-size:13px;
}

@media print{
body{
width:58mm;
}
}

</style>
</head>

<body>

<div class="center">
<b>TOKO DEFANA</b><br>
Terima Kasih
</div>

<div class="line"></div>

Nama : ${nama}<br>
Pengiriman : ${pengiriman}<br>
Pembayaran : ${pembayaran}<br>

<div class="line"></div>
`);

cart.forEach(item=>{

const subtotal = item.harga * item.qty;

printWindow.document.write(`

<div class="item">

${item.nama}<br>

${item.qty} x Rp ${Number(item.harga).toLocaleString()}<br>

<b>Rp ${subtotal.toLocaleString()}</b>

</div>

`);

});

printWindow.document.write(`

<div class="line"></div>

<div class="total">
TOTAL : Rp ${total.toLocaleString()}
</div>

<div class="line"></div>

<div class="center">
TERIMA KASIH<br>
Sudah Berbelanja DIsini
</div>

</body>
</html>

`);

printWindow.document.close();

printWindow.focus();

printWindow.print();

cart = [];

updateCart();

renderProduk();

showToast('Struk berhasil dicetak');

}
/* =========================
LOADING
========================= */

function showLoading(text='Memproses...'){

const loading =
document.getElementById('loadingBox');

const loadingText =
document.getElementById('loadingText');

if(!loading || !loadingText) return;

loading.classList.add('active');

loadingText.innerHTML = text;

}

function hideLoading(){

const loading =
document.getElementById('loadingBox');

if(!loading) return;

loading.classList.remove('active');

}

/* =========================
TOAST
========================= */

function showToast(text){

const toast =
document.getElementById('toast');

const toastText =
document.getElementById('toastText');

if(!toast || !toastText) return;

toastText.innerHTML = text;

toast.classList.add('show');

setTimeout(()=>{

toast.classList.remove('show');

},2000);

}

/* =========================
KURANGI STOCK CHECKOUT
========================= */

async function kurangiStockCheckout(){

for(let i = 0; i < cart.length; i++){

const itemCart = cart[i];

const indexProduk =
produk.findIndex(
p => p.id == itemCart.id
);

if(indexProduk === -1) continue;

const stokSekarang =
Number(
produk[indexProduk].stok || 0
);

const stokBaru =
Math.max(
stokSekarang - itemCart.qty,
0
);

await set(

ref(
firebaseDB,
indexProduk + '/stok'
),

stokBaru

);

produk[indexProduk].stok = stokBaru;

}

}
/* =========================
RESET CART
========================= */

window.resetCart = function(){

if(cart.length === 0){
showToast('Keranjang sudah kosong');
return;
}

const yakin = confirm(
'Yakin ingin mengosongkan keranjang?'
);

if(!yakin) return;

cart = [];

updateCart();

toggleMetode();

showToast('Keranjang dikosongkan');

}
