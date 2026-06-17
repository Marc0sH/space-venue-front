/**
 * Capa de servicios HTTP centralizada para la API de Space & Venue.
 */
const ApiService = {
    getHeaders(includeJson = true) {
        const headers = {};
        if (includeJson) {
            headers['Content-Type'] = 'application/json';
        }
        const token = Auth.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(endpoint, method = 'GET', body = null) {
        const config = {
            method,
            headers: this.getHeaders(body != null),
        };

        if (body != null) {
            config.body = JSON.stringify(body);
        }

        const url = `${APP_CONFIG.apiBaseUrl}${endpoint}`;
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return response.json();
        }

        const text = await response.text();
        return text || null;
    },

    get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    },

    put(endpoint, data) {
        return this.request(endpoint, 'PUT', data);
    },

    delete(endpoint) {
        return this.request(endpoint, 'DELETE');
    },

    // --- Autenticación ---
    async login(username, password) {
        const response = await fetch(`${APP_CONFIG.apiBaseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.text();
        if (!response.ok) {
            throw new Error(data || 'Credenciales inválidas');
        }

        const token = Auth.extractBearerToken(data);
        if (!token) {
            throw new Error('Respuesta de autenticación inválida');
        }
        return token;
    },

    register(dto) {
        return this.post('/api/auth/register', dto);
    },

    logout() {
        return this.post('/api/auth/logout');
    },

    // --- Espacios ---
    getSpaces() {
        return this.get('/api/spaces');
    },

    getSpaceById(id) {
        return this.get(`/api/spaces/${id}`);
    },

    filterSpaces(filterDto) {
        return this.post('/api/spaces/byfields', filterDto);
    },

    getOwnedSpaces() {
        return this.get('/api/spaces/ownedspaces');
    },

    createSpace(dto) {
        return this.post('/api/spaces/ownedspace', dto);
    },

    // --- Reservas ---
    getMyReservations() {
        return this.get('/api/reservations/me');
    },

    createReservation(dto) {
        return this.post('/api/reservations', dto);
    },

    cancelReservation(id) {
        return this.put(`/api/reservations/cancel/${id}`);
    },

    triggerCheckout(id) {
        return this.post(`/api/reservations/${id}/checkout`);
    },

    // --- Comentarios ---
    getCommentsBySpace(idSpace) {
        return this.get(`/api/comments/byspaceid/${idSpace}`);
    },

    createComment(dto) {
        return this.post('/api/comments', dto);
    },

    // --- Notificaciones ---
    getNotifications() {
        return this.get('/api/notifications');
    },

    getUnreadNotificationsCount() {
        return this.get('/api/notifications/unread-count');
    },

    // --- Administración ---
    adminListUsers() {
        return this.get('/api/usuarios');
    },

    simulateWebhook(payload) {
        return this.post('/api/v1/payments/webhook', payload);
    },
};
