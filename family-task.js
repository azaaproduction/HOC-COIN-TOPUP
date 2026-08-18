// ==========================================
// HOC FAMILY TASKS — MEMBER SYSTEM V5
// Member completion requests -> Firebase
// Admin approval is handled in app.js
// ==========================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getDatabase, ref, get, set
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDH0umICWs9JD3bS0NRVW-h_rw_yHJ_HMw",
  authDomain: "hoc-family-port.firebaseapp.com",
  databaseURL: "https://hoc-family-port-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hoc-family-port",
  storageBucket: "hoc-family-port.firebasestorage.app",
  messagingSenderId: "658601137394",
  appId: "1:658601137394:web:112cc4e10b85f85490ac6b"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

const FAMILY_TASKS = [
  {
    id: 1,
    title: "Account එක නිතරම Online තියන ඔබට අපෙන් හිමිවන Gift",
    gift: "Diamond 30",
    diamond: 30
  },
  {
    id: 2,
    title: "Target Level 01 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift",
    gift: "Diamond 3000",
    diamond: 3000
  },
  {
    id: 3,
    title: "Target Level 02 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift",
    gift: "Diamond 300",
    diamond: 300
  },
  {
    id: 4,
    title: "Target Level 03 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift",
    gift: "Diamond 600",
    diamond: 600
  },
  {
    id: 5,
    title: "ඔබ App එකට එකතු කරන අයට අපි ලබාදෙන Gift",
    gift: "Diamond 300",
    diamond: 300,
    referral: true
  }
];

function safeId(value){
  return String(value || "").replace(/[.#$[\]\/]/g, "_");
}

function esc(value){
  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function openFamilyTaskPage(){
  document.body.innerHTML = `
    <div class="wrap">
      <div class="card">
        <h1 style="text-align:center;color:#f2c14e;margin-bottom:5px;">
          👨‍👩‍👧‍👦 HOC FAMILY TASKS
        </h1>
        <p style="text-align:center;margin-top:0;">
          Haven Of Ceylon Family
        </p>
      </div>
      <div id="familyTaskList"></div>
      <button class="danger" onclick="location.reload()"
              style="width:100%;margin-top:15px;">
        ⬅️ Back
      </button>
    </div>
  `;
  loadFamilyTasks();
}

function loadFamilyTasks(){
  const box = document.getElementById("familyTaskList");
  if(!box) return;

  box.innerHTML = FAMILY_TASKS.map(task => `
    <div class="card" style="margin-bottom:18px;border:2px solid #f2c14e;">
      <h2 style="color:#f2c14e;margin-bottom:10px;">
        🎯 Family Task ${String(task.id).padStart(2,"0")}
      </h2>

      <p style="font-size:17px;line-height:1.55;margin-bottom:8px;">
        <b>Task:</b> ${esc(task.title)}
      </p>

      <h2 style="color:#00e676;margin-top:8px;">
        🎁 Gift : ${esc(task.gift)}
      </h2>

      <button class="primary"
              onclick="openTaskCompleteForm(${task.id})"
              style="width:100%;margin-top:10px;font-size:18px;">
        📋 Task Details
      </button>
    </div>
  `).join("");
}

function openTaskCompleteForm(taskId){
  const task = FAMILY_TASKS.find(t => t.id === taskId);
  if(!task) return;

  if(task.referral){
    openReferralForm();
    return;
  }

  document.body.innerHTML = `
    <div class="wrap">
      <div class="card">
        <h2 style="color:#f2c14e;text-align:center;">
          🎯 Family Task ${String(task.id).padStart(2,"0")}
        </h2>

        <hr>

        <h3 style="line-height:1.5;">${esc(task.title)}</h3>

        <div style="background:#182233;padding:15px;border-radius:15px;margin:20px 0;">
          🎁 Gift
          <h2 style="color:#00e676;margin-bottom:0;">${esc(task.gift)}</h2>
        </div>

        <p style="line-height:1.6;">
          Task එක සම්පුර්ණ කිරීමෙන් පසු ඔබගේ Name සහ App ID
          ඇතුළත් කර Request එක Submit කරන්න.
          Admin විසින් පරීක්ෂා කර Gift එක ලබාදෙනු ඇත.
        </p>

        <label>👤 User Name</label>
        <input id="taskUserName" type="text"
               placeholder="ඔබගේ User Name"
               style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

        <label>🆔 App ID</label>
        <input id="taskAppId" type="text" inputmode="numeric"
               placeholder="ඔබගේ App ID"
               style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

        <button class="primary" onclick="submitNormalTask(${task.id})"
                style="width:100%;font-size:18px;">
          📤 Submit Task Request
        </button>

        <button class="danger" onclick="openFamilyTaskPage()"
                style="width:100%;margin-top:12px;">
          ⬅️ Back
        </button>
      </div>
    </div>
  `;
}

async function submitNormalTask(taskId){
  const task = FAMILY_TASKS.find(t => t.id === taskId);
  if(!task) return;

  const name = document.getElementById("taskUserName")?.value.trim();
  const appId = document.getElementById("taskAppId")?.value.trim();

  if(!name || !appId){
    alert("⚠️ User Name සහ App ID දෙකම ඇතුළත් කරන්න.");
    return;
  }

  if(!/^\d+$/.test(appId)){
    alert("❌ App ID එකට අංක පමණක් ඇතුළත් කරන්න.");
    return;
  }

  const memberId = safeId(appId);
  const taskRef = ref(db, `familyTaskCompletions/${taskId}/${memberId}`);

  try{
    const snap = await get(taskRef);

    if(snap.exists()){
      const old = snap.val() || {};
      if(old.status === "COMPLETED"){
        alert("⚠️ මේ Task එක දැනටමත් Approved කර ඇත.");
      }else if(old.status === "PENDING"){
        alert("⚠️ මේ Task එක දැනටමත් Pending ලෙස Submit කර ඇත.");
      }else{
        alert("⚠️ මේ Task එක සඳහා කලින් Request එකක් තිබේ.");
      }
      return;
    }

    await set(taskRef, {
      taskId: task.id,
      taskTitle: task.title,
      name,
      appId,
      gift: task.gift,
      diamond: task.diamond,
      status: "PENDING",
      rewardGiven: false,
      completedAt: Date.now()
    });

    alert(
      "✅ Task Completion Request සාර්ථකව Submit කළා!\n\n" +
      "👤 Name: " + name +
      "\n🆔 App ID: " + appId +
      "\n🎁 Gift: " + task.gift +
      "\n\n⏳ Status: PENDING\n" +
      "Admin විසින් පරීක්ෂා කර Gift එක ලබාදෙනු ඇත."
    );

    openFamilyTaskPage();
  }catch(error){
    console.error(error);
    alert("❌ Task submit කිරීමේදී දෝෂයක් ඇතිවිය.\n\n" + error.message);
  }
}

function openReferralForm(){
  document.body.innerHTML = `
    <div class="wrap">
      <div class="card">
        <h2 style="color:#f2c14e;text-align:center;">
          👥 Family Task 05 — Referral Task
        </h2>

        <p style="text-align:center;line-height:1.6;">
          ඔබගේ Referral එකෙන් App එකට අලුත් Member කෙනෙක්
          එකතු කළේ නම් පහත විස්තර ඇතුළත් කරන්න.
        </p>

        <div style="background:#182233;padding:15px;border-radius:15px;margin:20px 0;line-height:1.6;">
          🎁 Gift: <b>Diamond 300</b><br><br>
          ⏳ Referral Request එක Admin විසින් පරීක්ෂා කර
          Approve කළ පසු Gift එක ලබාදෙනු ඇත.
        </div>

        <label>👤 ඔබගේ User Name</label>
        <input id="referrerName" type="text"
               placeholder="ඔබගේ User Name"
               style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

        <label>🆔 ඔබගේ App ID</label>
        <input id="referrerId" type="text" inputmode="numeric"
               placeholder="ඔබගේ App ID"
               style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

        <label>👤 අලුත් Member ගේ Name</label>
        <input id="referredName" type="text"
               placeholder="අලුත් Member ගේ Name"
               style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

        <label>🆔 අලුත් Member ගේ App ID</label>
        <input id="referredId" type="text" inputmode="numeric"
               placeholder="අලුත් Member ගේ App ID"
               style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

        <button class="primary" onclick="submitReferralTask()"
                style="width:100%;font-size:18px;">
          📤 Referral Submit කරන්න
        </button>

        <button class="danger" onclick="openFamilyTaskPage()"
                style="width:100%;margin-top:12px;">
          ⬅️ Back
        </button>
      </div>
    </div>
  `;
}

async function submitReferralTask(){
  const referrerName = document.getElementById("referrerName")?.value.trim();
  const referrerId = document.getElementById("referrerId")?.value.trim();
  const referredName = document.getElementById("referredName")?.value.trim();
  const referredId = document.getElementById("referredId")?.value.trim();

  if(!referrerName || !referrerId || !referredName || !referredId){
    alert("⚠️ සියලුම විස්තර ඇතුළත් කරන්න.");
    return;
  }

  if(!/^\d+$/.test(referrerId) || !/^\d+$/.test(referredId)){
    alert("❌ App ID වලට අංක පමණක් ඇතුළත් කරන්න.");
    return;
  }

  if(referrerId === referredId){
    alert("❌ ඔබගේම App ID එක Referral Member ලෙස ඇතුළත් කරන්න බැහැ.");
    return;
  }

  const key = safeId(referredId);
  const referralRef = ref(db, `familyTaskCompletions/5/${key}`);

  try{
    const snap = await get(referralRef);

    if(snap.exists()){
      alert("⚠️ මෙම New Member සඳහා Referral Request එක දැනටමත් තිබේ.");
      return;
    }

    await set(referralRef, {
      taskId: 5,
      taskTitle: FAMILY_TASKS[4].title,
      referrerName,
      referrerId,
      referredName,
      referredId,
      gift: "Diamond 300",
      diamond: 300,
      status: "PENDING",
      rewardGiven: false,
      submittedAt: Date.now()
    });

    alert(
      "✅ Referral Request සාර්ථකව Submit කළා!\n\n" +
      "👤 ඔබ: " + referrerName +
      "\n🆔 ඔබගේ ID: " + referrerId +
      "\n\n👤 New Member: " + referredName +
      "\n🆔 New Member ID: " + referredId +
      "\n\n⏳ Status: PENDING\n" +
      "Admin විසින් පරීක්ෂා කර Diamond 300 ලබාදෙනු ඇත."
    );

    openFamilyTaskPage();
  }catch(error){
    console.error(error);
    alert("❌ Referral submit කිරීමේදී දෝෂයක් ඇතිවිය.\n\n" + error.message);
  }
}

window.openFamilyTaskPage = openFamilyTaskPage;
window.openTaskCompleteForm = openTaskCompleteForm;
window.submitNormalTask = submitNormalTask;
window.openReferralForm = openReferralForm;
window.submitReferralTask = submitReferralTask;
