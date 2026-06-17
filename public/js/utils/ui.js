/**
 * Utilidades de interfaz de usuario y manipulación del DOM.
 */
const UI = {
    switchView(viewId) {
        document.querySelectorAll('.view-section').forEach((section) => {
            section.classList.remove('active-view');
        });
        document.getElementById(viewId)?.classList.add('active-view');
    },

    logConsole(message, obj = null) {
        if (!APP_CONFIG.debugMode) return;

        const consoleBox = document.getElementById('console-output');
        if (!consoleBox) return;

        const timestamp = new Date().toLocaleTimeString();
        let logLine = `[${timestamp}] ${message}`;
        if (obj != null) {
            logLine += `\n${JSON.stringify(obj, null, 2)}`;
        }

        consoleBox.textContent =
            `${logLine}\n───────────────────────────────────\n${consoleBox.textContent}`;
    },

    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) {
            alert(message);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('toast-visible'));

        setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    showSuccess(message) {
        this.showToast(message, 'success');
    },

    showError(message) {
        this.showToast(message, 'error', 6000);
    },

    setLoading(element, isLoading, loadingText = 'Cargando...') {
        if (!element) return;

        if (isLoading) {
            element.dataset.originalContent = element.innerHTML;
            element.innerHTML = `<span class="spinner"></span> ${loadingText}`;
            element.disabled = true;
            element.classList.add('is-loading');
        } else {
            if (element.dataset.originalContent) {
                element.innerHTML = element.dataset.originalContent;
                delete element.dataset.originalContent;
            }
            element.disabled = false;
            element.classList.remove('is-loading');
        }
    },

    toggleElement(element, visible) {
        if (!element) return;
        element.hidden = !visible;
    },

    updateNavbar() {
        const token = Auth.getToken();
        const elements = {
            login: document.getElementById('nav-login'),
            logout: document.getElementById('nav-logout'),
            reservations: document.getElementById('nav-my-reservations'),
            owner: document.getElementById('nav-owner-spaces'),
            admin: document.getElementById('nav-admin'),
            notifications: document.getElementById('nav-notifications'),
            userInfo: document.getElementById('user-info'),
        };

        const isLoggedIn = Boolean(token);

        this.toggleElement(elements.login, !isLoggedIn);
        this.toggleElement(elements.logout, isLoggedIn);
        this.toggleElement(elements.reservations, isLoggedIn);
        this.toggleElement(elements.owner, isLoggedIn);
        this.toggleElement(elements.notifications, isLoggedIn);
        this.toggleElement(elements.userInfo, isLoggedIn);
        this.toggleElement(elements.admin, isLoggedIn && Auth.isAdmin());

        if (isLoggedIn && elements.userInfo) {
            elements.userInfo.textContent = Auth.getUsername() || 'Usuario';
        }
    },

    formatCurrency(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return '$0.00';
        return `$${num.toFixed(2)}`;
    },

    formatDate(dateValue) {
        if (!dateValue) return '—';
        return new Date(dateValue).toLocaleDateString('es-AR');
    },

    formatDateTime(dateValue) {
        if (!dateValue) return '—';
        return new Date(dateValue).toLocaleString('es-AR');
    },

    renderStars(score) {
        const num = Math.min(5, Math.max(0, score || 0));
        return '★'.repeat(num) + '☆'.repeat(5 - num);
    },

    getOwnerId(space) {
        return (
            space?.idConsumerOwner ??
            space?.consumerOwner?.idConsumer ??
            null
        );
    },

    getCancellationPolicy(space) {
        if (!space?.cancellationPolicies) return 'No definida';
        if (typeof space.cancellationPolicies === 'string') {
            return space.cancellationPolicies;
        }
        return space.cancellationPolicies.type || 'No definida';
    },

    initDebugPanel() {
        const wrapper = document.querySelector('.console-wrapper');
        if (!wrapper) return;

        if (APP_CONFIG.debugMode) {
            wrapper.style.display = 'block';
        } else {
            wrapper.style.display = 'none';
        }

        document.querySelectorAll('.endpoint-label').forEach((el) => {
            el.style.display = APP_CONFIG.debugMode ? 'inline-block' : 'none';
        });
    },
};
