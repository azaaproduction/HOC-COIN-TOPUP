// ===============================
// HOC FAMILY TASK SYSTEM V1
// ===============================

function openFamilyTaskPage() {

    document.body.innerHTML = `

    <div class="wrap">

        <h2>👨‍👩‍👧‍👦 HOC Family Tasks</h2>

        <p style="text-align:center;">
            Haven Of Ceylon Family
        </p>

        <div id="familyTaskList"></div>

        <button onclick="location.reload()" class="danger">
            ⬅ Back
        </button>

    </div>

    `;

    loadFamilyTasks();
}


function loadFamilyTasks() {

    const box = document.getElementById("familyTaskList");

    box.innerHTML = `

        <div class="card">
            <h2>👨‍👩‍👧‍👦 Family Task 01</h2>
            <p>Account එක නිතරම Online තියන ඔබට අපෙන් හිමිවන Gift</p>
            <h3>🎁 Diamond 30</h3>
            <button class="primary">
                ඉවර කර ඇත
            </button>
        </div>

        <div class="card">
            <h2>👨‍👩‍👧‍👦 Family Task 02</h2>
            <p>Target Level 01 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift</p>
            <h3>🎁 Diamond 3000</h3>
            <button class="primary">
                ඉවර කර ඇත
            </button>
        </div>

        <div class="card">
            <h2>👨‍👩‍👧‍👦 Family Task 03</h2>
            <p>Target Level 02 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift</p>
            <h3>🎁 Diamond 300</h3>
            <button class="primary">
                ඉවර කර ඇත
            </button>
        </div>

        <div class="card">
            <h2>👨‍👩‍👧‍👦 Family Task 04</h2>
            <p>Target Level 03 සම්පුර්ණ කරන ඔයාට අපෙන් හම්බෙන Gift</p>
            <h3>🎁 Diamond 600</h3>
            <button class="primary">
                ඉවර කර ඇත
            </button>
        </div>

        <div class="card">
            <h2>👨‍👩‍👧‍👦 Family Task 05</h2>
            <p>ඔබ App එකට එකතු කරන අයට අපි ලබාදෙන Gift</p>
            <h3>🎁 Diamond 300</h3>
            <button class="primary">
                ඉවර කර ඇත
            </button>
        </div>

    `;
}


// Family Tasks button
document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("btnFamilyTasks");

    if (btn) {
        btn.addEventListener("click", openFamilyTaskPage);
    }

});