import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, get, set, update, push, runTransaction } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDH0umICWs9JD3bS0NRVW-h_rw_yHJ_HMw",
  authDomain: "hoc-family-port.firebaseapp.com",
  databaseURL: "https://hoc-family-port-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hoc-family-port",
  storageBucket: "hoc-family-port.firebasestorage.app",
  messagingSenderId: "658601137394",
  appId: "1:658601137394:web:112cc4e10b85f85490ac6b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const ADMIN_EMAILS = [
  "azaaproduction@gmail.com",
  "kasunhoc@gmail.com",
  "danuuhoc@gmail.com",
  "timahoc@gmail.com"
];
const isAdmin = user => !!user && ADMIN_EMAILS.includes(String(user.email || "").toLowerCase());
let EVENTS=[], CURRENT=null;
let FULL_ALERT_SHOWN = new Set();

const $ = id => document.getElementById(id);
const esc = s => String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const slug = s => String(s||'').replace(/[.#$/[\]]/g,'_');

async function load(){
  try{
    const snap=await get(ref(db,'events'));
    const data=snap.val()||{};
    EVENTS=Object.entries(data).map(([id,e])=>({ ...e, "Event ID": e["Event ID"]||id }));
    EVENTS=EVENTS.filter(e=>e.Status!=='DELETED');
    $('events').innerHTML=EVENTS.map(e=>{
      const c1=Number(e.team1Count||0), c2=Number(e.team2Count||0);
      const l1=Number(e['Team 1 Limit']||0), l2=Number(e['Team 2 Limit']||0);
      const total=c1+c2, limit=l1+l2;
      const alertState=total>=limit?'FULL':limit-total===1?'ONE SLOT LEFT':limit-total<=3?'ALMOST FULL':'OPEN';
      e.alert=alertState; e.team1Count=c1; e.team2Count=c2;
      return `<article class="card alert-${alertState}">${e['Banner URL']?`<img class="banner" src="${esc(e['Banner URL'])}">`:''}<h2>🏆 ${esc(e.Name)}</h2><p>🌟 ${esc(e.Organizer)}</p><div class="row"><span class="pill">📅 ${esc(e.Date)}</span><span class="pill">⏰ ${esc(e.Time)}</span></div><p>👥 ${esc(e['Team 1 Name'])}: <b>${c1}/${l1}</b><br>👥 ${esc(e['Team 2 Name'])}: <b>${c2}/${l2}</b></p><h3>${alertState==='FULL'?'🚨 EVENT FULL':alertState==='ONE SLOT LEFT'?'⚠️ ONE SLOT LEFT':alertState==='ALMOST FULL'?'🟠 ALMOST FULL':'🟢 REGISTRATION OPEN'}</h3>${alertState!=='FULL'&&e.Status!=='CLOSED'?`<button class="primary" data-join="${esc(e['Event ID'])}">JOIN EVENT</button>`:''}</article>`;
    }).join('')||'<p>No active events.</p>';
    document.querySelectorAll('[data-join]').forEach(b=>b.onclick=()=>openJoin(b.dataset.join));
  }catch(err){$('events').innerHTML='<p>❌ Firebase connection error: '+esc(err.message)+'</p>'}
}

function openJoin(id){
  CURRENT=EVENTS.find(e=>String(e['Event ID'])===String(id));
  $('jTitle').textContent='🏆 '+CURRENT.Name;
  $('jTeam').innerHTML=`<option value="1">${esc(CURRENT['Team 1 Name'])} — ${CURRENT.team1Count}/${CURRENT['Team 1 Limit']}</option><option value="2">${esc(CURRENT['Team 2 Name'])} — ${CURRENT.team2Count}/${CURRENT['Team 2 Limit']}</option>`;
  $('joinDlg').showModal();
}

async function submitJoin(){
  if(!CURRENT) return;
  const name=$('jName').value.trim(), appId=$('jId').value.trim(), team=$('jTeam').value;
  if(!name||!appId) return alert('නම සහ App ID ඇතුළත් කරන්න.');
  if(!/^\d+$/.test(appId)) return alert('❌ App ID must contain numbers only.');

  const eventId=CURRENT['Event ID'], eventKey=slug(eventId);
  const countField=team==='1'?'team1Count':'team2Count';
  const limit=Number(CURRENT[team==='1'?'Team 1 Limit':'Team 2 Limit']||0);
  const memberKey=slug(appId);

  try{
    const memberRef=ref(db,`members/${eventKey}/${memberKey}`);
    const txMember=await runTransaction(memberRef,current=>{
      if(current!==null) return;
      return {Name:name,'App ID':appId,Team:team,joinedAt:Date.now()};
    });

    if(!txMember.committed) return alert('❌ This App ID is already registered.');

    const countRef=ref(db,`events/${eventKey}/${countField}`);
    const txCount=await runTransaction(countRef,current=>{
      current=Number(current||0);
      return current>=limit ? undefined : current+1;
    });

    if(!txCount.committed){
      await set(memberRef,null);
      return alert('❌ Selected team is full.');
    }

    alert('✅ Registration Successful! Position #'+txCount.snapshot.val());
    $('joinDlg').close(); $('jName').value=''; $('jId').value='';
    await load();
    if(isAdmin(auth.currentUser)){ await adminLoad(); showFullEventAlert(); }
  }catch(err){
    console.error('JOIN ERROR:',err);
    alert('❌ Join failed: '+err.message);
  }
}

async function adminLogin(){
  const email=$('adminEmail').value.trim(), password=$('adminPassword').value;
  if(!email||!password) return alert('Email සහ Password ඇතුළත් කරන්න.');
  try{
    const cred=await signInWithEmailAndPassword(auth,email,password);
    if(!isAdmin(cred.user)){ await signOut(auth); return alert('❌ This account is not an approved HOC Admin.'); }
    $('adminPassword').value=''; alert('✅ Admin Login Successful');
  }catch(err){ alert('❌ Login failed: '+err.message); }
}
async function adminLogout(){ await signOut(auth); }
async function adminLoad(){
  if(!isAdmin(auth.currentUser)){ $('admin').innerHTML=''; return; }
  const full=EVENTS.filter(e=>e.alert==='FULL'&&e['List Received']!=='YES');
  $('admin').innerHTML='<h3>🚨 URGENT EVENTS '+(full.length?`<span class="urgentCount">${full.length}</span>`:'')+'</h3>'+(full.length?full.map(e=>`<div class="urgentBox pulse"><b>🔴 FULL — LIST REQUIRED</b><h3>${esc(e.Name)}</h3><p>Team 01: <b>${e.team1Count}/${e['Team 1 Limit']}</b><br>Team 02: <b>${e.team2Count}/${e['Team 2 Limit']}</b></p><div class="urgentActions"><button data-copy="${esc(e['Event ID'])}" data-team="1">📋 COPY TEAM 01</button><button data-copy="${esc(e['Event ID'])}" data-team="2">📋 COPY TEAM 02</button></div><button class="ok" style="width:100%;margin-top:8px" data-received="${esc(e['Event ID'])}">✅ LIST RECEIVED</button></div>`).join(''):'<p>✅ No urgent full events.</p>')+
  '<h3>📚 COMPLETED EVENT HISTORY</h3>'+(EVENTS.filter(e=>e['List Received']==='YES').length?EVENTS.filter(e=>e['List Received']==='YES').map(e=>`<div class="completedBox"><span class="completedBadge">📋 LIST RECEIVED</span><h3>${esc(e.Name)}</h3><p>Team 01: <b>${e.team1Count}/${e['Team 1 Limit']}</b><br>Team 02: <b>${e.team2Count}/${e['Team 2 Limit']}</b><br>Event ID: ${esc(e['Event ID'])}</p><div class="urgentActions"><button data-copy="${esc(e['Event ID'])}" data-team="1">📋 COPY TEAM 01</button><button data-copy="${esc(e['Event ID'])}" data-team="2">📋 COPY TEAM 02</button></div><div class="urgentActions" style="margin-top:8px"><button class="ok" data-restore="${esc(e['Event ID'])}">♻️ RESTORE EVENT</button><button class="danger" data-delete-history="${esc(e['Event ID'])}">🗑️ DELETE HISTORY</button></div></div>`).join(''):'<p>📭 No completed events yet.</p>')+
  `<h3>👥 REGISTERED MEMBERS</h3>
   <div class="card">
     <select id="memberEvent"></select>
     <button class="primary" id="viewMembersBtn">VIEW REGISTERED MEMBERS</button>
     <div id="memberList"></div>
   </div>
   <h3>⚙️ EVENT MANAGEMENT</h3>
   <div class="card">
     <select id="manageEvent"></select>
     <button class="primary" id="editEventBtn">✏️ EDIT EVENT</button>
     <button class="danger" id="toggleEventBtn" style="width:100%;margin-top:8px">🔒 CLOSE REGISTRATION</button>
     <button class="danger" id="deleteEventBtn" style="width:100%;margin-top:8px">🗑️ DELETE EVENT</button>
     <div id="editPanel"></div>
   </div>
   <h3>➕ CREATE EVENT</h3>
   <div class="card">
     <input id="cName" placeholder="Event Name">
     <input id="cOrg" placeholder="Organizer">
     <input id="cDate" type="date">
     <input id="cTime" placeholder="Event Time">
     <input id="cGroup" value="Haven Of Ceylon">
     <input id="cBanner" placeholder="Banner Image URL">
     <input id="cT1" value="Main Team">
     <input id="cL1" type="number" value="10">
     <input id="cT2" value="Team 02">
     <input id="cL2" type="number" value="10">
     <button class="primary" id="createBtn">CREATE EVENT</button></div>
<h3>👨‍👩‍👧‍👦 FAMILY TASK</h3>
<div class="card">
<button class="primary" id="familyTaskAdminBtn" style="width:100%">
👨‍👩‍👧‍👦 OPEN FAMILY TASKS
</button>
</div>`;
  $('createBtn').onclick=createEvent;
  $('familyTaskAdminBtn').onclick=openFamilyTaskAdmin;
  $('memberEvent').innerHTML=EVENTS.map(e=>`<option value="${esc(e['Event ID'])}">${esc(e.Name)}</option>`).join('');
  $('viewMembersBtn').onclick=viewMembers;
  $('manageEvent').innerHTML=EVENTS.map(e=>`<option value="${esc(e['Event ID'])}">${esc(e.Name)}</option>`).join('');
  $('editEventBtn').onclick=openEditEvent;
  $('toggleEventBtn').onclick=toggleRegistration;
  $('deleteEventBtn').onclick=deleteEvent;
  $('manageEvent').onchange=refreshManageButton;
  refreshManageButton();
  document.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>restoreHistory(b.dataset.restore));
  document.querySelectorAll('[data-delete-history]').forEach(b=>b.onclick=()=>deleteHistory(b.dataset.deleteHistory));
  document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copyList(b.dataset.copy,b.dataset.team));
  document.querySelectorAll('[data-received]').forEach(b=>b.onclick=()=>received(b.dataset.received));
}



// ==========================================
// HOC FAMILY TASK ADMIN — MEMBER SHEET VIEW
// Group completed/pending task requests by member
// ==========================================

const HOC_FAMILY_TASKS = [
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

const taskSafeId = value =>
  String(value || "").replace(/[.#$[\]\/]/g, "_");

const taskEsc = value =>
  String(value ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[m]));

function familyTaskTime(value){
  if(!value) return "-";
  try{
    return new Date(Number(value)).toLocaleString();
  }catch(e){
    return "-";
  }
}

function familyTaskMemberKey(row, task){
  // Normal tasks belong to the member's App ID.
  // Referral task belongs to the referrer who receives the gift.
  return task.referral
    ? String(row.referrerId || "").trim()
    : String(row.appId || "").trim();
}

function familyTaskMemberName(row, task){
  return task.referral
    ? String(row.referrerName || "-")
    : String(row.name || "-");
}

function familyTaskMemberLabel(row, task){
  const id = familyTaskMemberKey(row, task);
  const name = familyTaskMemberName(row, task);
  return `${name} (${id || "-"})`;
}

async function openFamilyTaskAdmin(){
  if(!isAdmin(auth.currentUser))
    return alert("❌ Admin login required.");

  document.body.innerHTML = `
    <div class="wrap">

      <div class="card">
        <h2 style="text-align:center;color:#f2c14e;margin:0;">
          👨‍👩‍👧‍👦 HOC FAMILY TASK ADMIN
        </h2>
        <p style="text-align:center;margin:8px 0 0;">
          Member-wise Gift Sheet
        </p>
      </div>

      <div class="card">
        <button class="primary" id="taskAdminCopyAll"
                style="width:100%;font-size:18px;">
          📋 COPY ALL — WHATSAPP SHEET
        </button>

        <button class="primary" id="taskAdminRefresh"
                style="width:100%;margin-top:10px;">
          🔄 REFRESH
        </button>

        <div id="taskAdminSummary" style="margin-top:12px;"></div>
      </div>

      <div id="taskAdminList"></div>

      <button class="danger" id="taskAdminBack"
              style="width:100%;margin-top:14px;">
        ⬅️ BACK TO ADMIN
      </button>

    </div>
  `;

  $('taskAdminRefresh').onclick = loadFamilyTaskAdmin;
  $('taskAdminCopyAll').onclick = copyAllFamilyTaskSheet;

  $('taskAdminBack').onclick = () => {
    document.body.innerHTML =
      '<div class="wrap"><section class="card"><h2>Loading Admin Dashboard...</h2></section></div>';
    adminLoad();
  };

  await loadFamilyTaskAdmin();
}

async function getFamilyTaskRequests(){
  const requests = [];

  for(const task of HOC_FAMILY_TASKS){
    const snap =
      await get(ref(db, `familyTaskCompletions/${task.id}`));

    const data = snap.val() || {};

    Object.entries(data).forEach(([key, item]) => {
      const row = {
        ...(item || {}),
        _key: key,
        _task: task
      };

      requests.push(row);
    });
  }

  return requests;
}

function groupFamilyTaskRequests(rows){
  const groups = {};

  rows.forEach(row => {
    const task = row._task;
    const memberId = familyTaskMemberKey(row, task);

    if(!memberId) return;

    const groupKey = taskSafeId(memberId);

    if(!groups[groupKey]){
      groups[groupKey] = {
        memberId,
        memberName: familyTaskMemberName(row, task),
        tasks: []
      };
    }

    groups[groupKey].tasks.push(row);
  });

  return Object.values(groups).sort((a,b) =>
    String(a.memberName).localeCompare(String(b.memberName))
  );
}

async function loadFamilyTaskAdmin(){
  if(!isAdmin(auth.currentUser)) return;

  const allRows = await getFamilyTaskRequests();

  // Admin's main sheet shows requests which still need to be handled.
  // Approved records remain visible until the Admin deletes the record.
  const rows = allRows.filter(row =>
    String(row.status || "PENDING") !== "REJECTED"
  );

  const groups = groupFamilyTaskRequests(rows);

  let pendingDiamond = 0;
  let approvedDiamond = 0;
  let totalMembers = groups.length;

  groups.forEach(group => {
    group.tasks.forEach(row => {
      const d = Number(row._task.diamond || row.diamond || 0);
      if(String(row.status || "PENDING") === "COMPLETED")
        approvedDiamond += d;
      else
        pendingDiamond += d;
    });
  });

  $('taskAdminSummary').innerHTML = `
    <div style="
      background:#182233;
      border:1px solid #2b3b55;
      border-radius:14px;
      padding:13px;
      line-height:1.55;
    ">
      👥 Members: <b>${totalMembers}</b><br>
      ⏳ Pending Diamond: <b style="color:#f2c14e;">${pendingDiamond}</b><br>
      ✅ Approved / Gift Given: <b style="color:#00e676;">${approvedDiamond}</b>
    </div>
  `;

  if(!groups.length){
    $('taskAdminList').innerHTML = `
      <div class="card">
        <h3>📭 No Task Records</h3>
        <p>Member කෙනෙක් Task එකක් submit කළ පසු එය මෙතැනින් Member-wise පෙන්වයි.</p>
      </div>
    `;
    return;
  }

  $('taskAdminList').innerHTML = groups.map((group, index) => {
    const total = group.tasks.reduce(
      (sum,row) => sum + Number(row._task.diamond || row.diamond || 0), 0
    );

    const pending = group.tasks.filter(row =>
      String(row.status || "PENDING") === "PENDING"
    );

    const completed = group.tasks.filter(row =>
      String(row.status || "PENDING") === "COMPLETED"
    );

    const borderColor = pending.length ? "#f2c14e" : "#00e676";

    return `
      <div class="card" style="
        border:2px solid ${borderColor};
        margin-bottom:18px;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          flex-wrap:wrap;
        ">
          <h2 style="color:#f2c14e;margin:0;">
            👤 ${taskEsc(group.memberName)}
          </h2>

          <button class="primary"
                  data-copy-member="${index}"
                  style="width:auto;padding:10px 14px;">
            📋 Copy
          </button>
        </div>

        <p style="margin:7px 0 15px;font-size:17px;">
          🆔 <b>${taskEsc(group.memberId)}</b>
        </p>

        <div style="
          background:#182233;
          border-radius:14px;
          padding:12px;
          margin-bottom:12px;
        ">
          ${group.tasks.map(row => {
            const task = row._task;
            const status = String(row.status || "PENDING");
            const diamond = Number(task.diamond || row.diamond || 0);

            const referralExtra = task.referral ? `
              <div style="font-size:13px;margin-top:5px;">
                👤 New Member:
                <b>${taskEsc(row.referredName || "-")}</b>
                (${taskEsc(row.referredId || "-")})
              </div>
            ` : "";

            return `
              <div style="
                padding:12px 4px;
                border-bottom:1px solid #30405a;
              ">
                <div style="font-size:18px;">
                  🎯 <b>Task ${String(task.id).padStart(2,"0")}</b>
                </div>

                <div style="
                  color:#00e676;
                  font-size:20px;
                  font-weight:bold;
                  margin-top:4px;
                ">
                  💎 Diamond ${diamond}
                </div>

                <div style="font-size:13px;margin-top:4px;">
                  📌 ${status === "COMPLETED"
                    ? '<span style="color:#00e676;"><b>GIFT GIVEN</b></span>'
                    : '<span style="color:#f2c14e;"><b>PENDING</b></span>'}
                  &nbsp; | &nbsp;
                  🕒 ${taskEsc(
                    familyTaskTime(row.completedAt || row.submittedAt)
                  )}
                </div>

                ${referralExtra}

                ${status === "PENDING" ? `
                  <button class="ok"
                          data-task-approve="${task.id}"
                          data-key="${taskEsc(row._key)}"
                          style="width:100%;margin-top:10px;">
                    🎁 GIFT GIVEN — APPROVE
                  </button>
                ` : `
                  <button class="danger"
                          data-task-delete="${task.id}"
                          data-key="${taskEsc(row._key)}"
                          style="width:100%;margin-top:10px;">
                    🗑️ DELETE THIS RECORD
                  </button>
                `}
              </div>
            `;
          }).join("")}
        </div>

        <div style="
          background:#101a28;
          border-radius:14px;
          padding:14px;
          text-align:center;
        ">
          <div style="font-size:16px;">💎 TOTAL DIAMOND</div>
          <div style="
            color:#00e676;
            font-size:30px;
            font-weight:bold;
          ">
            ${total}
          </div>
        </div>

        <button class="primary"
                data-copy-member="${index}"
                style="width:100%;margin-top:12px;">
          📋 COPY ${taskEsc(group.memberName)} SHEET
        </button>

      </div>
    `;
  }).join("");

  // Keep groups available for the copy buttons.
  window.__HOC_FAMILY_TASK_GROUPS__ = groups;

  document.querySelectorAll("[data-copy-member]").forEach(btn => {
    btn.onclick = () => {
      const i = Number(btn.dataset.copyMember);
      copyFamilyTaskMemberSheet(groups[i]);
    };
  });

  document.querySelectorAll("[data-task-approve]").forEach(btn => {
    btn.onclick = () => approveFamilyTask(
      Number(btn.dataset.taskApprove),
      btn.dataset.key
    );
  });

  document.querySelectorAll("[data-task-delete]").forEach(btn => {
    btn.onclick = () => deleteFamilyTaskRecord(
      Number(btn.dataset.taskDelete),
      btn.dataset.key
    );
  });
}

function familyTaskMemberText(group){
  const lines = [];

  lines.push(`👤 ${group.memberName} (${group.memberId})`);
  lines.push("");

  let total = 0;

  group.tasks.forEach(row => {
    const task = row._task;
    const diamond = Number(task.diamond || row.diamond || 0);
    total += diamond;

    lines.push(
      `🎯 Task ${String(task.id).padStart(2,"0")} - 💎 Diamond ${diamond}`
    );
  });

  lines.push("");
  lines.push(`💎 Total Diamond : ${total}`);
  lines.push("--------------------------------");

  return lines.join("\n");
}

async function copyFamilyTaskMemberSheet(group){
  if(!group) return;

  const text = familyTaskMemberText(group);

  try{
    await navigator.clipboard.writeText(text);
    alert(
      "✅ " + group.memberName +
      " ගේ Task Sheet එක Copy කළා!\n\n" +
      "දැන් WhatsApp එකට Paste කරන්න."
    );
  }catch(error){
    window.prompt(
      "Copy කරන්න පහත text එක select කරන්න:",
      text
    );
  }
}

async function copyAllFamilyTaskSheet(){
  const groups = window.__HOC_FAMILY_TASK_GROUPS__ || [];

  if(!groups.length){
    return alert("📭 Copy කිරීමට Task Records නැහැ.");
  }

  const lines = [];

  lines.push("📋 HOC FAMILY TASK GIFT SHEET");
  lines.push("================================");
  lines.push("");

  let grandTotal = 0;

  groups.forEach((group, index) => {
    lines.push(`${index + 1}. ${familyTaskMemberText(group)}`);

    group.tasks.forEach(row => {
      grandTotal += Number(
        row._task.diamond || row.diamond || 0
      );
    });
  });

  lines.push(`💎 GRAND TOTAL : ${grandTotal}`);
  lines.push("================================");

  const text = lines.join("\n");

  try{
    await navigator.clipboard.writeText(text);
    alert(
      "✅ සියලුම Members ගේ Gift Sheet එක Copy කළා!\n\n" +
      "දැන් WhatsApp එකට Paste කරන්න."
    );
  }catch(error){
    window.prompt(
      "Copy කරන්න පහත text එක select කරන්න:",
      text
    );
  }
}

async function approveFamilyTask(taskId, requestKey){
  if(!isAdmin(auth.currentUser))
    return alert("❌ Admin login required.");

  const task = HOC_FAMILY_TASKS.find(t => t.id === taskId);
  if(!task) return;

  try{
    const requestRef =
      ref(db, `familyTaskCompletions/${taskId}/${requestKey}`);

    const snap = await get(requestRef);

    if(!snap.exists())
      return alert("❌ Request එක හමු වුණේ නැහැ.");

    const request = snap.val() || {};

    if(request.status === "COMPLETED"){
      return alert("⚠️ මේ Task එක දැනටමත් Gift Given ලෙස mark කරලා තියෙනවා.");
    }

    if(request.status === "REJECTED"){
      return alert("⚠️ මේ Request එක reject කරලා තියෙනවා.");
    }

    const receiverId = task.referral
      ? String(request.referrerId || "").trim()
      : String(request.appId || "").trim();

    if(!/^\d+$/.test(receiverId)){
      return alert("❌ Reward ලබාදීමට valid App ID එකක් නැහැ.");
    }

    const safeMemberId = taskSafeId(receiverId);
    const rewardKey =
      `task_${taskId}_${taskSafeId(requestKey)}`;

    const rewardRef =
      ref(db, `familyGiftRewards/${safeMemberId}/${rewardKey}`);

    const rewardSnap = await get(rewardRef);

    if(rewardSnap.exists()){
      await update(requestRef, {
        status: "COMPLETED",
        rewardGiven: true,
        approvedAt: Date.now(),
        approvedBy: auth.currentUser.email
      });

      alert(
        "⚠️ Reward record එක දැනටමත් තිබෙනවා.\n" +
        "Request එක Gift Given ලෙස mark කළා."
      );

      await loadFamilyTaskAdmin();
      return;
    }

    const balanceRef =
      ref(db, `familyGiftBalances/${safeMemberId}`);

    const balanceSnap = await get(balanceRef);
    const balance =
      balanceSnap.exists() ? (balanceSnap.val() || {}) : {};

    const currentDiamonds =
      Number(balance.diamonds || 0);

    const newDiamonds =
      currentDiamonds + Number(task.diamond || 0);

    await set(rewardRef, {
      taskId,
      taskTitle: task.title,
      memberName:
        task.referral
          ? request.referrerName
          : request.name,
      memberId: receiverId,
      diamond: Number(task.diamond || 0),
      gift: task.gift,
      status: "APPROVED",
      approvedAt: Date.now(),
      approvedBy: auth.currentUser.email
    });

    await set(balanceRef, {
      ...balance,
      memberName:
        task.referral
          ? request.referrerName
          : request.name,
      memberId: receiverId,
      diamonds: newDiamonds,
      updatedAt: Date.now()
    });

    await update(requestRef, {
      status: "COMPLETED",
      rewardGiven: true,
      approvedAt: Date.now(),
      approvedBy: auth.currentUser.email
    });

    alert(
      "✅ Gift Given!\n\n" +
      "👤 " +
      (task.referral
        ? request.referrerName
        : request.name) +
      "\n🆔 " + receiverId +
      "\n🎁 " + task.gift +
      "\n💎 New Diamond Balance: " +
      newDiamonds +
      "\n\nදැන් අවශ්‍ය නම් මේ Record එක Delete කරන්න පුළුවන්."
    );

    await loadFamilyTaskAdmin();

  }catch(err){
    console.error("TASK APPROVE ERROR:", err);
    alert("❌ Task approve failed: " + err.message);
  }
}

async function deleteFamilyTaskRecord(taskId, requestKey){
  if(!isAdmin(auth.currentUser))
    return alert("❌ Admin login required.");

  const requestRef =
    ref(db, `familyTaskCompletions/${taskId}/${requestKey}`);

  try{
    const snap = await get(requestRef);

    if(!snap.exists())
      return alert("❌ Record එක හමු වුණේ නැහැ.");

    const row = snap.val() || {};

    if(row.status !== "COMPLETED" || row.rewardGiven !== true){
      return alert(
        "⚠️ Gift Given / Approved නොවූ Record එකක් Delete කරන්න බැහැ."
      );
    }

    const task =
      HOC_FAMILY_TASKS.find(t => t.id === taskId);

    const memberName =
      task ? familyTaskMemberName(row, task) : (row.name || "-");

    if(!confirm(
      "🗑️ Record Delete කරන්නද?\n\n" +
      "👤 " + memberName +
      "\n🎯 Task " + String(taskId).padStart(2,"0") +
      "\n\nGift එක දැනටමත් ලබාදී ඇති බව තහවුරු කරගන්න."
    )){
      return;
    }

    await set(requestRef, null);

    alert(
      "🗑️ Record එක Delete කළා.\n\n" +
      "Gift Balance එකෙන් අඩු කරන්නේ නැහැ."
    );

    await loadFamilyTaskAdmin();

  }catch(error){
    console.error("TASK DELETE ERROR:", error);
    alert("❌ Record delete failed: " + error.message);
  }
}


function managedEvent(){
  const id=$('manageEvent')?.value;
  return EVENTS.find(e=>String(e['Event ID'])===String(id));
}
function refreshManageButton(){
  const e=managedEvent();
  if(!$('toggleEventBtn')||!e) return;
  $('toggleEventBtn').textContent=e.Status==='CLOSED'?'🔓 REOPEN REGISTRATION':'🔒 CLOSE REGISTRATION';
}
function openEditEvent(){
  const e=managedEvent();
  if(!e) return alert('❌ Select an event.');
  $('editPanel').innerHTML=`<div class="card">
    <input id="eName" placeholder="Event Name" value="${esc(e.Name)}">
    <input id="eOrg" placeholder="Organizer" value="${esc(e.Organizer)}">
    <input id="eDate" type="date" value="${esc(e.Date)}">
    <input id="eTime" placeholder="Event Time" value="${esc(e.Time)}">
    <input id="eGroup" placeholder="Group" value="${esc(e.Group)}">
    <input id="eBanner" placeholder="Banner Image URL" value="${esc(e['Banner URL'])}">
    <input id="eT1" placeholder="Team 1 Name" value="${esc(e['Team 1 Name'])}">
    <input id="eL1" type="number" min="${Number(e.team1Count||0)}" value="${Number(e['Team 1 Limit']||0)}">
    <input id="eT2" placeholder="Team 2 Name" value="${esc(e['Team 2 Name'])}">
    <input id="eL2" type="number" min="${Number(e.team2Count||0)}" value="${Number(e['Team 2 Limit']||0)}">
    <button class="ok" id="saveEditBtn" style="width:100%">💾 SAVE CHANGES</button>
  </div>`;
  $('saveEditBtn').onclick=saveEventChanges;
}
async function saveEventChanges(){
  const e=managedEvent();
  if(!e || !isAdmin(auth.currentUser)) return alert('❌ Admin login required.');
  const l1=Number($('eL1').value), l2=Number($('eL2').value);
  if(l1<Number(e.team1Count||0)||l2<Number(e.team2Count||0)) return alert('❌ Team limit cannot be lower than registered member count.');
  try{
    await update(ref(db,`events/${slug(e['Event ID'])}`),{
      Name:$('eName').value.trim(),Organizer:$('eOrg').value.trim(),Date:$('eDate').value,Time:$('eTime').value.trim(),
      Group:$('eGroup').value.trim(),'Banner URL':$('eBanner').value.trim(),'Team 1 Name':$('eT1').value.trim(),
      'Team 1 Limit':l1,'Team 2 Name':$('eT2').value.trim(),'Team 2 Limit':l2
    });
    alert('✅ Event updated successfully.');
    await load(); await adminLoad();
  }catch(err){ alert('❌ Update failed: '+err.message); }
}
async function toggleRegistration(){
  const e=managedEvent();
  if(!e || !isAdmin(auth.currentUser)) return alert('❌ Admin login required.');
  const next=e.Status==='CLOSED'?'OPEN':'CLOSED';
  if(!confirm(next==='CLOSED'?'Close registration for this event?':'Reopen registration for this event?')) return;
  try{
    await update(ref(db,`events/${slug(e['Event ID'])}`),{Status:next});
    alert(next==='CLOSED'?'🔒 Registration closed.':'🔓 Registration reopened.');
    await load(); await adminLoad();
  }catch(err){ alert('❌ Status update failed: '+err.message); }
}
async function deleteEvent(){
  const e=managedEvent();
  if(!e || !isAdmin(auth.currentUser)) return alert('❌ Admin login required.');
  if(!confirm(`DELETE "${e.Name}"? This will also remove its registered members.`)) return;
  if(!confirm('⚠️ Final confirmation: permanently delete this event?')) return;
  try{
    await set(ref(db,`members/${slug(e['Event ID'])}`),null);
    await set(ref(db,`events/${slug(e['Event ID'])}`),null);
    alert('🗑️ Event deleted.');
    await load(); await adminLoad();
  }catch(err){ alert('❌ Delete failed: '+err.message); }
}


async function viewMembers(){
  if(!isAdmin(auth.currentUser)) return alert('❌ Admin login required.');
  const id=$('memberEvent').value;
  const e=EVENTS.find(x=>String(x['Event ID'])===String(id));
  const snap=await get(ref(db,`members/${slug(id)}`));
  const ms=Object.entries(snap.val()||{});
  const render=(team,label)=>{
    const arr=ms.filter(([,m])=>String(m.Team)===team);
    return `<h3>👥 ${esc(label)} (${arr.length})</h3>`+(arr.length?arr.map(([key,m],i)=>`<div class="card"><b>Position #${i+1}</b><p>Name: ${esc(m.Name)}<br>App ID: ${esc(m['App ID'])}</p><button class="danger" data-remove="${esc(key)}" data-event="${esc(id)}" data-team="${team}">REMOVE MEMBER</button></div>`).join(''):'<p>No members.</p>');
  };
  $('memberList').innerHTML=render('1',e['Team 1 Name'])+render('2',e['Team 2 Name']);
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeMember(b.dataset.event,b.dataset.remove,b.dataset.team));
}
async function removeMember(id,key,team){
  if(!confirm('Remove this member?')) return;
  try{
    await set(ref(db,`members/${slug(id)}/${key}`),null);
    const field=team==='1'?'team1Count':'team2Count';
    await runTransaction(ref(db,`events/${slug(id)}/${field}`),v=>Math.max(0,Number(v||0)-1));
    alert('✅ Member removed.');
    await load(); await adminLoad();
    $('memberEvent').value=id; await viewMembers();
  }catch(err){ alert('❌ Remove failed: '+err.message); }
}

async function createEvent(){
  if(!isAdmin(auth.currentUser)) return alert('❌ Admin login required.');
  const id='EVT-'+Date.now(), key=slug(id);
  await set(ref(db,`events/${key}`),{
    'Event ID':id,Name:$('cName').value,Organizer:$('cOrg').value,Date:$('cDate').value,Time:$('cTime').value,
    Group:$('cGroup').value,'Banner URL':$('cBanner').value,'Team 1 Name':$('cT1').value,'Team 1 Limit':Number($('cL1').value),
    'Team 2 Name':$('cT2').value,'Team 2 Limit':Number($('cL2').value),team1Count:0,team2Count:0,Status:'OPEN','List Received':'NO'
  });
  alert('✅ Event Created'); await load(); await adminLoad();
}

async function copyList(id,team){
  const e=EVENTS.find(x=>String(x['Event ID'])===String(id)), snap=await get(ref(db,`members/${slug(id)}`));
  const ms=Object.values(snap.val()||{}).filter(m=>String(m.Team)===String(team));
  let text=`🏆 ${e.Name} 🏆\n🌟 ${e.Organizer} 🌟\n\n📅 තරගය පවත්වන දිනය: ${e.Date}\n⏰ වේලාව: ${e.Time}\n\n👥 ${team==='1'?e['Team 1 Name']:e['Team 2 Name']}\n\n👥 සමූහයේ නම: ${e.Group}\n\n`+ms.map((m,i)=>`${i+1}. නම: ${m.Name}\n   ID No: ${m['App ID']}`).join('\n\n');
  await navigator.clipboard.writeText(text); alert('📋 List copied!');
}


async function restoreHistory(id){
  if(!confirm('Restore this event to active workflow?')) return;
  try{await update(ref(db,'events/'+id),{'List Received':'NO',alert:'FULL'});alert('♻️ Event restored.');await load();await adminLoad();showFullEventAlert()}
  catch(e){alert('❌ Restore failed: '+e.message)}
}
async function deleteHistory(id){
  if(!confirm('Permanently delete this completed event and member history?')) return;
  try{await set(ref(db,'members/'+id),null);await set(ref(db,'events/'+id),null);alert('🗑️ History deleted permanently.');await load();await adminLoad();showFullEventAlert()}
  catch(e){alert('❌ History delete failed: '+e.message)}
}
async function received(id){
  if(!isAdmin(auth.currentUser)) return alert('❌ Admin login required.');
  await update(ref(db,`events/${slug(id)}`),{'List Received':'YES'});
  alert('✅ Marked as received'); await load(); await adminLoad();
}


function showFullEventAlert(){
  if(!isAdmin(auth.currentUser)) return;
  const urgent=EVENTS.filter(e=>e.alert==='FULL'&&e['List Received']!=='YES');
  const fresh=urgent.find(e=>!FULL_ALERT_SHOWN.has(String(e['Event ID'])));
  if(!fresh) return;
  FULL_ALERT_SHOWN.add(String(fresh['Event ID']));
  $('fullAlertText').innerHTML=`<b>${esc(fresh.Name)}</b><br><br>Team 01: ${fresh.team1Count}/${fresh['Team 1 Limit']}<br>Team 02: ${fresh.team2Count}/${fresh['Team 2 Limit']}<br><br>📋 Member list is ready.`;
  $('fullAlertOpen').onclick=()=>{ $('fullAlertDlg').close(); document.querySelector('.admin').scrollIntoView({behavior:'smooth'}); };
  $('fullAlertDlg').showModal();
}

onAuthStateChanged(auth,user=>{
  const ok=isAdmin(user);
  $('adminEmail').style.display=ok?'none':'block'; $('adminPassword').style.display=ok?'none':'block';
  $('loginBtn').style.display=ok?'none':'block'; $('logoutBtn').style.display=ok?'block':'none';
  $('authStatus').innerHTML=ok?'<small>✅ HOC Admin signed in.</small>':'<small>Admin login required.</small>';
  if(ok){ adminLoad(); setTimeout(showFullEventAlert,300); } else $('admin').innerHTML='';
});
window.submitJoin=submitJoin; window.adminLogin=adminLogin; window.adminLogout=adminLogout;
load();
setInterval(load,15000);
