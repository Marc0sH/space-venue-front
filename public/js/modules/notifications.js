/**
 * Módulo de notificaciones del usuario.
 */
const NotificationsModule = {
    init() {},

    async refreshAll() {
        await Promise.allSettled([this.load(), this.updateBadge()]);
    },

    async load() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        if (!Auth.isAuthenticated()) {
            container.innerHTML = '<p class="placeholder-text">Iniciá sesión para ver tus notificaciones.</p>';
            return;
        }

        container.innerHTML = '<p class="placeholder-text">Cargando notificaciones...</p>';

        try {
            const notifications = await ApiService.getNotifications();
            container.innerHTML = '';

            if (!notifications?.length) {
                container.innerHTML = '<p class="placeholder-text">No tenés notificaciones pendientes.</p>';
                return;
            }

            notifications.forEach((notification) => {
                container.appendChild(this.createCard(notification));
            });

            UI.logConsole('Notificaciones cargadas', { total: notifications.length });
        } catch (err) {
            container.innerHTML = `<p class="error-text">${err.message}</p>`;
        }
    },

    createCard(notification) {
        const card = document.createElement('article');
        card.className = 'card notification-card';

        card.innerHTML = `
            <p>${notification.message || notification.mensaje || 'Nueva actualización'}</p>
            <time class="text-muted">${UI.formatDateTime(notification.dateSend)}</time>
        `;

        return card;
    },

    async updateBadge() {
        const badge = document.getElementById('notif-badge');
        if (!badge || !Auth.isAuthenticated()) return;

        try {
            const data = await ApiService.getUnreadNotificationsCount();
            const count = data?.count ?? 0;

            if (count > 0) {
                badge.textContent = count;
                badge.hidden = false;
            } else {
                badge.textContent = '';
                badge.hidden = true;
            }
        } catch (err) {
            UI.logConsole(`Error al obtener contador de notificaciones: ${err.message}`);
        }
    },
};
