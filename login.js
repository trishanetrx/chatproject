const apiUrl = 'https://chatapi.copythingz.shop/api'; // Backend base URL

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');

    // -------------------------
    // Password show/hide toggle
    // -------------------------
    if (toggleButton && passwordInput && passwordIcon) {
        toggleButton.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordIcon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                passwordIcon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    // -------------------------
    // CHECK FOR KICK/BAN REASON
    // -------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason');

    if (reason === 'kicked') {
        showNotification('You have been kicked by an admin.', 'error');
        // Clean URL
        window.history.replaceState({}, document.title, "login.html");
    } else if (reason === 'banned') {
        showNotification('You have been BANNED by an admin.', 'error');
        // Clean URL
        window.history.replaceState({}, document.title, "login.html");
    }

    // -------------------------
    // LOGIN FORM SUBMIT
    // -------------------------
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;



        // -------------------------
        // NORMAL USER LOGIN
        // -------------------------
        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login success
                showNotification('Login successful! Redirecting...', 'success');

                // Save login session
                localStorage.setItem('username', data.username);
                localStorage.setItem('isAdmin', data.isAdmin ? "true" : "false");

                setTimeout(() => {
                    window.location.href = 'chat.html';
                }, 1200);

            } else {
                showNotification(data.message || 'Login failed. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Login error:', error);
            showNotification('Server error. Try again later.', 'error');
        }



        // -------------------------
        // NORMAL USER LOGIN
        // -------------------------
        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login success
                showNotification('Login successful! Redirecting...', 'success');

                // Save login session
                localStorage.setItem('username', data.username);
                localStorage.setItem('isAdmin', data.isAdmin ? "true" : "false");

                setTimeout(() => {
                    window.location.href = 'chat.html';
                }, 1200);

            } else {
                showNotification(data.message || 'Login failed. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Login error:', error);
            showNotification('Server error. Try again later.', 'error');
        }
    });
});

// -------------------------
// Notification message popup
// -------------------------
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;

    notification.className = `
        fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white 
        ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}
