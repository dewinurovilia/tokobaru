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
DATA GLOBAL
========================= */

let produk = [];
let kategoriAktif = 'Semua';
let cart = [];
let selectedProduct = null;

/* =========================
RESET KEUANGAN HARIAN
========================= */

cekResetHarian();

function cekResetHarian(){

const hariIni =
new Date().toISOString().split('T')[0];

const keuanganRef =
ref(firebaseDB,'keuangan');

onValue(keuanganRef,(snapshot)=>{

const data = snapshot.val() || {};

const tanggalLama =
data.tanggal || '';

if(tanggalLama !== hariIni){

set(
ref(firebaseDB,'keuangan'),
{

tanggal: hariIni,
modalHari: 0,
penjualanHari: 0

}
);

}

},
{
onlyOnce:true
}
);

}

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
LOAD PRODUK
========================= */

function loadProduk(){

const produkRef =
ref(firebaseDB);

onValue(produkRef,(snapshot)=>{

const data = snapshot.val();

if(!data){

console.log('Produk kosong');

return;

}

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

showToast('Produk tidak ditemukan');

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

window.closePopup = function(){

document.getElementById(
'popupBox'
).classList.remove('active');

}

window.popupTambah = function(){

const qty =
document.getElementById('popupQty');

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

window.popupKurang = function(){

const qty =
document.getElementById('popupQty');

if(qty.value > 1){

qty.value--;

}

}

/* =========================
TAMBAH CART
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

/* =========================
UPDATE CART
========================= */

function updateCart(){

const cartBox =
document.getElementById('cartItems');

const totalBox =
document.getElementById('cartTotal');

const countBox =
document.getElementById('cartCount');

if(!cartBox) return;

cartBox.innerHTML='';

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

if(totalBox){

totalBox.innerHTML =
'Total : Rp ' +
total.toLocaleString();

}

if(countBox){

countBox.innerHTML =
cart.length;

}

}

window.hapusCart = function(index){

cart.splice(index,1);

updateCart();

toggleMetode();

}

window.toggleCart = function(){

document
.getElementById('cartBox')
.classList
.toggle('active');

}

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

/* =========================
PASSWORD STRUK
========================= */

window.cekPasswordStruk = function(){

const password =
document.getElementById(
'passwordStruk'
).value;

/* PASSWORD CETAK STRUK = 27 */

if(password === '27'){

document.getElementById(
'btnStruk'
).style.display='flex';

showToast(
'Akses cetak struk dibuka'
);

}else{

showToast(
'Password salah'
);

}

}

/* =========================
TOGGLE METODE
========================= */

window.toggleMetode = function(){

const pengiriman =
document.getElementById('pengiriman');

const btnWA =
document.getElementById('btnWA');

const btnStruk =
document.getElementById('btnStruk');

const passwordBox =
document.getElementById('passwordStrukBox');

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

if(pengiriman.value==='Diantar'){

btnWA.style.display='flex';

}

if(pengiriman.value==='Ambil Sendiri'){

passwordBox.style.display='block';

}

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
CHECKOUT WA
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

await kirimRekap(
nama,
pengiriman,
pembayaran,
total,
items
);

await kurangiStockCheckout();

await tambahPenjualan(total);

cart=[];

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

const pembayaran =
document.getElementById(
'pembayaran'
).value;

const pengiriman =
document.getElementById(
'pengiriman'
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
text += 'TOTAL : Rp '+total+'\n';
text += 'TERIMA KASIH';

await kirimRekap(
nama,
pengiriman,
pembayaran,
total,
items
);

await kurangiStockCheckout();

await tambahPenjualan(total);

cart=[];

updateCart();

renderProduk();

hideLoading();

const printWindow =
window.open('','','width=300,height=600');

printWindow.document.write(
'<pre>'+text+'</pre>'
);

printWindow.document.close();

printWindow.print();

showToast('Struk berhasil dicetak');

}

/* =========================
TAMBAH PENJUALAN
========================= */

async function tambahPenjualan(total){

const keuanganRef =
ref(firebaseDB,'keuangan');

onValue(keuanganRef,(snapshot)=>{

const data = snapshot.val() || {};

const lama =
data.penjualanHari || 0;

set(
ref(firebaseDB,'keuangan/penjualanHari'),
lama + total
);

},
{
onlyOnce:true
}
);

}

/* =========================
KURANGI STOCK
========================= */

async function kurangiStockCheckout(){

for(let i=0;i<cart.length;i++){

const itemCart = cart[i];

const indexProduk =
produk.findIndex(
p => p.id == itemCart.id
);

if(indexProduk===-1) continue;

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

produk[indexProduk].stok =
stokBaru;

}

}

/* =========================
RESET CART
========================= */

window.resetCart = function(){

cart = [];

updateCart();

toggleMetode();

showToast(
'Keranjang dikosongkan'
);

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
<!-- PASSWORD STRUK -->

<div id="passwordStrukBox">

<input
type="password"
id="passwordStruk"
placeholder="Password Cetak Struk">

<button onclick="cekPasswordStruk()">

Buka Cetak Struk

</button>

</div>

<!-- LOADING -->

<div class="loading-box" id="loadingBox">

<div class="loading-content">

<div class="loader"></div>

<p id="loadingText">
Memproses...
</p>

</div>

</div>
