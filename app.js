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
  "danuuhoc@gmail.com",
  "kasunhoc@gmail.com"
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
  `<h3>👥 REGISTERED MEMBERS</h3><div class="card"><select id="memberEvent"></select><button class="primary" id="viewMembersBtn">VIEW REGISTERED MEMBERS</button><div id="memberList"></div></div>
  <h3>⚙️ EVENT MANAGEMENT</h3><div class="card"><select id="manageEvent"></select><button class="primary" id="editEventBtn">✏️ EDIT EVENT</button><button class="danger" id="toggleEventBtn" style="width:100%;margin-top:8px">🔒 CLOSE REGISTRATION</button><button class="danger" id="deleteEventBtn" style="width:100%;margin-top:8px">🗑️ DELETE EVENT</button><div id="editPanel"></div></div>
  <h3>➕ CREATE EVENT</h3><div class="card"><input id="cName" placeholder="Event Name"><input id="cOrg" placeholder="Organizer"><input id="cDate" type="date"><input id="cTime" placeholder="Event Time"><input id="cGroup" value="Haven Of Ceylon"><input id="cBanner" placeholder="Banner Image URL"><input id="cT1" value="Main Team"><input id="cL1" type="number" value="10"><input id="cT2" value="Team 02"><input id="cL2" type="number" value="10"><button class="primary" id="createBtn">CREATE EVENT</button></div>`;
  $('createBtn').onclick=createEvent;
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