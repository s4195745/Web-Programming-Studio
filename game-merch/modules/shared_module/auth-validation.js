document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. WEB STORAGE API (Data Retention) ---
    const storageFields = ['reg-username', 'reg-email', 'reg-description', 'login-email'];
    
    storageFields.forEach(id => {
        const inputElement = document.getElementById(id);
        if (inputElement) {
            // Retrieve and populate data if it exists in sessionStorage
            const savedData = sessionStorage.getItem(id);
            if (savedData) {
                inputElement.value = savedData;
            }
            
            // Save data to sessionStorage live as the user types
            inputElement.addEventListener('input', (e) => {
                sessionStorage.setItem(id, e.target.value);
            });
        }
    });

    // --- 2. VALIDATION UTILITY FUNCTIONS ---
    const showError = (inputId, message) => {
        const errorSpan = document.getElementById(`${inputId}-error`);
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.color = 'red';
            errorSpan.style.fontSize = '0.85rem';
            errorSpan.style.display = 'block';
        }
        document.getElementById(inputId).style.borderColor = 'red';
    };

    const clearError = (inputId) => {
        const errorSpan = document.getElementById(`${inputId}-error`);
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
        }
        document.getElementById(inputId).style.borderColor = 'green';
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isStrongPassword = (password) => {
        // Minimum 8 characters, at least one letter and one number
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
    };

    // --- 3. LIVE VALIDATION LOGIC ---
    
    // REGISTRATION FORM LOGIC
    const regForm = document.getElementById('register-form');
    if (regForm) {
        const emailInput = document.getElementById('reg-email');
        const passInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm-password');

        emailInput.addEventListener('input', () => {
            if (!isValidEmail(emailInput.value)) {
                showError('reg-email', 'Please enter a valid email format.');
            } else {
                clearError('reg-email');
            }
        });

        passInput.addEventListener('input', () => {
            if (!isStrongPassword(passInput.value)) {
                showError('reg-password', 'Password must be at least 8 characters with 1 letter and 1 number.');
            } else {
                clearError('reg-password');
            }
            // Re-trigger confirm match if password changes
            if (confirmInput.value) {
                confirmInput.dispatchEvent(new Event('input'));
            }
        });

        confirmInput.addEventListener('input', () => {
            if (confirmInput.value !== passInput.value) {
                showError('reg-confirm-error', 'Passwords do not match.'); // Note: ID targets the span specifically here
                document.getElementById('reg-confirm-password').style.borderColor = 'red';
            } else {
                document.getElementById('reg-confirm-error').textContent = '';
                document.getElementById('reg-confirm-password').style.borderColor = 'green';
            }
        });

        regForm.addEventListener('submit', (e) => {
            if (!isValidEmail(emailInput.value) || !isStrongPassword(passInput.value) || (confirmInput.value !== passInput.value)) {
                e.preventDefault();
                alert('Please fix the errors before submitting.');
            } else {
                // Clear storage on successful registration simulation
                sessionStorage.clear(); 
            }
        });
    }

    // SET NEW PASSWORD FORM LOGIC
    const newPassInput = document.getElementById('new-password');
    const confirmNewInput = document.getElementById('confirm-new-password');
    if (newPassInput && confirmNewInput) {
        newPassInput.addEventListener('input', () => {
            if (!isStrongPassword(newPassInput.value)) {
                showError('new-password', 'Password must be at least 8 characters with 1 letter and 1 number.');
            } else {
                clearError('new-password');
            }
        });

        confirmNewInput.addEventListener('input', () => {
            if (confirmNewInput.value !== newPassInput.value) {
                showError('confirm-new-password', 'Passwords do not match.');
            } else {
                clearError('confirm-new-password');
            }
        });
    }
});