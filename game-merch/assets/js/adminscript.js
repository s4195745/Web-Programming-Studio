(() => {
    'use strict';

    let pendingLockAction = null;

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

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
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
                            <span class="status-tag ${locked ? 'locked' : 'active'}">
                                ${locked ? 'Locked' : 'Active'}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="admin-btn"
                                data-lock-id="${escapeHtml(user.id)}"
                                data-locked="${locked}"
                            >
                                ${locked ? 'Unlock' : 'Lock'}
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
            `;

            const confirmButton =
                document.getElementById(
                    'admin-modal-confirm-btn'
                );

            if (confirmButton) {
                confirmButton.style.display = 'none';
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
            confirmButton.onclick = null;
        }

        pendingLockAction = null;
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

    document.addEventListener(
        'DOMContentLoaded',
        loadAdminUsers
    );
})();