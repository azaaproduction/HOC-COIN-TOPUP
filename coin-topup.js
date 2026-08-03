// ===============================
// HOC COIN TOPUP SYSTEM V1
// ===============================

const HOC_ADMINS = [
{
    name: "Azaa",
    phone: "94786868118"
},
{
    name: "Kasun",
    phone: "94763138633"
},
{
    name: "Danuu",
    phone: "94720853116"
}
];

const SELLER_BANK = `
🏦 Bank Name :
👤 Account Name :
🔢 Account Number :
🌿 Branch :
`;

function sendTopup(adminIndex, sellerName, memberName, mojuId, amount){

const admin = HOC_ADMINS[adminIndex];

const msg = `
*HOC COIN TOPUP REQUEST*

━━━━━━━━━━━━━━

🎯 Coin Seller
${sellerName}

━━━━━━━━━━━━━━

${SELLER_BANK}

━━━━━━━━━━━━━━

👤 Member : ${memberName}
🆔 Moju ID : ${mojuId}
💰 Amount : ${amount}

━━━━━━━━━━━━━━

⚠️ Payment has already been sent to the seller account.

Please verify and top-up the coins.
`;

window.open(
`https://wa.me/${admin.phone}?text=${encodeURIComponent(msg)}`,
"_blank"
);

}
function openCoinTopup() {
    openCoinTopupPage();
}
function openCoinTopupPage() {

document.body.innerHTML = `
<div class="wrap">

<h2>💰 Coin Top-up</h2>
<p>Select Coin Seller</p>

<div id="sellerList"></div>

<button onclick="location.reload()" class="danger">
⬅ Back
</button>

</div>
`;

loadCoinSellers();

}
const SELLERS = [
{
  name: "Seller 01",
  bank: "Commercial Bank",
  accountName: "Seller 01",
  accountNumber: "1234567890",
  branch: "Kurunegala"
},
{
  name: "Seller 02",
  bank: "BOC",
  accountName: "Seller 02",
  accountNumber: "9876543210",
  branch: "Colombo"
},
{
  name: "Seller 03",
  bank: "People's Bank",
  accountName: "Seller 03",
  accountNumber: "5555555555",
  branch: "Kandy"
}
];
function loadCoinSellers(){

const box=document.getElementById("sellerList");

box.innerHTML=SELLERS.map((s,i)=>`

<div class="card">

<img src="${s.banner}" class="banner">
<div class="card">

<h3>🏦 Bank Details</h3>

<p><b>Bank</b> : ${s.bankName}</p>

<p><b>Account</b> : ${s.accountName}</p>

<p><b>Number</b> : ${s.accountNo}</p>

<p><b>Branch</b> : ${s.branch}</p>

<button class="primary"
onclick="navigator.clipboard.writeText('${s.accountNo}')">

📋 Copy Account Number

</button>

</div>

<h3>${s.name}</h3>

<button class="primary"
onclick="openSeller(${i})">

Top-up එක කරගැනීම සඳහා

</button>

</div>

`).join("");

}
function openSeller(index){

const s = SELLERS[index];
const BANK = `
<div class="card">
<h3>🏦 Bank Details</h3>

<p><b>Bank :</b> ${s.bank}</p>
<p><b>Account :</b> ${s.accountName}</p>
<p><b>Number :</b> ${s.accountNumber}</p>
<p><b>Branch :</b> ${s.branch}</p>

<button class="primary"
onclick="navigator.clipboard.writeText('${s.accountNumber}');alert('✅ Account Number Copied');">
📋 Copy Account Number
</button>

</div>
`;

document.body.innerHTML = `

<div class="wrap">

<img src="${s.banner}" class="banner">

<h2>${s.name}</h2>

<div class="card">

<input id="memberName" placeholder="Your Name">

<input id="mojuId" placeholder="Moju ID">

<input id="amount" type="number" placeholder="Amount">
${BANK}

<h3>Select Admin</h3>

<button class="primary"
onclick="sendTopup(0,'${s.name}',document.getElementById('memberName').value,document.getElementById('mojuId').value,document.getElementById('amount').value)">
📲 Send to 👑 Azaa
</button>

<button class="primary"
onclick="sendTopup(1,'${s.name}',document.getElementById('memberName').value,document.getElementById('mojuId').value,document.getElementById('amount').value)">
📲 Send to 👑 Kasun
</button>

<button class="primary"
onclick="sendTopup(2,'${s.name}',document.getElementById('memberName').value,document.getElementById('mojuId').value,document.getElementById('amount').value)">
📲 Send to 👑 Danuu
</button>

<br><br>

<button class="danger"
onclick="openCoinTopupPage()">
⬅ Back
</button>

</div>

`;

}
document.addEventListener("change",(e)=>{

if(e.target.id==="paymentSlip"){

const file=e.target.files[0];

if(!file)return;

const reader=new FileReader();

reader.onload=function(){

const img=document.getElementById("slipPreview");

img.src=reader.result;

img.style.display="block";

}

reader.readAsDataURL(file);

}

});