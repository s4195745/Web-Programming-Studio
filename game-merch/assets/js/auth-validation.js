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
    const currentToken = sessionStorage.getItem("token"); // SECURE JWT TOKEN

    const profileNameEl = document.querySelector(".profile-name");
    const profileEmailEl = document.querySelector(".profile-email");
    if (profileNameEl && currentUsername) profileNameEl.textContent = currentUsername;
    if (profileEmailEl && currentEmail) profileEmailEl.textContent = currentEmail;

    // --- 2. UI HELPER: INLINE AUTH MESSAGES ---
    function showAuthMessage(container, message, isError = true) {
        if (!container) return;
        
        // Remove any existing message
        const existingMsg = container.querySelector('.auth-system-msg');
        if (existingMsg) existingMsg.remove();

        // Create new responsive message element
        const msgDiv = document.createElement('div');
        msgDiv.className = `auth-system-msg`;
        msgDiv.style.padding = '12px';
        msgDiv.style.marginBottom = '20px';
        msgDiv.style.borderRadius = '6px';
        msgDiv.style.fontSize = '14px';
        msgDiv.style.textAlign = 'center';
        msgDiv.style.fontWeight = '600';
        msgDiv.style.backgroundColor = isError ? '#ffe6e6' : '#e6ffe6';
        msgDiv.style.color = isError ? '#d32f2f' : '#2e7d32';
        msgDiv.style.border = `1px solid ${isError ? '#d32f2f' : '#2e7d32'}`;
        msgDiv.textContent = message;

        // Insert at the top of the container/form
        container.insertBefore(msgDiv, container.firstChild);
    }

    // --- 3. VALIDATION UTILITIES ---
    const showError = (inputId, message) => {
        const errorSpan = document.getElementById(`${inputId}-error`);
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.color = '#d32f2f';
            errorSpan.style.fontSize = '0.85rem';
            errorSpan.style.display = 'block';
        }
        const targetInput = document.getElementById(inputId);
        if (targetInput) targetInput.style.borderColor = '#d32f2f';
    };

    const clearError = (inputId) => {
        const errorSpan = document.getElementById(`${inputId}-error`);
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
        }
        const targetInput = document.getElementById(inputId);
        if (targetInput) targetInput.style.borderColor = '#2e7d32';
    };

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isStrongPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

    // --- 4. REGISTRATION LOGIC ---
    const regForm = document.getElementById('register-form');
    if (regForm) {
        const usernameInput = document.getElementById('reg-username');
        const emailInput = document.getElementById('reg-email');
        const passInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm-password');
        const descInput = document.getElementById('reg-description');

        emailInput.addEventListener('input', () => {
            if (!isValidEmail(emailInput.value)) showError('reg-email', 'Please enter a valid email format.');
            else clearError('reg-email');
        });

        passInput.addEventListener('input', () => {
            if (!isStrongPassword(passInput.value)) showError('reg-password', 'Password must be at least 8 characters with 1 letter and 1 number.');
            else clearError('reg-password');
            if (confirmInput.value) confirmInput.dispatchEvent(new Event('input'));
        });

        confirmInput.addEventListener('input', () => {
            if (confirmInput.value !== passInput.value) {               
                showError('reg-confirm-password', 'Passwords do not match.'); 
            } else {
                clearError('reg-confirm-password');
            }
        });

        regForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passInput.value.trim();
            const confirmPassword = confirmInput.value.trim();
            const description = descInput.value.trim();

            if (!isValidEmail(email) || !isStrongPassword(password) || (confirmPassword !== password)) {
                showAuthMessage(regForm, 'Please fix the highlighted errors before submitting.', true);
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

    // --- 5. LOGIN LOGIC ---
    const loginForm = document.getElementById('login-form'); 
    if (loginForm) {
        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (email === "" || password === "") {
                showAuthMessage(loginForm, "Please enter both email and password.", true);
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
                    sessionStorage.setItem("userRole", data.user.role);
                    sessionStorage.setItem("username", data.user.username);
                    sessionStorage.setItem("userEmail", data.user.email);
                    
                    // SAVE SECURE TOKEN
                    sessionStorage.setItem("token", data.token); 
                    if (data.user.avatar) sessionStorage.setItem('profileAvatarBase64', data.user.avatar);
                    
                    showAuthMessage(loginForm, "Login successful! Redirecting...", false);
                    
                    setTimeout(() => {
                        if (data.user.role === "admin") window.location.href = "/admin"; 
                        else window.location.href = "/profile"; 
                    }, 1000);
                } else {
                    showAuthMessage(loginForm, data.error, true);
                }
            } catch (error) {
                console.error("Error during login:", error);
                showAuthMessage(loginForm, "A network error occurred. Please try again.", true);
            }
        });
    }

    // --- 5B. LANDING PAGE LOGIN LOGIC ---
    const landingLoginForm = document.getElementById('landing-login-form');
    if (landingLoginForm) {
        const landingEmailInput = document.getElementById('landing-login-email');
        const landingPasswordInput = document.getElementById('landing-login-password');

        landingLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop the browser from redirecting

            const email = landingEmailInput.value.trim();
            const password = landingPasswordInput.value.trim();

            if (email === "" || password === "") {
                showAuthMessage(landingLoginForm, "Please enter both email and password.", true);
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
                    sessionStorage.setItem("userRole", data.user.role);
                    sessionStorage.setItem("username", data.user.username);
                    sessionStorage.setItem("userEmail", data.user.email);
                    sessionStorage.setItem("token", data.token); 
                    if (data.user.avatar) sessionStorage.setItem('profileAvatarBase64', data.user.avatar);
                    
                    showAuthMessage(landingLoginForm, "Login successful! Redirecting...", false);
                    
                    setTimeout(() => {
                        if (data.user.role === "admin") window.location.href = "/admin"; 
                        else window.location.href = "/profile"; 
                    }, 1000);
                } else {
                    showAuthMessage(landingLoginForm, data.error, true);
                }
            } catch (error) {
                console.error("Error during login:", error);
                showAuthMessage(landingLoginForm, "A network error occurred. Please try again.", true);
            }
        });
    }

    // --- 6. EDIT PROFILE LOGIC ---
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
            
            // The dashboard card containing the form inputs
            const formCard = editProfileForm.querySelector('.dashboard-card');

            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        currentEmail: currentEmail,
                        token: currentToken, // Secured with token
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
                    showAuthMessage(formCard, "Profile updated successfully!", false);
                    
                    // Remove message after 3 seconds
                    setTimeout(() => {
                        const msg = formCard.querySelector('.auth-system-msg');
                        if(msg) msg.remove();
                    }, 3000);
                } else {
                    showAuthMessage(formCard, `Update Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error during update:", error);
                showAuthMessage(formCard, "A network error occurred.", true);
            }
        });
    }

    // --- 7. CHANGE PASSWORD LOGIC ---
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
        const newPassInput = document.getElementById('new-password');
        const confirmNewInput = document.getElementById('confirm-new-password');
        const formCard = changePassForm.querySelector('.dashboard-card');

        newPassInput.addEventListener('input', () => {
            if (!isStrongPassword(newPassInput.value)) showError('new-password', 'Password must be at least 8 characters with 1 letter and 1 number.');
            else clearError('new-password');
        });

        confirmNewInput.addEventListener('input', () => {
            if (confirmNewInput.value !== newPassInput.value) showError('confirm-new-error', 'Passwords do not match.');
            else {
                const errSpan = document.getElementById('confirm-new-error');
                if (errSpan) errSpan.textContent = '';
                confirmNewInput.style.borderColor = '#2e7d32';
            }
        });

        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentEmail || !currentToken) {
                showAuthMessage(formCard, "Session expired. Please log in again.", true);
                setTimeout(() => window.location.href = "/login", 1500);
                return;
            }

            if (!isStrongPassword(newPassInput.value) || newPassInput.value !== confirmNewInput.value) {
                showAuthMessage(formCard, "Please ensure passwords are strong and match.", true);
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
                    showAuthMessage(formCard, "Password updated successfully!", false);
                    setTimeout(() => window.location.href = "/profile", 1500);
                } else {
                    showAuthMessage(formCard, `Update Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error updating password:", error);
                showAuthMessage(formCard, "A network error occurred.", true);
            }
        });
    }

    // --- 8. DELETE ACCOUNT LOGIC ---
    const deleteBtn = document.getElementById('confirm-delete-btn');
    if (deleteBtn) {
        const messageContainer = document.querySelector('.message-container');
        
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!currentEmail || !currentToken) {
                showAuthMessage(messageContainer, "Session expired. Please log in again.", true);
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
                    showAuthMessage(messageContainer, "Account permanently deleted. Goodbye!", false);
                    setTimeout(() => window.location.href = "/register", 1500);
                } else {
                    showAuthMessage(messageContainer, `Deletion Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error deleting account:", error);
                showAuthMessage(messageContainer, "A network error occurred.", true);
            }
        });
    }

    // --- 9. SIGN OUT LOGIC ---
    const signOutLinks = document.querySelectorAll('.sign-out-link');
    signOutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = "/login";
        });
    });

// --- 10. VERIFY CURRENT PASSWORD LOGIC ---
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
                    showAuthMessage(formCard, "Password verified. Redirecting...", false);
                    setTimeout(() => window.location.href = "/change_password", 1000);
                } else {
                    const data = await response.json();
                    showAuthMessage(formCard, data.error || "Incorrect current password. Please try again.", true);
                    passwordInput.style.borderColor = '#d32f2f';
                }
            } catch (error) {
                console.error("Error verifying password:", error);
                showAuthMessage(formCard, "A network error occurred. Please try again.", true);
            }
        });
    }

    // --- 11. PROFILE AVATAR PREVIEW LOGIC ---
    const avatarInput = document.getElementById('avatar');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showAuthMessage(document.querySelector('.dashboard-card'), "Please select a valid image file.", true);
                    e.target.value = ''; 
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    sessionStorage.setItem('profileAvatarBase64', event.target.result);
                    const profileAvatars = document.querySelectorAll('.profile-avatar, .nav-avatar');
                    profileAvatars.forEach(img => img.src = event.target.result);
                    showAuthMessage(document.querySelector('.dashboard-card'), "Avatar preview ready! Click Save Changes.", false);
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
    
    // --- 12. FORGOT PASSWORD LOGIC ---
    const forgotPassForm = document.getElementById('forgot-password-form');
    if (forgotPassForm) {
        const resetEmailInput = document.getElementById('reset-email');

        forgotPassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = resetEmailInput.value.trim();
            if (!isValidEmail(email)) {
                showAuthMessage(forgotPassForm, "Please enter a valid email format.", true);
                return;
            }

            try {
                // We send it to our backend API
                await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                // Security best practice: Always show the same success message 
                // regardless of whether the email exists in the database or not.
                showAuthMessage(forgotPassForm, "Processing request...", false);
                
                setTimeout(() => {
                    window.location.href = "/forgot_password_confirm";
                }, 1000);

            } catch (error) {
                console.error("Error during password reset:", error);
                showAuthMessage(forgotPassForm, "A network error occurred. Please try again.", true);
            }
        });
    }
});