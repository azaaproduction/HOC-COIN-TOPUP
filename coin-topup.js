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
    phone: "94714203600"
}
];


function sendTopup(adminIndex, sellerName, memberName, mojuId, amount){

const s = SELLERS.find(x => x.name === sellerName);
const acc = s.accounts[
document.getElementById("selectedAccount").value
];

const SELLER_BANK = `
🏦 Account Type : ${acc.label}
🏦 Bank Name : ${acc.bank}
👤 Account Name : ${acc.account}
🔢 Account Number : ${acc.number}
🌿 Branch : ${acc.branch}
`;

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
  name: "NELSON RESELLER",
  banner: "දැනට තියෙන banner එක",
  accounts: [
    {
      label: "Main Account",
      bank: "COMMERCIAL BANK",
      account: "P INOKA DILRUKSHI",
      number: "8001725731",
      branch: "NEGOMBO"
    },
    {
      label: "Reserve Account",
      bank: "SAMPATH BANK",
      account: "P INOKA DILRUKSHI",
      number: "118356258384",
      branch: "MARANDAGAHA MULA"
    }
  ]
},

{
  name: "DJ PRADEEP RESELLER",
  banner: "දැනට තියෙන banner එක",
  accounts: [
    {
      label: "Main Account",
      bank: "SAMPATH BANK",
      account: "W P P KUMARA",
      number: "100355320276",
      branch: "CITY OFFICE"
    }
  ]
},

{
  name: "AJANTHA RESELLER",
  banner: "දැනට තියෙන banner එක",
  accounts: [
    {
      label: "Main Account",
      bank: "SAMPATH BANK",
      account: "G C D GANEGODA",
      number: "118355147879",
      branch: "MARANDAGAHA MULA"
    }
  ]
},

{
  name: "DINESHA RESELLER",
  banner: "දැනට තියෙන banner එක",
  accounts: [
    {
      label: "Main Account",
      bank: "BOC BANK",
      account: "J H M DINESHA MALKANTHI",
      number: "93849185",
      branch: "BINGIRIYA"
    }
  ]
},

{
  name: "PAHAN RESELLER",
  banner: "දැනට තියෙන banner එක",
  accounts: [
    {
      label: "Main Account",
      bank: "SAMPATH BANK",
      account: "H R RASIKA NILMINI",
      number: "120956279052",
      branch: "WELIGAMA BRANCH"
    }
  ]
}
];
function loadCoinSellers(){

const box=document.getElementById("sellerList");

box.innerHTML=SELLERS.map((s,i)=>`

<div class="card">

<img src="${s.banner}" class="banner">

<h3>${s.name}</h3>

<button class="primary"
onclick="openSeller(${i})">

Top-up එක කරගැනීම සඳහා

</button>

</div>

`).join("");

}
let currentSeller = null;
function openSeller(index){

const s = SELLERS[index];
const BANK = `
<select id="selectedAccount"
class="input"
onchange="updateBankDetails()">
${s.accounts.map((a,i)=>`
<option value="${i}">
${a.label} - ${a.bank}
</option>
`).join("")}
</select>

<div id="bankDetails"></div>
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
</div>
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
updateBankDetails();
}
function updateBankDetails(){

const a = currentSeller.accounts[
document.getElementById("selectedAccount").value
];

document.getElementById("bankDetails").innerHTML = `
<div class="card">

<h3>${a.label}</h3>

<p><b>🏦 Bank</b> : ${a.bank}</p>

<p><b>👤 Account</b> : ${a.account}</p>

<p><b>🔢 Number</b> : ${a.number}</p>

<p><b>🌿 Branch</b> : ${a.branch}</p>

<button class="primary"
onclick="navigator.clipboard.writeText('${a.number}')">

📋 Copy Account Number

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