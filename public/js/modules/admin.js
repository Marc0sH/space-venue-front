/**
 * Módulo de administración: usuarios y simulación de webhooks.
 */
const AdminModule = {
    init() {
        document.getElementById('btn-admin-list-users')?.addEventListener('click', () => this.loadUsers());
        document.getElementById('btn-trigger-webhook')?.addEventListener('click', () => this.simulateWebhook());
    },

    async loadUsers() {
        const list = document.getElementById('admin-users-list');
        const btn = document.getElementById('btn-admin-list-users');

        UI.setLoading(btn, true, 'Consultando...');

        try {
            const users = await ApiService.adminListUsers();
            list.innerHTML = '';

            if (!users?.length) {
                list.innerHTML = '<li>No hay usuarios registrados.</li>';
                return;
            }

            users.forEach((user) => {
                const li = document.createElement('li');
                const id = user.idConsumer || user.id;
                const isActive = user.isActive !== false;

                li.innerHTML = `
                    <span class="user-id">#${id}</span>
                    <strong>${user.username}</strong>
                    <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">
                        ${isActive ? 'Activo' : 'Inactivo'}
                    </span>
                `;
                list.appendChild(li);
            });

            UI.logConsole('Usuarios listados', { total: users.length });
        } catch (err) {
            UI.showError('No se pudo obtener la lista de usuarios. Verificá permisos de administrador.');
            UI.logConsole(`Error admin: ${err.message}`);
        } finally {
            UI.setLoading(btn, false);
        }
    },

    async simulateWebhook() {
        const paymentId = document.getElementById('webhook-payment-id').value;
        const reservationId = prompt('Ingresá el ID de la reserva TENTATIVE a confirmar:');

        if (!reservationId) return;

        const payload = {
            type: 'payment',
            isSimulation: true,
            reservationId,
            data: { id: paymentId.toString() },
        };

        const btn = document.getElementById('btn-trigger-webhook');
        UI.setLoading(btn, true, 'Simulando...');

        try {
            await ApiService.simulateWebhook(payload);
            UI.showSuccess(`Webhook simulado para reserva #${reservationId}.`);
            ReservationsModule.load();
        } catch (err) {
            UI.showError(err.message || 'Falló la simulación del webhook.');
        } finally {
            UI.setLoading(btn, false);
        }
    },
};
