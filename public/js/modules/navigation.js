/**
 * Navegación y control de acceso por rol.
 */
const Navigation = {
    VIEW_HANDLERS: {
        'view-spaces': () => CatalogModule.load(),
        'view-reservations': () => ReservationsModule.load(),
        'view-notifications': () => NotificationsModule.load(),
        'view-owner-spaces': () => {
            OwnerModule.invalidateMapSize();
            OwnerModule.loadOwnedSpaces();
        },
    },

    init() {
        document.getElementById('main-nav')?.addEventListener('click', (e) => this.handleNavClick(e));
        document.getElementById('nav-logout')?.addEventListener('click', () => this.handleLogout());
        this.applyRoleRestrictions();
    },

    handleNavClick(event) {
        const target = event.target.closest('[data-view]');
        if (!target) return;

        const viewId = target.dataset.view;

        if (viewId === 'view-admin' && !Auth.isAdmin()) {
            UI.showError('Acceso restringido a administradores.');
            App.navigateTo('view-spaces');
            return;
        }

        App.navigateTo(viewId);
    },

    async handleLogout() {
        try {
            if (Auth.isAuthenticated()) {
                await ApiService.logout();
            }
        } catch {
            // El token puede haber expirado; igual limpiamos la sesión local.
        }

        Auth.clearSession();
        UI.updateNavbar();
        this.applyRoleRestrictions();
        this.clearNotificationBadge();

        UI.showSuccess('Sesión cerrada.');
        UI.logConsole('Sesión finalizada');
        App.navigateTo('view-auth');
    },

    clearNotificationBadge() {
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.textContent = '';
            badge.hidden = true;
        }
    },

    applyRoleRestrictions() {
        UI.updateNavbar();
    },

    onViewChange(viewId) {
        const handler = this.VIEW_HANDLERS[viewId];
        if (handler) handler();
    },
};
