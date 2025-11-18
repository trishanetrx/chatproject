const API_BASE = "https://chatapi.copythingz.shop/api/admin";
const ADMIN_TOKEN = "super-admin-secret";

// ---------- TAB LOGIC ----------
const tabUsers = document.getElementById("tabUsers");
const tabMessages = document.getElementById("tabMessages");
const tabBans = document.getElementById("tabBans");

const sectionUsers = document.getElementById("sectionUsers");
const sectionMessages = document.getElementById("sectionMessages");
const sectionBans = document.getElementById("sectionBans");

function switchTab(tab) {
    tabUsers.classList.remove("tab-active");
    tabMessages.classList.remove("tab-active");
    tabBans.classList.remove("tab-active");

    sectionUsers.classList.add("hidden");
    sectionMessages.classList.add("hidden");
    sectionBans.classList.add("hidden");

    if (tab === "users") {
        tabUsers.classList.add("tab-active");
        sectionUsers.classList.remove("hidden");
        loadUsers();
    } 
    else if (tab === "messages") {
        tabMessages.classList.add("tab-active");
        sectionMessages.classList.remove("hidden");
        loadMessages();
    } 
    else if (tab === "bans") {
        tabBans.classList.add("tab-active");
        sectionBans.classList.remove("hidden");
        loadBans();
    }
}

tabUsers.onclick = () => switchTab("users");
tabMessages.onclick = () => switchTab("messages");
tabBans.onclick = () => switchTab("bans");

switchTab("users");


// ---------- LOAD USERS ----------
async function loadUsers() {
    const res = await fetch(`${API_BASE}/users`, {
        headers: { "admin-token": ADMIN_TOKEN }
    });

    const users = await res.json();
    const table = document.getElementById("usersTable");
    table.innerHTML = "";

    users.forEach(u => {
        table.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${u.id}</td>
                <td class="p-3">${u.username}</td>
                <td class="p-3 space-x-2">
                    <button onclick="kickUser('${u.username}')"
                        class="bg-red-500 text-white px-3 py-1 rounded">
                        Kick
                    </button>
                    <button onclick="banUser('${u.username}')"
                        class="bg-yellow-500 text-white px-3 py-1 rounded">
                        Ban
                    </button>
                </td>
            </tr>`;
    });
}


// ---------- LOAD MESSAGES ----------
async function loadMessages() {
    const res = await fetch(`${API_BASE}/messages`, {
        headers: { "admin-token": ADMIN_TOKEN }
    });

    const messages = await res.json();
    const table = document.getElementById("messagesTable");
    table.innerHTML = "";

    messages.forEach(m => {
        table.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${m.id}</td>
                <td class="p-3">${m.username}</td>
                <td class="p-3">${m.message}</td>
                <td class="p-3">${m.timestamp}</td>
                <td class="p-3">
                    <button onclick="deleteMessage(${m.id})"
                        class="bg-red-600 text-white px-3 py-1 rounded">
                        Delete
                    </button>
                </td>
            </tr>`;
    });
}


// ---------- LOAD BANNED USERS ----------
async function loadBans() {
    const res = await fetch(`${API_BASE}/messages`, { headers: { "admin-token": ADMIN_TOKEN } });

    const bansRes = await fetch(`${API_BASE.replace("messages", "bans")}`, {
        headers: { "admin-token": ADMIN_TOKEN }
    });

    const bans = await bansRes.json();
    const table = document.getElementById("bansTable");
    table.innerHTML = "";

    bans.forEach(b => {
        table.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${b.username}</td>
                <td class="p-3">
                    <button onclick="unbanUser('${b.username}')"
                        class="bg-green-600 text-white px-3 py-1 rounded">
                        Unban
                    </button>
                </td>
            </tr>`;
    });
}


// ---------- ACTION FUNCTIONS ----------

async function deleteMessage(id) {
    await fetch(`${API_BASE}/messages/${id}`, {
        method: "DELETE",
        headers: { "admin-token": ADMIN_TOKEN }
    });
    loadMessages();
}

async function kickUser(username) {
    await fetch(`${API_BASE}/kick`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "admin-token": ADMIN_TOKEN
        },
        body: JSON.stringify({ username })
    });
    loadUsers();
}

async function banUser(username) {
    await fetch(`${API_BASE}/ban`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "admin-token": ADMIN_TOKEN
        },
        body: JSON.stringify({ username })
    });
    loadUsers();
}

async function unbanUser(username) {
    await fetch(`${API_BASE}/unban`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "admin-token": ADMIN_TOKEN
        },
        body: JSON.stringify({ username })
    });
    loadBans();
}
