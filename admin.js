const API_BASE = "https://chatapi.copythingz.shop/api/admin";

function authHeader() {
    return {
        "Authorization": "Bearer " + localStorage.getItem("adminToken"),
        "Content-Type": "application/json"
    };
}

if (!localStorage.getItem("adminToken")) {
    window.location.href = "admin-login.html";
}

// TAB SETUP
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
    if (tab === "messages") {
        tabMessages.classList.add("tab-active");
        sectionMessages.classList.remove("hidden");
        loadMessages();
    }
    if (tab === "bans") {
        tabBans.classList.add("tab-active");
        sectionBans.classList.remove("hidden");
        loadBans();
    }
}

tabUsers.onclick = () => switchTab("users");
tabMessages.onclick = () => switchTab("messages");
tabBans.onclick = () => switchTab("bans");

switchTab("users");

// ---------------- USERS (ONLINE) ----------------
async function loadUsers() {
    const res = await fetch(`${API_BASE}/online-users`, { headers: authHeader() });
    const users = await res.json();

    const table = document.getElementById("usersTable");
    table.innerHTML = "";

    users.forEach(username => {
        table.innerHTML += `
        <tr class="border-b">
            <td class="p-3">${username}</td>
            <td class="p-3">
                <button class="bg-red-500 text-white px-3 py-1 rounded"
                    onclick="kickUser('${username}')">Kick</button>
                <button class="bg-yellow-500 text-white px-3 py-1 rounded"
                    onclick="banUser('${username}')">Ban</button>
            </td>
        </tr>`;
    });
}

// ---------------- MESSAGES ----------------
async function loadMessages() {
    const res = await fetch(`${API_BASE}/messages`, { headers: authHeader() });
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
                <button class="bg-red-600 text-white px-3 py-1 rounded"
                    onclick="deleteMessage(${m.id})">Delete</button>
            </td>
        </tr>`;
    });
}

// ---------------- BANS ----------------
async function loadBans() {
    const res = await fetch(`${API_BASE}/bans`, { headers: authHeader() });
    const bans = await res.json();

    const table = document.getElementById("bansTable");
    table.innerHTML = "";

    bans.forEach(b => {
        table.innerHTML += `
        <tr class="border-b">
            <td class="p-3">${b.username}</td>
            <td class="p-3">
                <button class="bg-green-600 text-white px-3 py-1 rounded"
                    onclick="unbanUser('${b.username}')">Unban</button>
            </td>
        </tr>`;
    });
}

// ---------------- ACTIONS ----------------
async function deleteMessage(id) {
    await fetch(`${API_BASE}/messages/${id}`, {
        method: "DELETE",
        headers: authHeader()
    });
    loadMessages();
}

async function kickUser(username) {
    await fetch(`${API_BASE}/kick`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ username })
    });
    loadUsers();
}

async function banUser(username) {
    await fetch(`${API_BASE}/ban`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ username })
    });
    loadUsers();
}

async function unbanUser(username) {
    await fetch(`${API_BASE}/unban`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ username })
    });
    loadBans();
}
