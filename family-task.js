// ==========================================
// HOC FAMILY TASK SYSTEM V3
// Firebase + Member Completion Forms
// ==========================================

import {
    initializeApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// ==========================================
// FIREBASE CONFIG
// Re-use the existing Firebase app if app.js
// has already initialized the default app.
// ==========================================

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

// ==========================================
// FAMILY TASK DATA
// ==========================================

const FAMILY_TASKS = [
    {
        id: 1,
        title: "Main Family Room Task",
        gift: "Diamond 30"
    },
    {
        id: 2,
        title: "Target Task",
        gift: "Diamond 3000"
    },
    {
        id: 3,
        title: "Target Level 03",
        gift: "Diamond 300"
    },
    {
        id: 4,
        title: "Host Target Task",
        gift: "Diamond 600"
    },
    {
        id: 5,
        title: "Referral Task",
        gift: "Diamond 300",
        referral: true
    }
];

// ==========================================
// SAFE FIREBASE KEY
// ==========================================

function safeId(value) {
    return String(value || "").replace(/[.#$[\\]/]/g, "_");
}

// ==========================================
// OPEN FAMILY TASK PAGE
// ==========================================

function openFamilyTaskPage() {
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
                    style="margin-top:20px;width:100%;">
                ⬅️ Back
            </button>
        </div>
    `;

    loadFamilyTasks();
}

// ==========================================
// LOAD TASKS
// ==========================================

function loadFamilyTasks() {
    const box = document.getElementById("familyTaskList");
    if (!box) return;

    box.innerHTML = FAMILY_TASKS.map(task => `
        <div class="card" style="
            margin-bottom:18px;
            border:2px solid #f2c14e;
        ">
            <h2 style="color:#f2c14e;margin-bottom:10px;">
                🎯 Family Task ${String(task.id).padStart(2, "0")}
            </h2>

            <p style="font-size:18px;line-height:1.6;">
                <b>Task:</b> ${task.title}
            </p>

            <h2 style="color:#00e676;margin-top:10px;">
                🎁 ${task.gift}
            </h2>

            <button class="primary"
                    onclick="openTaskCompleteForm(${task.id})"
                    style="width:100%;margin-top:10px;font-size:18px;">
                📋 Task Details / ඉවර කර ඇත
            </button>
        </div>
    `).join("");
}

// ==========================================
// OPEN TASK COMPLETION FORM
// ==========================================

function openTaskCompleteForm(taskId) {
    const task = FAMILY_TASKS.find(t => t.id === taskId);
    if (!task) return;

    if (task.referral) {
        openReferralForm();
        return;
    }

    document.body.innerHTML = `
        <div class="wrap">
            <div class="card">
                <h2 style="color:#f2c14e;text-align:center;">
                    🎯 Family Task ${String(task.id).padStart(2, "0")}
                </h2>

                <h3 style="text-align:center;line-height:1.5;">
                    ${task.title}
                </h3>

                <div style="
                    background:#182233;
                    padding:15px;
                    border-radius:15px;
                    margin:20px 0;
                    text-align:center;
                ">
                    <div style="font-size:18px;">🎁 Gift</div>
                    <h2 style="color:#00e676;margin-bottom:0;">
                        ${task.gift}
                    </h2>
                </div>

                <p style="line-height:1.6;">
                    Task එක සම්පූර්ණ කළ පසු ඔබගේ Name සහ App ID ඇතුළත් කර
                    Request එක Submit කරන්න.
                </p>

                <label>👤 User Name</label>
                <input id="taskUserName"
                       type="text"
                       placeholder="ඔබගේ User Name"
                       style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

                <label>🆔 App ID</label>
                <input id="taskAppId"
                       type="text"
                       inputmode="numeric"
                       placeholder="ඔබගේ App ID"
                       style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

                <button class="primary"
                        onclick="submitNormalTask(${task.id})"
                        style="width:100%;font-size:18px;">
                    📤 Submit Task Request
                </button>

                <button class="danger"
                        onclick="openFamilyTaskPage()"
                        style="width:100%;margin-top:12px;">
                    ⬅️ Back
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// NORMAL TASK SUBMIT
// ==========================================

async function submitNormalTask(taskId) {
    const task = FAMILY_TASKS.find(t => t.id === taskId);
    if (!task) return;

    const name = document.getElementById("taskUserName")?.value.trim();
    const appId = document.getElementById("taskAppId")?.value.trim();

    if (!name || !appId) {
        alert("⚠️ User Name සහ App ID දෙකම ඇතුළත් කරන්න.");
        return;
    }

    if (!/^\d+$/.test(appId)) {
        alert("❌ App ID එකට අංක පමණක් ඇතුළත් කරන්න.");
        return;
    }

    const memberId = safeId(appId);
    const taskRef = ref(db, `familyTaskCompletions/${taskId}/${memberId}`);

    try {
        const snapshot = await get(taskRef);

        if (snapshot.exists()) {
            alert("⚠️ මෙම App ID එකෙන් මෙම Task එක දැනටමත් Submit කර ඇත.");
            return;
        }

        await set(taskRef, {
            taskId: task.id,
            taskTitle: task.title,
            name,
            appId,
            gift: task.gift,
            status: "PENDING",
            completedAt: Date.now()
        });

        // Referral reward becomes eligible only when the referred member
        // submits Task 02. The reward is recorded in the gift balance once.
        if (task.id === 2) {
            await unlockReferralReward(memberId);
        }

        alert(
            "✅ Task Completion Request සාර්ථකව Submit කළා!\n\n" +
            "👤 Name: " + name +
            "\n🆔 App ID: " + appId +
            "\n🎁 Gift: " + task.gift +
            "\n\n⏳ Status: PENDING"
        );

        openFamilyTaskPage();
    } catch (error) {
        console.error(error);
        alert("❌ Task submit කිරීමේදී දෝෂයක් ඇතිවිය.\n\n" + error.message);
    }
}

// ==========================================
// REFERRAL TASK FORM
// ==========================================

function openReferralForm() {
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
                    ⚠️ Referral Gift එක ලැබෙන්නේ
                    <b>අලුත් Member Task 02 Complete කළ පසු පමණි.</b><br><br>
                    ⏳ Task 02 තවම Complete නැත්නම් Referral එක
                    <b>PENDING</b> ලෙස Save වේ.
                </div>

                <label>👤 ඔබගේ User Name</label>
                <input id="referrerName" type="text" placeholder="ඔබගේ User Name"
                       style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

                <label>🆔 ඔබගේ App ID</label>
                <input id="referrerId" type="text" inputmode="numeric" placeholder="ඔබගේ App ID"
                       style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

                <label>👤 අලුත් Member ගේ Name</label>
                <input id="referredName" type="text" placeholder="අලුත් Member ගේ Name"
                       style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

                <label>🆔 අලුත් Member ගේ App ID</label>
                <input id="referredId" type="text" inputmode="numeric" placeholder="අලුත් Member ගේ App ID"
                       style="width:100%;padding:14px;margin:8px 0 15px;border-radius:10px;box-sizing:border-box;">

                <button class="primary"
                        onclick="submitReferralTask()"
                        style="width:100%;font-size:18px;">
                    📤 Referral Submit කරන්න
                </button>

                <button class="danger"
                        onclick="openFamilyTaskPage()"
                        style="width:100%;margin-top:12px;">
                    ⬅️ Back
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// REFERRAL REWARD UNLOCKER
// ==========================================

async function unlockReferralReward(referredSafeId) {
    const referralRef = ref(db, `familyTaskCompletions/5/${referredSafeId}`);
    const referralSnapshot = await get(referralRef);

    if (!referralSnapshot.exists()) return false;

    const referral = referralSnapshot.val() || {};

    if (referral.rewardGranted === true || referral.status === "COMPLETED") {
        return false;
    }

    const referrerId = String(referral.referrerId || "").trim();
    if (!/^\d+$/.test(referrerId)) return false;

    const referrerSafeId = safeId(referrerId);
    const rewardRef = ref(db, `familyGiftBalances/${referrerSafeId}/diamond`);

    await runTransaction(rewardRef, current => {
        return Number(current || 0) + 300;
    });

    const now = Date.now();

    await update(referralRef, {
        status: "COMPLETED",
        rewardGranted: true,
        reward: "Diamond 300",
        rewardGrantedAt: now,
        trigger: "Task 02 Completed",
        task02CompletedAt: now
    });

    await set(
        ref(db, `referralRewardLogs/${referrerSafeId}/${referredSafeId}`),
        {
            taskId: 5,
            referrerName: referral.referrerName || "",
            referrerId,
            referredName: referral.referredName || "",
            referredId: referral.referredId || "",
            reward: "Diamond 300",
            status: "COMPLETED",
            reason: "Referred member completed Family Task 02",
            completedAt: now
        }
    );

    return true;
}

// ==========================================
// SUBMIT REFERRAL
// ==========================================

async function submitReferralTask() {
    const referrerName = document.getElementById("referrerName")?.value.trim();
    const referrerId = document.getElementById("referrerId")?.value.trim();
    const referredName = document.getElementById("referredName")?.value.trim();
    const referredId = document.getElementById("referredId")?.value.trim();

    if (!referrerName || !referrerId || !referredName || !referredId) {
        alert("⚠️ සියලුම විස්තර ඇතුළත් කරන්න.");
        return;
    }

    if (!/^\d+$/.test(referrerId) || !/^\d+$/.test(referredId)) {
        alert("❌ App ID වලට අංක පමණක් ඇතුළත් කරන්න.");
        return;
    }

    if (referrerId === referredId) {
        alert("❌ ඔබගේම App ID එක Referral Member ලෙස ඇතුළත් කරන්න බැහැ.");
        return;
    }

    const referredSafeId = safeId(referredId);
    const referralRef = ref(db, `familyTaskCompletions/5/${referredSafeId}`);

    try {
        const referralSnapshot = await get(referralRef);

        if (referralSnapshot.exists()) {
            const existing = referralSnapshot.val() || {};
            alert(
                existing.rewardGranted === true || existing.status === "COMPLETED"
                    ? "⚠️ මෙම Member සඳහා Referral Gift එක දැනටමත් ලබාදී ඇත."
                    : "⚠️ මෙම Member සඳහා Referral එක දැනටමත් PENDING ලෙස ඇත.\n\nTask 02 Complete වූ පසු Diamond 300 unlock වේ."
            );
            return;
        }

        await set(referralRef, {
            taskId: 5,
            taskTitle: "Referral Task",
            referrerName,
            referrerId,
            referredName,
            referredId,
            gift: "Diamond 300",
            status: "PENDING",
            rewardGranted: false,
            submittedAt: Date.now()
        });

        // If Task 02 was completed before the referral was submitted,
        // unlock the reward immediately.
        const task02Ref = ref(db, `familyTaskCompletions/2/${referredSafeId}`);
        const task02Snapshot = await get(task02Ref);
        let unlocked = false;

        if (task02Snapshot.exists()) {
            unlocked = await unlockReferralReward(referredSafeId);
        }

        if (unlocked) {
            alert(
                "✅ Referral Submit සාර්ථකයි!\n\n" +
                "👤 ඔබ: " + referrerName +
                "\n🆔 ඔබගේ ID: " + referrerId +
                "\n\n👤 New Member: " + referredName +
                "\n🆔 New Member ID: " + referredId +
                "\n\n🎁 Diamond 300 Referral Gift එක unlock විය."
            );
        } else {
            alert(
                "✅ Referral එක සාර්ථකව Submit කළා!\n\n" +
                "👤 ඔබ: " + referrerName +
                "\n🆔 ඔබගේ ID: " + referrerId +
                "\n\n👤 New Member: " + referredName +
                "\n🆔 New Member ID: " + referredId +
                "\n\n⏳ Status: PENDING\n" +
                "🎁 Diamond 300 ලැබෙන්නේ New Member Task 02 Complete කළ පසුවයි."
            );
        }

        openFamilyTaskPage();
    } catch (error) {
        console.error(error);
        alert("❌ Referral submit කිරීමේදී දෝෂයක් ඇතිවිය.\n\n" + error.message);
    }
}

// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.openFamilyTaskPage = openFamilyTaskPage;
window.openTaskCompleteForm = openTaskCompleteForm;
window.submitNormalTask = submitNormalTask;
window.openReferralForm = openReferralForm;
window.submitReferralTask = submitReferralTask;

// Bind the Home -> Family Tasks button directly. This avoids relying on
// inline onclick handlers and guarantees member access after the module loads.
const familyTasksButton = document.getElementById("btnFamilyTasks");
if (familyTasksButton) {
    familyTasksButton.onclick = openFamilyTaskPage;
    familyTasksButton.removeAttribute("onclick");
}
