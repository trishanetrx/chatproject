const API_URL = "https://chatapi.copythingz.shop/api/admin/login";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const errorBox = document.getElementById("errorBox");
    errorBox.classList.add("hidden");

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorBox.textContent = data.message || "Invalid login";
            errorBox.classList.remove("hidden");
            return;
        }

        // Save JWT
        localStorage.setItem("adminToken", data.token);

        // Redirect to dashboard
        window.location.href = "admin.html";

    } catch (err) {
        errorBox.textContent = "Server error";
        errorBox.classList.remove("hidden");
    }
});
