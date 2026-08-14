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

    const profileNameEl = document.querySelector(".profile-name");
    const profileEmailEl = document.querySelector(".profile-email");
    if (profileNameEl && currentUsername) profileNameEl.textContent = currentUsername;
    if (profileEmailEl && currentEmail) profileEmailEl.textContent = currentEmail;

    // --- 2. VALIDATION UTILITIES ---
    const showError = (inputId, message) => {
        const errorSpan = document.getElementById(`${inputId}-error`);
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.color = 'red';
            errorSpan.style.fontSize = '0.85rem';
            errorSpan.style.display = 'block';
        }
        const targetInput = document.getElementById(inputId);
        if (targetInput) targetInput.style.borderColor = 'red';
    };

    const clearError = (inputId) => {
        const errorSpan = document.getElementById(`${inputId}-error`);
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
        }
        const targetInput = document.getElementById(inputId);
        if (targetInput) targetInput.style.borderColor = 'green';
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
                showError('reg-confirm-error', 'Passwords do not match.'); 
                document.getElementById('reg-confirm-password').style.borderColor = 'red';
            } else {
                const errorSpan = document.getElementById('reg-confirm-error');
                if (errorSpan) errorSpan.textContent = '';
                document.getElementById('reg-confirm-password').style.borderColor = 'green';
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
                alert('Please fix the errors before submitting.');
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
                    alert("Registration successful! Please log in.");
                    window.location.href = "/login";
                } else {
                    alert(`Registration Failed: ${data.error}`);
                }
            } catch (error) {
                console.error("Error during registration:", error);
                alert("An error occurred during registration. Please try again.");
            }
        });
    }

    // --- 4. LOGIN LOGIC ---
    const loginForm = document.getElementById('login-form'); 
    if (loginForm) {
        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (email === "" || password === "") {
                alert("Please enter both email and password!");
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
                    
                    if (data.user.role === "admin") window.location.href = "/admin"; 
                    else window.location.href = "/profile"; 
                } else {
                    alert(`Login Failed: ${data.error}`);
                }
            } catch (error) {
                console.error("Error during login:", error);
                alert("An error occurred while trying to log in. Please try again.");
            }
        });
    }

    // --- 5. EDIT PROFILE LOGIC ---
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

            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        currentEmail: currentEmail,
                        newUsername, 
                        newEmail, 
                        newDescription 
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem("username", data.user.username);
                    sessionStorage.setItem("userEmail", data.user.email);
                    alert("Profile updated successfully!");
                    window.location.href = "/profile";
                } else {
                    alert(`Update Failed: ${data.error}`);
                }
            } catch (error) {
                console.error("Error during update:", error);
            }
        });
    }

    // --- 6. CHANGE PASSWORD LOGIC ---
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
        const newPassInput = document.getElementById('new-password');
        const confirmNewInput = document.getElementById('confirm-new-password');

        newPassInput.addEventListener('input', () => {
            if (!isStrongPassword(newPassInput.value)) showError('new-password', 'Password must be at least 8 characters with 1 letter and 1 number.');
            else clearError('new-password');
        });

        confirmNewInput.addEventListener('input', () => {
            if (confirmNewInput.value !== newPassInput.value) showError('confirm-new-error', 'Passwords do not match.');
            else {
                const errSpan = document.getElementById('confirm-new-error');
                if (errSpan) errSpan.textContent = '';
                confirmNewInput.style.borderColor = 'green';
            }
        });

        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentEmail) {
                alert("Please log in first.");
                window.location.href = "/login";
                return;
            }

            if (!isStrongPassword(newPassInput.value) || newPassInput.value !== confirmNewInput.value) {
                alert("Please ensure passwords are strong and match.");
                return;
            }

            try {
                const response = await fetch('/api/change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: currentEmail,
                        newPassword: newPassInput.value
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Password updated successfully!");
                    window.location.href = "/profile";
                } else {
                    alert(`Password Update Failed: ${data.error}`);
                }
            } catch (error) {
                console.error("Error updating password:", error);
            }
        });
    }

    // --- 7. DELETE ACCOUNT LOGIC ---
    const deleteBtn = document.getElementById('confirm-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!currentEmail) {
                alert("No active session found.");
                return;
            }

            try {
                const response = await fetch('/api/account', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentEmail })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.clear();
                    alert("Account permanently deleted.");
                    window.location.href = "/register";
                } else {
                    alert(`Deletion Failed: ${data.error}`);
                }
            } catch (error) {
                console.error("Error deleting account:", error);
            }
        });
    }

    // --- 8. SIGN OUT LOGIC ---
    const signOutLinks = document.querySelectorAll('.sign-out-link');
    signOutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = "/login";
        });
    });
});