// PASSWORD LOGIN

const PASSWORD = "db27";

// LOGIN

function loginAdmin(){

const pass =
document.getElementById("password").value;

if(pass === PASSWORD){

document.getElementById("loginBox").style.display = "none";

document.getElementById("dashboard").style.display = "block";

renderProduk();

}else{

alert("Password Salah!");

}

}

// AMBIL DATA PRODUK

let produk = [];

// LOAD PRODUK

fetch("produk.json")
.then(res => res.json())
.then(data => {

produk = data;

renderProduk();

});

// TAMPILKAN PRODUK

function renderProduk(){

const keyword =
document.getElementById("searchProduk")
.value
.toLowerCase();

const list =
document.getElementById("listProduk");

list.innerHTML = "";

/* =========================
BATAS stock MENIPIS
========================= */

const BATAS_stock = 3;

/* =========================
FILTER PRODUK
========================= */

const hasil =
produk.filter(item =>

item.nama
.toLowerCase()
.includes(keyword)

);

/* =========================
stock MENIPIS
========================= */

const stockSedikit =
hasil.filter(item =>

Number(item.stock || 0)
<= BATAS_stock

);

const stockNormal =
hasil.filter(item =>

Number(item.stock || 0)
> BATAS_stock

);

/* =========================
WARNING BOX
========================= */

if(stockSedikit.length > 0){

list.innerHTML += `

<div class="stock-warning-box">

⚠️ stock MENIPIS
(${stockSedikit.length} Produk)

</div>

`;

}

/* =========================
RENDER stock MENIPIS
========================= */

stockSedikit.forEach((item)=>{

list.innerHTML += `

<div class="produk stock-tipis">

<div>

<h3>${item.nama}</h3>

<p>
⚠️ stock : ${item.stock || 0}
</p>

</div>

<div class="btn-group">

<button
class="btn tambah"
onclick="tambahstock('${item.id}')">

+ stock

</button>

<button
class="btn kurang"
onclick="kurangstock('${item.id}')">
- stock

</button>

</div>

</div>

`;

});

/* =========================
RENDER stock NORMAL
========================= */

stockNormal.forEach((item)=>{

list.innerHTML += `

<div class="produk">

<div>

<h3>${item.nama}</h3>

<p>
stock : ${item.stock || 0}
</p>

</div>

<div class="btn-group">

<button
class="btn tambah"
onclick="tambahstock('${item.id}')">

+ stock

</button>

<button
class="btn kurang"
onclick="kurangstock('${item.id}')">

- stock

</button>

</div>

</div>

`;

});
// TAMBAH stock

function tambahstock(id){

const item =
produk.find(p => p.id == id);

if(!item.stock){
item.stock = 0;
}

item.stock++;

renderProduk();

simpanStorage();

}
// KURANG stock

function kurangstock(id){

const item =
produk.find(p => p.id == id);

if(!item.stock){
item.stock = 0;
}

if(item.stock > 0){
item.stock--;
}

renderProduk();

simpanStorage();

}
// SIMPAN LOCAL STORAGE

function simpanStorage(){

localStorage.setItem(
"produk",
JSON.stringify(produk)
);

}

// LOAD STORAGE

const dataStorage =
localStorage.getItem("produk");

if(dataStorage){

produk = JSON.parse(dataStorage);

}
