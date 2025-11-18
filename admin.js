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

function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
}

// ------------------ TAB SYSTEM ------------------
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

// ------------------ LOAD USERS (Combined) ------------------
async function loadUsers() {
    const regRes = await fetch(`${API_BASE}/users`, { headers: authHeader() });
    const onlineRes = await fetch(`${API_BASE}/online-users`, { headers: authHeader() });

    const registered = await regRes.json();
    const online = await onlineRes.json();

    const table = document.getElementById("usersTable");
    table.innerHTML = "";

    registered.forEach(user => {
        const isOnline = online.includes(user.username);

        table.innerHTML += `
        <tr class="border-b">
            <td class="p-3">
                <span class="${isOnline ? "dot-online" : "dot-offline"}"></span>
            </td>

            <td class="p-3">${user.username}</td>

            <td class="p-3">
                ${isOnline ? `
                    <button onclick="kickUser('${user.username}')"
                        class="bg-red-500 text-white px-3 py-1 rounded">Kick</button>
                ` : ``}

                <button onclick="banUser('${user.username}')"
                    class="bg-yellow-500 text-white px-3 py-1 rounded ml-2">
                    Ban
                </button>
            </td>
        </tr>`;
    });
}

// ------------------ LOAD MESSAGES ------------------
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
                <button onclick="deleteMessage(${m.id})"
                    class="bg-red-600 text-white px-3 py-1 rounded">
                    Delete
                </button>
            </td>
        </tr>`;
    });
}

// ------------------ BANS ------------------
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
                <button onclick="unbanUser('${b.username}')"
                    class="bg-green-600 text-white px-3 py-1 rounded">
                    Unban
                </button>
            </td>
        </tr>`;
    });
}

// ------------------ ACTIONS ------------------
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
