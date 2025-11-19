const API_BASE = "https://chatapi.copythingz.shop/api";

// ================================
//  AUTH CHECK
// ================================
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
    alert("Access denied. Please login again.");
    window.location.href = "admin-login.html";
}

// LOGOUT
function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
}

// ================================
//  TABS
// ================================
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
    }
    if (tab === "messages") {
        tabMessages.classList.add("tab-active");
        sectionMessages.classList.remove("hidden");
    }
    if (tab === "bans") {
        tabBans.classList.add("tab-active");
        sectionBans.classList.remove("hidden");
    }
}

tabUsers.addEventListener("click", () => switchTab("users"));
tabMessages.addEventListener("click", () => switchTab("messages"));
tabBans.addEventListener("click", () => switchTab("bans"));

// ================================
//  API WRAPPER
// ================================
async function api(url, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + adminToken
        }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(API_BASE + url, options);
    return res.json();
}

// ================================
//  LOAD USERS
// ================================
async function loadUsers() {
    const usersTable = document.getElementById("usersTable");
    usersTable.innerHTML = "<tr><td colspan='3' class='p-4 text-center'>Loading...</td></tr>";

    const users = await api("/admin/all-users");

    usersTable.innerHTML = "";

    users.forEach(user => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50";

        const isOnline = user.is_online === 1;

        tr.innerHTML = `
            <td class="p-4">
                <span class="${isOnline ? "dot-online" : "dot-offline"}"></span>
            </td>
            <td class="p-4 font-medium">${user.username}</td>
            <td class="p-4 space-x-2">
                <button onclick="kickUser('${user.username}')" 
                    class="px-3 py-1 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600">
                    Kick
                </button>

                <button onclick="banUser('${user.username}')" 
                    class="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600">
                    Ban
                </button>

                <button onclick="deleteUser(${user.id})" 
                    class="px-3 py-1 bg-gray-700 text-white rounded shadow hover:bg-gray-900">
                    Delete
                </button>
            </td>
        `;

        usersTable.appendChild(tr);
    });
}

// ================================
//  DELETE USER
// ================================
async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;

    await api(`/admin/users/${id}`, "DELETE");
    await loadUsers(); // Refresh only users after deletion
}

// ================================
//  BAN USER
// ================================
async function banUser(username) {
    await api("/admin/ban", "POST", { username });
    await loadUsers(); // Refresh users
    await loadBans();  // Refresh bans
}

// ================================
//  UNBAN USER
// ================================
async function unbanUser(username) {
    await api("/admin/unban", "POST", { username });
    await loadBans();  // Refresh only bans
    await loadUsers(); // Also refresh users in case they come back online
}

// ================================
//  KICK USER
// ================================
async function kickUser(username) {
    await api("/admin/kick", "POST", { username });
    await loadUsers(); // Refresh only users after kick
}

// ================================
//  LOAD BANNED USERS
// ================================
async function loadBans() {
    const bansTable = document.getElementById("bansTable");

    bansTable.innerHTML = "<tr><td colspan='2' class='p-4 text-center'>Loading...</td></tr>";

    const bans = await api("/admin/bans");

    bansTable.innerHTML = "";

    bans.forEach(row => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50";

        tr.innerHTML = `
            <td class="p-4 font-medium">${row.username}</td>
            <td class="p-4">
                <button onclick="unbanUser('${row.username}')" 
                    class="px-3 py-1 bg-green-500 text-white rounded shadow hover:bg-green-600">
                    Unban
                </button>
            </td>
        `;

        bansTable.appendChild(tr);
    });
}

// ================================
//  LOAD MESSAGES
// ================================
async function loadMessages() {
    const messagesTable = document.getElementById("messagesTable");
    messagesTable.innerHTML = "<tr><td colspan='5' class='p-4 text-center'>Loading...</td></tr>";

    const messages = await api("/admin/messages");

    messagesTable.innerHTML = "";

    messages.forEach(m => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td class="p-4">${m.id}</td>
            <td class="p-4">${m.username}</td>
            <td class="p-4">${m.message}</td>
            <td class="p-4">${m.timestamp}</td>
            <td class="p-4">
                <button onclick="deleteMessage(${m.id})"
                    class="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600">
                    Delete
                </button>
            </td>
        `;

        messagesTable.appendChild(tr);
    });
}

// ================================
//  DELETE MESSAGE
// ================================
async function deleteMessage(id) {
    if (!confirm("Delete this message?")) return;

    await api(`/admin/messages/${id}`, "DELETE");
    await loadMessages(); // Refresh only messages after deletion
}

// ================================
//  MANUAL REFRESH FUNCTIONS
// ================================
function refreshAll() {
    loadUsers();
    loadBans();
    loadMessages();
}

// Make it available globally for the HTML button
window.refreshAll = refreshAll;

// ================================
//  INITIAL LOAD
// ================================
loadUsers();
loadBans();
loadMessages();

// REMOVED: Auto-refresh interval
// Now data only refreshes when you take an action or click the refresh button
