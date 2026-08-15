document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. WEB STORAGE API & UI POPULATION ---
    const storageFields = ['reg-username', 'reg-email', 'reg-description', 'login-email'];
    storageFields.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            const savedData = sessionStorage.getItem(id);
            if (savedData) inputElement.value = savedData;
            inputElement.addEventListener('input', (e) => sessionStorage.setItem(id, e.target.value));
        }
    });

    const currentUsername = sessionStorage.getItem("username"); 
    const currentEmail = sessionStorage.getItem("userEmail"); 
    const authToken = sessionStorage.getItem("authToken"); 
    const currentAvatar = sessionStorage.getItem("userAvatar");

    const profileNameEl = document.querySelector(".profile-name");
    const profileEmailEl = document.querySelector(".profile-email");
    if (profileNameEl && currentUsername) profileNameEl.textContent = currentUsername;
    if (profileEmailEl && currentEmail) profileEmailEl.textContent = currentEmail;

    // Populate avatars dynamically
    const avatarElements = document.querySelectorAll(".profile-avatar, .nav-avatar");
    avatarElements.forEach(el => {
        if (currentAvatar && currentAvatar !== "null") {
            el.src = currentAvatar;
        } else {
            el.src = "../../assets/images/default-avatar.jpg"; // Fallback image
        }
    });

    // --- 2. UI HELPER: INLINE AUTH MESSAGES ---
    function showAuthMessage(container, message, isError = true) {
        if (!container) return;
        const existingMsg = container.querySelector('.auth-system-msg');
        if (existingMsg) existingMsg.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = `auth-system-msg`;
        msgDiv.style.cssText = `padding: 12px; margin-bottom: 20px; border-radius: 6px; font-size: 14px; text-align: center; font-weight: 600; background-color: ${isError ? '#ffe6e6' : '#e6ffe6'}; color: ${isError ? '#d32f2f' : '#2e7d32'}; border: 1px solid ${isError ? '#d32f2f' : '#2e7d32'}`;
        msgDiv.textContent = message;
        container.insertBefore(msgDiv, container.firstChild);
    }

    const showError = (inputId, message) => {
        const err = document.getElementById(`${inputId}-error`);
        if (err) { err.textContent = message; err.style.display = 'block'; err.style.color = '#d32f2f'; }
        const input = document.getElementById(inputId);
        if (input) input.style.borderColor = '#d32f2f';
    };

    const clearError = (inputId) => {
        const err = document.getElementById(`${inputId}-error`);
        if (err) err.style.display = 'none';
        const input = document.getElementById(inputId);
        if (input) input.style.borderColor = '#2e7d32';
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isStrongPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

    // --- 3. REGISTRATION LOGIC ---
    const regForm = document.getElementById('register-form');
    if (regForm) {
        const usernameInput = document.getElementById('reg-username');
        const emailInput = document.getElementById('reg-email');
        const passInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm-password');
        const descInput = document.getElementById('reg-description');

        // LIVE VALIDATION: Triggers the red border while you type
        emailInput.addEventListener('input', () => {
            if (!isValidEmail(emailInput.value)) showError('reg-email', 'Please enter a valid email format.');
            else clearError('reg-email');
        });

        passInput.addEventListener('input', () => {
            if (!isStrongPassword(passInput.value)) showError('reg-password', 'Password must be at least 8 chars with 1 letter & 1 number.');
            else clearError('reg-password');
            if (confirmInput.value) confirmInput.dispatchEvent(new Event('input'));
        });

        // LIVE VALIDATION: This handles your confirm password red border immediately
        confirmInput.addEventListener('input', () => {
            if (confirmInput.value !== passInput.value) {
                showError('reg-confirm-password', 'Passwords do not match.'); 
            } else {
                clearError('reg-confirm-password');
            }
        });

        // SUBMIT LOGIC: Blocks redirect if errors exist
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passInput.value.trim();
            const confirmPassword = confirmInput.value.trim();
            const description = descInput.value.trim();

            let hasError = false;

            // Final safety check on submit
            if (!isValidEmail(email)) { showError('reg-email', 'Please enter a valid email format.'); hasError = true; }
            if (!isStrongPassword(password)) { showError('reg-password', 'Password must be at least 8 chars with 1 letter & 1 number.'); hasError = true; }
            if (confirmPassword !== password || confirmPassword === "") { showError('reg-confirm-password', 'Passwords do not match.'); hasError = true; }

            // If there is an error, stop everything untill no errors
            if (hasError) {
                showAuthMessage(regForm, 'Please fix the highlighted errors before submitting.', true);
                return;
            }

            // If everything is correct, save to backend and redirect
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, description })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.clear(); 
                    showAuthMessage(regForm, "Registration successful! Redirecting to login...", false);
                    setTimeout(() => window.location.href = "/login", 1500);
                } else {
                    showAuthMessage(regForm, `Registration Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error during registration:", error);
                showAuthMessage(regForm, "A network error occurred. Please try again.", true);
            }
        });
    }

    // --- 4. LOGIN ---
    const loginForm = document.getElementById('login-form'); 
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            try {
                const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem("isLoggedIn", "true");
                    sessionStorage.setItem("userRole", data.user.role);
                    sessionStorage.setItem("username", data.user.username);
                    sessionStorage.setItem("userEmail", data.user.email);
                    sessionStorage.setItem("authToken", data.token); // Secure Token
                    sessionStorage.setItem("userAvatar", data.user.avatar);
                    
                    showAuthMessage(loginForm, "Login successful! Redirecting...", false);
                    setTimeout(() => window.location.href = data.user.role === "admin" ? "/admin" : "/profile", 1000);
                } else { showAuthMessage(loginForm, data.error, true); }
            } catch (error) { showAuthMessage(loginForm, "Network error.", true); }
        });
    }

    // --- 5. EDIT PROFILE (WITH AVATAR UPLOAD) ---
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        const editUsername = document.getElementById('edit-username');
        const editEmail = document.getElementById('edit-email');
        const editDesc = document.getElementById('edit-desc');
        const avatarInput = document.getElementById('avatar');
        const formCard = editProfileForm.querySelector('.dashboard-card');
        
        if (editUsername && currentUsername) editUsername.value = currentUsername;
        if (editEmail && currentEmail) editEmail.value = currentEmail;

        const executeProfileUpdate = async (base64Avatar) => {
            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        currentEmail, token: authToken, 
                        newUsername: editUsername.value.trim(), 
                        newEmail: editEmail.value.trim(), 
                        newDescription: editDesc.value.trim(),
                        newAvatar: base64Avatar 
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    sessionStorage.setItem("username", data.user.username);
                    sessionStorage.setItem("userEmail", data.user.email);
                    if (base64Avatar) sessionStorage.setItem("userAvatar", base64Avatar);
                    
                    showAuthMessage(formCard, "Profile updated successfully!", false);
                    setTimeout(() => window.location.href = "/profile", 1500);
                } else { showAuthMessage(formCard, `Failed: ${data.error}`, true); }
            } catch (error) { showAuthMessage(formCard, "Network error.", true); }
        };

        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (avatarInput.files.length > 0) {
                const reader = new FileReader();
                reader.onloadend = () => executeProfileUpdate(reader.result);
                reader.readAsDataURL(avatarInput.files[0]);
            } else {
                executeProfileUpdate(null); // Send without avatar change
            }
        });
    }

    // --- 6. VERIFY PASSWORD  ---
    const verifyPassForm = document.getElementById('verify-password-form');
    if (verifyPassForm) {
        verifyPassForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const passwordInput = verifyPassForm.querySelector('input[type="password"]');
            const formCard = verifyPassForm.querySelector('.dashboard-card');
            
            try {
                const response = await fetch('/api/verify-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail, token: authToken, password: passwordInput.value })
                });
                if (response.ok) {
                    showAuthMessage(formCard, "Verified. Redirecting...", false);
                    setTimeout(() => window.location.href = "/change_password", 1000);
                } else {
                    showAuthMessage(formCard, "Incorrect current password.", true);
                    passwordInput.style.borderColor = '#d32f2f';
                }
            } catch (error) { showAuthMessage(formCard, "Network error.", true); }
        });
    }

    // --- 7. CHANGE PASSWORD ---
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('new-password').value;
            const confirmPass = document.getElementById('confirm-new-password').value;
            const formCard = changePassForm.querySelector('.dashboard-card');

            if (newPass !== confirmPass) return showAuthMessage(formCard, "Passwords must match.", true);

            try {
                const response = await fetch('/api/change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail, token: authToken, newPassword: newPass })
                });
                if (response.ok) {
                    showAuthMessage(formCard, "Password updated successfully!", false);
                    setTimeout(() => window.location.href = "/profile", 1500);
                } else { showAuthMessage(formCard, "Update Failed.", true); }
            } catch (error) { showAuthMessage(formCard, "Network error.", true); }
        });
    }

    // --- 8. FORGOT PASSWORD ---
    const forgotPassForm = document.getElementById('forgot-password-form');
    if (forgotPassForm) {
        forgotPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value.trim();
            
            try {
                const response = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                if (response.ok) {
                    showAuthMessage(forgotPassForm, "Reset link sent! Redirecting...", false);
                    setTimeout(() => window.location.href = "/forgot_password_confirm", 1500);
                } else {
                    showAuthMessage(forgotPassForm, "Error occurred.", true);
                }
            } catch (error) { showAuthMessage(forgotPassForm, "Network error.", true); }
        });
    }

    // --- 9. DELETE ACCOUNT ---
    const deleteBtn = document.getElementById('confirm-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const messageContainer = document.querySelector('.message-container');
            
            try {
                const response = await fetch('/api/account', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail, token: authToken })
                });
                if (response.ok) {
                    sessionStorage.clear();
                    showAuthMessage(messageContainer, "Account deleted. Goodbye!", false);
                    setTimeout(() => window.location.href = "/register", 1500);
                }
            } catch (error) { showAuthMessage(messageContainer, "Network error.", true); }
        });
    }

    // --- 10. SIGN OUT ---
    document.querySelectorAll('.sign-out-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); sessionStorage.clear(); window.location.href = "/login";
        });
    });
});