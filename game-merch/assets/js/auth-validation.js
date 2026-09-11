// --- GLOBAL UTILITIES (Exposed to window for reuse in script.js) ---
window.showAuthMessage = function(container, message, isError = true) {
    if (!container) return;
    
    let existingMsg = container.querySelector('.system-msg');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `system-msg ${isError ? 'msg-error' : 'msg-success'}`;
    msgDiv.textContent = message;

    container.insertBefore(msgDiv, container.firstChild);
};

window.showError = function(inputId, message) {
    const errorSpan = document.getElementById(`${inputId}-error`);
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.add('show-error');
    }
    const targetInput = document.getElementById(inputId);
    if (targetInput) {
        targetInput.classList.remove('input-success');
        targetInput.classList.add('input-error');
    }
};

window.clearError = function(inputId) {
    const errorSpan = document.getElementById(`${inputId}-error`);
    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.classList.remove('show-error');
    }
    const targetInput = document.getElementById(inputId);
    if (targetInput) {
        targetInput.classList.remove('input-error');
        targetInput.classList.add('input-success');
    }
};

window.isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
window.isStrongPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. WEB STORAGE API (Data Retention) ---
    const storageFields = ['reg-username', 'reg-email', 'reg-description', 'login-email'];
    
    storageFields.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            const savedData = sessionStorage.getItem(id);
            if (savedData) inputElement.value = savedData;
            
            inputElement.addEventListener('input', (e) => {
                sessionStorage.setItem(id, e.target.value);
            });
        }
    });

    const currentUsername = sessionStorage.getItem("username"); 
    const currentEmail = sessionStorage.getItem("userEmail"); 
    const currentToken = sessionStorage.getItem("token"); 

    const profileNameEl = document.querySelector(".profile-name");
    const profileEmailEl = document.querySelector(".profile-email");
    if (profileNameEl && currentUsername) profileNameEl.textContent = currentUsername;
    if (profileEmailEl && currentEmail) profileEmailEl.textContent = currentEmail;

    // --- 2. REGISTRATION LOGIC ---
    const regForm = document.getElementById('register-form');
    if (regForm) {
        const usernameInput = document.getElementById('reg-username');
        const emailInput = document.getElementById('reg-email');
        const passInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm-password');
        const descInput = document.getElementById('reg-description');

        emailInput.addEventListener('input', () => {
            if (!window.isValidEmail(emailInput.value)) window.showError('reg-email', 'Please enter a valid email format.');
            else window.clearError('reg-email');
        });

        passInput.addEventListener('input', () => {
            if (!window.isStrongPassword(passInput.value)) window.showError('reg-password', 'Password must be at least 8 characters with 1 letter and 1 number.');
            else window.clearError('reg-password');
            if (confirmInput.value) confirmInput.dispatchEvent(new Event('input'));
        });

        confirmInput.addEventListener('input', () => {
            if (confirmInput.value !== passInput.value) {               
                window.showError('reg-confirm-password', 'Passwords do not match.'); 
            } else {
                window.clearError('reg-confirm-password');
            }
        });

        regForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passInput.value.trim();
            const confirmPassword = confirmInput.value.trim();
            const description = descInput.value.trim();

            if (!window.isValidEmail(email) || !window.isStrongPassword(password) || (confirmPassword !== password)) {
                window.showAuthMessage(regForm, 'Please fix the highlighted errors before submitting.', true);
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, description })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.clear(); 
                    window.showAuthMessage(regForm, "Registration successful! Redirecting to login...", false);
                    setTimeout(() => window.location.href = "/login", 1500);
                } else {
                    window.showAuthMessage(regForm, `Registration Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error during registration:", error);
                window.showAuthMessage(regForm, "A network error occurred. Please try again.", true);
            }
        });
    }

    // --- 3. REUSABLE LOGIN LOGIC ---
    async function processLogin(formElement, email, password) {
        if (email === "" || password === "") {
            window.showAuthMessage(formElement, "Please enter both email and password.", true);
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem("isLoggedIn", "true");
                sessionStorage.setItem("userId", data.user.id);
                sessionStorage.setItem("userRole", data.user.role);
                sessionStorage.setItem("username", data.user.username);
                sessionStorage.setItem("userEmail", data.user.email);
                sessionStorage.setItem("token", data.token); 
                if (data.user.avatar) sessionStorage.setItem('profileAvatarBase64', data.user.avatar);
                
                window.showAuthMessage(formElement, "Login successful! Redirecting...", false);
                
                setTimeout(() => {
                    if (data.user.role === "admin") window.location.href = "/admin"; 
                    else window.location.href = "/profile"; 
                }, 1000);
            } else {
                window.showAuthMessage(formElement, data.error, true);
            }
        } catch (error) {
            console.error("Error during login:", error);
            window.showAuthMessage(formElement, "A network error occurred. Please try again.", true);
        }
    }

    const loginForm = document.getElementById('login-form'); 
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();
            processLogin(loginForm, email, password);
        });
    }

    const landingLoginForm = document.getElementById('landing-login-form');
    if (landingLoginForm) {
        landingLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('landing-login-email').value.trim();
            const password = document.getElementById('landing-login-password').value.trim();
            processLogin(landingLoginForm, email, password);
        });
    }

    // --- 4. EDIT PROFILE LOGIC ---
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        const editUsername = document.getElementById('edit-username');
        const editEmail = document.getElementById('edit-email');
        const editDesc = document.getElementById('edit-desc');
        
        if (editUsername && currentUsername) editUsername.value = currentUsername;
        if (editEmail && currentEmail) editEmail.value = currentEmail;

        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newUsername = editUsername.value.trim();
            const newEmail = editEmail.value.trim();
            const newDescription = editDesc.value.trim();
            const newAvatar = sessionStorage.getItem('profileAvatarBase64');
            
            const formCard = editProfileForm.querySelector('.dashboard-card');

            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        currentEmail: currentEmail,
                        token: currentToken, 
                        newUsername, 
                        newEmail, 
                        newDescription,
                        newAvatar
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem("username", data.user.username);
                    sessionStorage.setItem("userEmail", data.user.email);
                    window.showAuthMessage(formCard, "Profile updated successfully!", false);
                    
                    setTimeout(() => {
                        const msg = formCard.querySelector('.system-msg');
                        if(msg) msg.remove();
                    }, 3000);
                } else {
                    window.showAuthMessage(formCard, `Update Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error during update:", error);
                window.showAuthMessage(formCard, "A network error occurred.", true);
            }
        });
    }

    // --- 5. CHANGE PASSWORD LOGIC ---
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
        const newPassInput = document.getElementById('new-password');
        const confirmNewInput = document.getElementById('confirm-new-password');
        const formCard = changePassForm.querySelector('.dashboard-card');

        newPassInput.addEventListener('input', () => {
            if (!window.isStrongPassword(newPassInput.value)) window.showError('new-password', 'Password must be at least 8 characters with 1 letter and 1 number.');
            else window.clearError('new-password');
        });

        confirmNewInput.addEventListener('input', () => {
            if (confirmNewInput.value !== newPassInput.value) window.showError('confirm-new-password', 'Passwords do not match.');
            else window.clearError('confirm-new-password');
        });

        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentEmail || !currentToken) {
                window.showAuthMessage(formCard, "Session expired. Please log in again.", true);
                setTimeout(() => window.location.href = "/login", 1500);
                return;
            }

            if (!window.isStrongPassword(newPassInput.value) || newPassInput.value !== confirmNewInput.value) {
                window.showAuthMessage(formCard, "Please ensure passwords are strong and match.", true);
                return;
            }

            try {
                const response = await fetch('/api/change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: currentEmail,
                        token: currentToken,
                        newPassword: newPassInput.value
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    window.showAuthMessage(formCard, "Password updated successfully!", false);
                    setTimeout(() => window.location.href = "/profile", 1500);
                } else {
                    window.showAuthMessage(formCard, `Update Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error updating password:", error);
                window.showAuthMessage(formCard, "A network error occurred.", true);
            }
        });
    }

    // --- 6. DELETE ACCOUNT LOGIC ---
    const deleteBtn = document.getElementById('confirm-delete-btn');
    if (deleteBtn) {
        const messageContainer = document.querySelector('.message-container');
        
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!currentEmail || !currentToken) {
                window.showAuthMessage(messageContainer, "Session expired. Please log in again.", true);
                return;
            }

            try {
                const response = await fetch('/api/account', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: currentEmail,
                        token: currentToken
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.clear();
                    window.showAuthMessage(messageContainer, "Account permanently deleted. Goodbye!", false);
                    setTimeout(() => window.location.href = "/register", 1500);
                } else {
                    window.showAuthMessage(messageContainer, `Deletion Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error deleting account:", error);
                window.showAuthMessage(messageContainer, "A network error occurred.", true);
            }
        });
    }

    // --- 7. SIGN OUT LOGIC ---
    const signOutLinks = document.querySelectorAll('.sign-out-link');
    signOutLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/logout', { method: 'POST' });
            } catch (err) {
                console.error("Logout error:", err);
            }
            sessionStorage.clear();
            window.location.href = "/login";
        });
    });

    // --- 8. VERIFY CURRENT PASSWORD LOGIC ---
    const verifyPassForm = document.getElementById('verify-password-form');
    if (verifyPassForm) {
        verifyPassForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const passwordInput = verifyPassForm.querySelector('input[type="password"]');
            const enteredPassword = passwordInput.value;
            const formCard = verifyPassForm.querySelector('.dashboard-card');
            
            try {
                const response = await fetch('/api/verify-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: currentEmail, 
                        token: currentToken, 
                        password: enteredPassword 
                    })
                });

                if (response.ok) {
                    window.showAuthMessage(formCard, "Password verified. Redirecting...", false);
                    setTimeout(() => window.location.href = "/change_password", 1000);
                } else {
                    const data = await response.json();
                    window.showAuthMessage(formCard, data.error || "Incorrect current password. Please try again.", true);
                    passwordInput.classList.add('input-error');
                }
            } catch (error) {
                console.error("Error verifying password:", error);
                window.showAuthMessage(formCard, "A network error occurred. Please try again.", true);
            }
        });
    }

    // --- 9. PROFILE AVATAR PREVIEW LOGIC ---
    const avatarInput = document.getElementById('avatar');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    window.showAuthMessage(document.querySelector('.dashboard-card'), "Please select a valid image file.", true);
                    e.target.value = ''; 
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    sessionStorage.setItem('profileAvatarBase64', event.target.result);
                    const profileAvatars = document.querySelectorAll('.profile-avatar, .nav-avatar');
                    profileAvatars.forEach(img => img.src = event.target.result);
                    window.showAuthMessage(document.querySelector('.dashboard-card'), "Avatar preview ready! Click Save Changes.", false);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const savedAvatar = sessionStorage.getItem('profileAvatarBase64');
    const profileAvatars = document.querySelectorAll('.profile-avatar, .nav-avatar');
    if (savedAvatar) {
        profileAvatars.forEach(img => img.src = savedAvatar);
    }
    
    // --- 10. FORGOT PASSWORD LOGIC ---
    const forgotPassForm = document.getElementById('forgot-password-form');
    if (forgotPassForm) {
        const resetEmailInput = document.getElementById('reset-email');

        forgotPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = resetEmailInput.value.trim();
            if (!window.isValidEmail(email)) {
                window.showAuthMessage(forgotPassForm, "Please enter a valid email format.", true);
                return;
            }

            try {
                await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                window.showAuthMessage(forgotPassForm, "Processing request...", false);
                
                setTimeout(() => {
                    window.location.href = "/forgot_password_confirm";
                }, 1000);

            } catch (error) {
                console.error("Error during password reset:", error);
                window.showAuthMessage(forgotPassForm, "A network error occurred. Please try again.", true);
            }
        });
    }
});