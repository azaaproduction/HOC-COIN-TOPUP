// ==========================================
// HOC FAMILY TASK SYSTEM V2
// Firebase + Completion Form
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    set
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyDH0umICWs9JD3bSONRVW_h_RW_yH_HMw",
    authDomain: "hoc-family-port.firebaseapp.com",
    databaseURL: "https://hoc-family-port-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hoc-family-port",
    storageBucket: "hoc-family-port.firebasestorage.app",
    messagingSenderId: "658601137394",
    appId: "1:658601137394:web:112cc4e10b85f85490ac6b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// ==========================================
// FAMILY TASK DATA
// ==========================================

const FAMILY_TASKS = [

    {
        id: 1,
        title: "Account එක නිතරම Online තියන ඔබට අපෙන් හිමිවන Gift",
        gift: "Diamond 30",
        banner: ""
    },

    {
        id: 2,
        title: "Target Level 01 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift",
        gift: "Diamond 3000",
        banner: ""
    },

    {
        id: 3,
        title: "Target Level 02 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift",
        gift: "Diamond 300",
        banner: ""
    },

    {
        id: 4,
        title: "Target Level 03 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift",
        gift: "Diamond 600",
        banner: ""
    },

    {
        id: 5,
        title: "ඔබ App එකට එකතු කරන අයට අපි ලබාදෙන Gift",
        gift: "Diamond 300",
        banner: "",
        referral: true
    }

];


// ==========================================
// OPEN FAMILY TASK PAGE
// ==========================================

function openFamilyTaskPage() {

    document.body.innerHTML = `

    <div class="wrap">

        <div class="card">

            <h1 style="
                text-align:center;
                color:#f2c14e;
                margin-bottom:5px;
            ">
                👨‍👩‍👧‍👦 HOC Family Tasks
            </h1>

            <p style="
                text-align:center;
                margin-top:0;
            ">
                Haven Of Ceylon Family
            </p>

        </div>

        <div id="familyTaskList"></div>

        <button
            class="danger"
            onclick="location.reload()"
            style="margin-top:20px;"
        >
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
            overflow:hidden;
        ">

            ${
                task.banner
                ?
                `
                <img
                    src="${task.banner}"
                    style="
                        width:100%;
                        display:block;
                        border-radius:12px;
                        margin-bottom:15px;
                    "
                >
                `
                :
                ""
            }

            <h2 style="
                color:#f2c14e;
                margin-bottom:10px;
            ">
                👨‍👩‍👧‍👦 Family Task ${String(task.id).padStart(2,"0")}
            </h2>

            <p style="
                font-size:18px;
                line-height:1.6;
            ">
                ${task.title}
            </p>

            <h2 style="
                color:#00e676;
                margin-top:10px;
            ">
                🎁 ${task.gift}
            </h2>

            <button
                class="primary"
                onclick="openTaskCompleteForm(${task.id})"
                style="
                    width:100%;
                    margin-top:10px;
                    font-size:18px;
                "
            >
                ✅ ඉවර කර ඇත
            </button>

        </div>

    `).join("");
}


// ==========================================
// OPEN COMPLETION FORM
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

            <h2 style="
                color:#f2c14e;
                text-align:center;
            ">
                👨‍👩‍👧‍👦 Family Task ${String(task.id).padStart(2,"0")}
            </h2>

            <h3 style="
                text-align:center;
                line-height:1.5;
            ">
                ${task.title}
            </h3>

            <div style="
                background:#182233;
                padding:15px;
                border-radius:15px;
                margin:20px 0;
                text-align:center;
            ">

                <div style="font-size:18px;">
                    🎁 Gift
                </div>

                <h2 style="
                    color:#00e676;
                    margin-bottom:0;
                ">
                    ${task.gift}
                </h2>

            </div>


            <label>
                👤 User Name
            </label>

            <input
                id="taskUserName"
                type="text"
                placeholder="ඔබගේ User Name"
                style="
                    width:100%;
                    padding:14px;
                    margin:8px 0 15px;
                    border-radius:10px;
                    box-sizing:border-box;
                "
            >


            <label>
                🆔 App ID
            </label>

            <input
                id="taskAppId"
                type="text"
                inputmode="numeric"
                placeholder="ඔබගේ App ID"
                style="
                    width:100%;
                    padding:14px;
                    margin:8px 0 15px;
                    border-radius:10px;
                    box-sizing:border-box;
                "
            >


            <button
                class="primary"
                onclick="submitNormalTask(${task.id})"
                style="
                    width:100%;
                    font-size:18px;
                "
            >
                📤 Submit Task
            </button>


            <button
                class="danger"
                onclick="openFamilyTaskPage()"
                style="
                    width:100%;
                    margin-top:12px;
                "
            >
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


    const name =
        document.getElementById("taskUserName")
        ?.value.trim();

    const appId =
        document.getElementById("taskAppId")
        ?.value.trim();


    if (!name || !appId) {

        alert("⚠️ User Name සහ App ID දෙකම ඇතුළත් කරන්න.");

        return;
    }


    if (!/^\d+$/.test(appId)) {

        alert("❌ App ID එකට අංක පමණක් ඇතුළත් කරන්න.");

        return;
    }


    const safeId = appId.replace(/[.#$[\]/]/g, "_");


    try {

        const taskRef = ref(
            db,
            `familyTaskCompletions/${taskId}/${safeId}`
        );

        const snapshot = await get(taskRef);


        if (snapshot.exists()) {

            alert(
                "⚠️ මෙම App ID එකෙන් මෙම Task එක දැනටමත් submit කර ඇත."
            );

            return;
        }


        await set(taskRef, {

            taskId: task.id,

            taskTitle: task.title,

            name: name,

            appId: appId,

            gift: task.gift,

            status: "PENDING",

            completedAt: Date.now()

        });


        alert(
            "✅ Task Completion එක සාර්ථකව Submit කළා!\n\n" +
            "👤 Name: " + name +
            "\n🆔 App ID: " + appId +
            "\n🎁 Gift: " + task.gift +
            "\n\nAdmin විසින් පරීක්ෂා කර Gift ලබාදෙනු ඇත."
        );


        openFamilyTaskPage();


    } catch (error) {

        console.error(error);

        alert(
            "❌ Task submit කිරීමේදී දෝෂයක් ඇතිවිය.\n\n" +
            error.message
        );

    }

}


// ==========================================
// REFERRAL TASK FORM
// ==========================================

function openReferralForm() {

    document.body.innerHTML = `

    <div class="wrap">

        <div class="card">

            <h2 style="
                color:#f2c14e;
                text-align:center;
            ">
                👥 Referral Task
            </h2>

            <p style="
                text-align:center;
                line-height:1.6;
            ">
                ඔබගේ Referral එකෙන් App එකට අලුත් Member කෙනෙක්
                එකතු කර ඇත්නම් පහත විස්තර ඇතුළත් කරන්න.
            </p>


            <div style="
                background:#182233;
                padding:15px;
                border-radius:15px;
                margin:20px 0;
            ">

                🎁 Gift: <b>Diamond 300</b>

                <br><br>

                ⚠️ Referral Gift එක ලැබෙන්නේ
                අලුත් Member **Task 02 Complete කළහොත් පමණි.**

            </div>


            <label>
                👤 ඔබගේ User Name
            </label>

            <input
                id="referrerName"
                type="text"
                placeholder="ඔබගේ User Name"
                style="
                    width:100%;
                    padding:14px;
                    margin:8px 0 15px;
                    border-radius:10px;
                    box-sizing:border-box;
                "
            >


            <label>
                🆔 ඔබගේ App ID
            </label>

            <input
                id="referrerId"
                type="text"
                inputmode="numeric"
                placeholder="ඔබගේ App ID"
                style="
                    width:100%;
                    padding:14px;
                    margin:8px 0 15px;
                    border-radius:10px;
                    box-sizing:border-box;
                "
            >


            <label>
                👤 අලුත් Member ගේ Name
            </label>

            <input
                id="referredName"
                type="text"
                placeholder="අලුත් Member ගේ Name"
                style="
                    width:100%;
                    padding:14px;
                    margin:8px 0 15px;
                    border-radius:10px;
                    box-sizing:border-box;
                "
            >


            <label>
                🆔 අලුත් Member ගේ App ID
            </label>

            <input
                id="referredId"
                type="text"
                inputmode="numeric"
                placeholder="අලුත් Member ගේ App ID"
                style="
                    width:100%;
                    padding:14px;
                    margin:8px 0 15px;
                    border-radius:10px;
                    box-sizing:border-box;
                "
            >


            <button
                class="primary"
                onclick="submitReferralTask()"
                style="
                    width:100%;
                    font-size:18px;
                "
            >
                📤 Referral Submit කරන්න
            </button>


            <button
                class="danger"
                onclick="openFamilyTaskPage()"
                style="
                    width:100%;
                    margin-top:12px;
                "
            >
                ⬅️ Back
            </button>

        </div>

    </div>

    `;

}


// ==========================================
// SUBMIT REFERRAL
// ==========================================

async function submitReferralTask() {

    const referrerName =
        document.getElementById("referrerName")
        ?.value.trim();

    const referrerId =
        document.getElementById("referrerId")
        ?.value.trim();

    const referredName =
        document.getElementById("referredName")
        ?.value.trim();

    const referredId =
        document.getElementById("referredId")
        ?.value.trim();


    if (
        !referrerName ||
        !referrerId ||
        !referredName ||
        !referredId
    ) {

        alert(
            "⚠️ සියලුම විස්තර ඇතුළත් කරන්න."
        );

        return;
    }


    if (
        !/^\d+$/.test(referrerId) ||
        !/^\d+$/.test(referredId)
    ) {

        alert(
            "❌ App ID වලට අංක පමණක් ඇතුළත් කරන්න."
        );

        return;
    }


    const referredSafeId =
        referredId.replace(/[.#$[\]/]/g, "_");


    try {

        // ==================================
        // CHECK TASK 02
        // ==================================

        const task02Ref = ref(
            db,
            `familyTaskCompletions/2/${referredSafeId}`
        );

        const task02Snapshot =
            await get(task02Ref);


        if (!task02Snapshot.exists()) {

            alert(
                "❌ මෙම Referral Member Task 02 Complete කරලා නැහැ.\n\n" +
                "Task 02 Complete කළාට පස්සේ Referral Gift එක claim කරන්න."
            );

            return;
        }


        // ==================================
        // CHECK DUPLICATE REFERRAL
        // ==================================

        const referralRef = ref(
            db,
            `familyTaskCompletions/5/${referredSafeId}`
        );

        const referralSnapshot =
            await get(referralRef);


        if (referralSnapshot.exists()) {

            alert(
                "⚠️ මෙම Member සඳහා Referral Gift එක දැනටමත් submit කර ඇත."
            );

            return;
        }


        // ==================================
        // SAVE REFERRAL
        // ==================================

        await set(referralRef, {

            taskId: 5,

            taskTitle:
                "ඔබ App එකට එකතු කරන අයට අපි ලබාදෙන Gift",

            referrerName:
                referrerName,

            referrerId:
                referrerId,

            referredName:
                referredName,

            referredId:
                referredId,

            gift:
                "Diamond 300",

            status:
                "PENDING",

            completedAt:
                Date.now()

        });


        alert(
            "✅ Referral Task එක සාර්ථකව Submit කළා!\n\n" +
            "👤 ඔබ: " + referrerName +
            "\n🆔 ඔබගේ ID: " + referrerId +
            "\n\n👤 New Member: " + referredName +
            "\n🆔 New Member ID: " + referredId +
            "\n\n🎁 Gift: Diamond 300"
        );


        openFamilyTaskPage();


    } catch (error) {

        console.error(error);

        alert(
            "❌ Referral submit කිරීමේදී දෝෂයක් ඇතිවිය.\n\n" +
            error.message
        );

    }

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.openFamilyTaskPage =
    openFamilyTaskPage;

window.openTaskCompleteForm =
    openTaskCompleteForm;

window.submitNormalTask =
    submitNormalTask;

window.openReferralForm =
    openReferralForm;

window.submitReferralTask =
    submitReferralTask;


// ==========================================
// START
// ==========================================
