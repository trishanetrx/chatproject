const apiUrl = 'https://chatapi.copythingz.shop/api'; // Backend base URL

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');
    const captchaImage = document.getElementById('captchaImage');
    const refreshCaptchaBtn = document.getElementById('refreshCaptcha');

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

    if (refreshCaptchaBtn && captchaImage) {
        refreshCaptchaBtn.addEventListener('click', () => {
            captchaImage.src = `${apiUrl}/captcha?t=${new Date().getTime()}`;
            const captchaInput = document.getElementById('captcha');
            if (captchaInput) captchaInput.value = '';
        });
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const captcha = document.getElementById('captcha').value.trim();

    if (!username || !password || !confirmPassword || !captcha) {
        showNotification('All fields including CAPTCHA are required.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (username === 'Admin') {
        showNotification('Cannot register as Admin.', 'error');
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, captcha }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else {
            showNotification(data.message || 'Registration failed.', 'error');
            const refreshCaptchaBtn = document.getElementById('refreshCaptcha');
            if (refreshCaptchaBtn) refreshCaptchaBtn.click();
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
