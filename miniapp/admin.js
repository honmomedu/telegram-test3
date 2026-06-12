// Admin Panel Logic

const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// Hardcoded Credentials (Not secure for production, but as requested)
const ADMIN_EMAIL = 'hon.om.edu@gmail.com';
const ADMIN_PASS = 'MrH@nm@m64';

// Check if already logged in (using localStorage for persistence during session)
const isLoggedIn = localStorage.getItem('admin_logged_in');

if (isLoggedIn === 'true') {
    showDashboard();
}

loginBtn.addEventListener('click', handleLogin);

// Also allow pressing Enter to login
passwordInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Reset state
    loginError.style.display = 'none';
    loginBtn.textContent = 'កំពុងពិនិត្យ...';
    loginBtn.disabled = true;
    
    // Simulate slight network delay
    setTimeout(() => {
        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            // Success
            localStorage.setItem('admin_logged_in', 'true');
            showDashboard();
        } else {
            // Failed
            loginError.style.display = 'block';
            loginBtn.textContent = 'ចូលប្រើប្រាស់';
            loginBtn.disabled = false;
        }
    }, 600);
}

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
}

// Logout logic
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('admin_logged_in');
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
    
    // Reset form
    passwordInput.value = '';
    loginBtn.textContent = 'ចូលប្រើប្រាស់';
    loginBtn.disabled = false;
});
