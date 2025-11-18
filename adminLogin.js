document.getElementById("loginBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const res = await fetch("https://chatapi.copythingz.shop/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("adminToken", data.token);
        window.location.href = "admin.html";
    } else {
        document.getElementById("status").innerText = data.message || "Login failed";
    }
});
