(() => {
    'use strict';

    let pendingLockAction = null;
    let pendingDeleteAction = null;

    function getTableBody() {
        return document.querySelector('#admin-users-table tbody');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // FIXED: Now properly grabs the token from sessionStorage and sends it to the backend
    async function apiRequest(url, options = {}) {
        const token = sessionStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers
        });

        let data = null;

        try {
            data = await response.json();
        } catch (_) {}

        if (!response.ok) {
            throw new Error(
                data?.error ||
                `Server returned status ${response.status}`
            );
        }

        return data;
    }

    async function loadAdminUsers() {
        const tbody = getTableBody();

        if (!tbody) {
            console.error('Admin users table was not found.');
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="4">Loading users...</td>
            </tr>
        `;

        try {
            const users = await apiRequest('/api/admin/users');

            if (!Array.isArray(users) || users.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4">No users found.</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = users.map(user => {
                const locked = Boolean(user.isLocked);

                return `
                    <tr>
                        <td>${escapeHtml(user.id)}</td>

                        <td>
                            <button
                                type="button"
                                class="admin-user-link"
                                data-user-id="${escapeHtml(user.id)}"
                                style="background:none; border:none; color:var(--accent-color); cursor:pointer; font-family:inherit;"
                            >
                                <strong>
                                    ${escapeHtml(user.username || 'N/A')}
                                </strong>
                            </button>

                            <br>

                            <small>
                                ${escapeHtml(user.email || 'N/A')}
                            </small>
                        </td>

                        <td>
                            <span class="status-badge ${locked ? 'locked' : 'active'}">
                                ${locked ? 'Locked' : 'Active'}
                            </span>
                        </td>

                        <td>
                            <!-- FIXED: Class name updated to match admin.css -->
                            <button
                                type="button"
                                class="admin-action-btn ${locked ? 'unlock' : 'lock'}"
                                data-lock-id="${escapeHtml(user.id)}"
                                data-locked="${locked}"
                            >
                                ${locked ? 'Unlock' : 'Lock'}
                            </button>
                            <button
                                type="button"
                                class="admin-action-btn delete"
                                data-delete-id="${escapeHtml(user.id)}"
                                data-username="${escapeHtml(user.username || '')}"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.querySelectorAll('[data-user-id]').forEach(button => {
                button.addEventListener('click', () => {
                    fetchAndDisplayUserInfo(
                        button.dataset.userId
                    );
                });
            });

            tbody.querySelectorAll('[data-lock-id]').forEach(button => {
                button.addEventListener('click', () => {
                    openLockConfirmation(
                        button.dataset.lockId,
                        button.dataset.locked === 'true'
                    );
                });
            });

            tbody.querySelectorAll('[data-delete-id]').forEach(button => {
                button.addEventListener('click', () => {
                    openDeleteConfirmation(
                        button.dataset.deleteId,
                        button.dataset.username
                    );
                });
            });

        } catch (error) {
            console.error(
                'Error loading admin users:',
                error
            );

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="color:red;">
                        ${escapeHtml(
                            error.message ||
                            'Error loading users.'
                        )}
                    </td>
                </tr>
            `;
        }
    }

    async function fetchAndDisplayUserInfo(userId) {
        try {
            const user = await apiRequest(
                `/api/admin/users/${encodeURIComponent(userId)}`
            );

            const title =
                document.getElementById('admin-modal-title');

            const message =
                document.getElementById('admin-modal-message');

            const modal =
                document.getElementById('admin-confirm-modal');

            if (!title || !message || !modal) {
                return;
            }

            title.textContent =
                `User Info: ${user.username || 'N/A'}`;

            message.innerHTML = `
                <p>
                    <strong>ID:</strong>
                    ${escapeHtml(user.id)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHtml(user.email)}
                </p>

                <p>
                    <strong>Role:</strong>
                    ${escapeHtml(user.role)}
                </p>

                <p>
                    <strong>Description:</strong>
                    ${escapeHtml(user.description || 'N/A')}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${user.isLocked ? 'Locked' : 'Active'}
                </p>

                ${user.role === 'admin' ? '' : `
                <div class="admin-info-danger">
                    <button type="button" id="admin-delete-account-btn" class="admin-btn-confirm admin-btn-danger">
                        <i class="ri-delete-bin-line"></i> Delete Account
                    </button>
                </div>
                `}
            `;

            const confirmButton =
                document.getElementById(
                    'admin-modal-confirm-btn'
                );

            if (confirmButton) {
                confirmButton.style.display = 'none';
            }

            const deleteFromInfoBtn = document.getElementById('admin-delete-account-btn');
            if (deleteFromInfoBtn) {
                deleteFromInfoBtn.addEventListener('click', () => {
                    openDeleteConfirmation(user.id, user.username);
                });
            }

            modal.classList.add('active');

        } catch (error) {
            console.error(
                'Error retrieving user info:',
                error
            );

            alert(
                error.message ||
                'Failed to retrieve user information.'
            );
        }
    }

    function openLockConfirmation(
        userId,
        currentlyLocked
    ) {
        const modal =
            document.getElementById(
                'admin-confirm-modal'
            );

        const title =
            document.getElementById(
                'admin-modal-title'
            );

        const message =
            document.getElementById(
                'admin-modal-message'
            );

        const confirmButton =
            document.getElementById(
                'admin-modal-confirm-btn'
            );

        if (
            !modal ||
            !title ||
            !message ||
            !confirmButton
        ) {
            return;
        }

        pendingLockAction = {
            userId,
            currentlyLocked
        };

        title.textContent =
            currentlyLocked
                ? 'Unlock User'
                : 'Lock User';

        message.textContent =
            currentlyLocked
                ? 'Are you sure you want to unlock this account?'
                : 'Are you sure you want to lock this account?';

        confirmButton.textContent =
            currentlyLocked
                ? 'Unlock'
                : 'Lock';

        confirmButton.style.display = '';
        confirmButton.disabled = false;
        confirmButton.onclick = confirmLockAction;

        modal.classList.add('active');
    }

    async function confirmLockAction() {
        if (!pendingLockAction) {
            return;
        }

        const {
            userId,
            currentlyLocked
        } = pendingLockAction;

        const endpoint =
            currentlyLocked
                ? `/api/admin/users/${encodeURIComponent(userId)}/unlock`
                : `/api/admin/users/${encodeURIComponent(userId)}/lock`;

        const confirmButton =
            document.getElementById(
                'admin-modal-confirm-btn'
            );

        if (confirmButton) {
            confirmButton.disabled = true;
        }

        try {
            await apiRequest(endpoint, {
                method: 'POST'
            });

            closeAdminModal();

            await loadAdminUsers();

        } catch (error) {
            console.error(
                'Error changing user lock status:',
                error
            );

            alert(
                error.message ||
                'Failed to update user status.'
            );

        } finally {
            if (confirmButton) {
                confirmButton.disabled = false;
            }

            pendingLockAction = null;
        }
    }

    function openDeleteConfirmation(userId, username) {
        const modal =
            document.getElementById(
                'admin-confirm-modal'
            );

        const title =
            document.getElementById(
                'admin-modal-title'
            );

        const message =
            document.getElementById(
                'admin-modal-message'
            );

        const confirmButton =
            document.getElementById(
                'admin-modal-confirm-btn'
            );

        if (
            !modal ||
            !title ||
            !message ||
            !confirmButton
        ) {
            return;
        }

        pendingDeleteAction = { userId, username };

        title.textContent = 'Delete Account';

        message.innerHTML = `
            <p>Are you sure you want to permanently delete <strong>${escapeHtml(username || 'this user')}</strong>?</p>
            <p style="color:#b42318;">
                This will permanently remove the account and everything attached to it
                (threads, replies, blog posts/comments, cart, wishlist, reviews, orders)
                from the database. This cannot be undone.
            </p>
        `;

        confirmButton.textContent = 'Delete';
        confirmButton.style.display = '';
        confirmButton.disabled = false;
        confirmButton.classList.add('admin-btn-danger');
        confirmButton.onclick = confirmDeleteAction;

        modal.classList.add('active');
    }

    async function confirmDeleteAction() {
        if (!pendingDeleteAction) {
            return;
        }

        const { userId } = pendingDeleteAction;

        const confirmButton =
            document.getElementById(
                'admin-modal-confirm-btn'
            );

        if (confirmButton) {
            confirmButton.disabled = true;
        }

        try {
            await apiRequest(
                `/api/admin/users/${encodeURIComponent(userId)}`,
                { method: 'DELETE' }
            );

            closeAdminModal();

            await loadAdminUsers();

        } catch (error) {
            console.error(
                'Error deleting account:',
                error
            );

            alert(
                error.message ||
                'Failed to delete account.'
            );

        } finally {
            if (confirmButton) {
                confirmButton.disabled = false;
            }

            pendingDeleteAction = null;
        }
    }

    function closeAdminModal() {
        const modal =
            document.getElementById(
                'admin-confirm-modal'
            );

        const confirmButton =
            document.getElementById(
                'admin-modal-confirm-btn'
            );

        if (modal) {
            modal.classList.remove('active');
        }

        if (confirmButton) {
            confirmButton.style.display = '';
            confirmButton.disabled = false;
            confirmButton.classList.remove('admin-btn-danger');
            confirmButton.onclick = null;
        }

        pendingLockAction = null;
        pendingDeleteAction = null;
    }

    function toggleAdminPanel() {
        const panel =
            document.getElementById(
                'admin-side-panel'
            );

        if (panel) {
            panel.classList.toggle('active');
        }
    }

    window.loadAdminUsers =
        loadAdminUsers;

    window.fetchAndDisplayUserInfo =
        fetchAndDisplayUserInfo;

    window.closeAdminModal =
        closeAdminModal;

    window.toggleAdminPanel =
        toggleAdminPanel;

    window.handleUserLockToggle =
        openLockConfirmation;

    window.openDeleteConfirmation =
        openDeleteConfirmation;

    document.addEventListener(
        'DOMContentLoaded',
        loadAdminUsers
    );
})();