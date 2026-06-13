/**
 * Capa de Servicios del Cliente HTTP (Fetch API con Interceptor Core)
 * Adaptado con precisión a las rutas reales y requerimientos de Space & Venue
 */
const ApiService = {
    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem("jwt_token");
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async request(endpoint, method = 'GET', body = null) {
        const config = {
            method: method,
            headers: this.getHeaders()
        };
        if (body) {
            config.body = JSON.stringify(body);
        }

        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, config);
        
        // Si el estado HTTP indica error (4xx o 5xx), interceptamos la excepción
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Fallo Operacional: Código ${response.status}`);
        }
        
        // Manejo adaptativo de respuestas con o sin contenido JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return await response.text();
    },

    // ATAJO GENÉRICO POST: Necesario para que el formulario de Registro envíe payloads libres
    post(endpoint, data) {
        return this.request(endpoint, 'POST', data);
    },

    // ATAJO GENÉRICO GET: Necesario para el flujo adaptativo de consultas dinámicas (como Notificaciones)
    get(endpoint) {
        return this.request(endpoint, 'GET');
    },

    // 1. CONTROL DE ACCESOS (Autenticación)
    login(username, password) {
        return this.request('/api/auth/login', 'POST', { 
            username: username, 
            passwordHash: password // Cambiar el nombre de la propiedad para acoplarse al DTO de Spring
        });
    },

    // 2. CATÁLOGO DE ESPACIOS (Público)
    getSpaces() {
        return this.request('/api/spaces');
    },

    // 3. MÓDULO DE RESERVAS Y ALQUILERES (Rutas Reales Protegidas)
    createReservation(dto) {
        return this.request('/api/reservations', 'POST', dto); 
    },

    getReservations() {
        // Retornamos al endpoint real controlado por tu ReservationController
        return this.request('/api/reservations');
    },

    cancelReservation(id) {
        // Si tu controlador usa PUT para cancelar (como estaba originalmente en tu api.js)
        return this.request(`/api/reservations/cancel/${id}`, 'PUT');
    },

    triggerCheckout(id) {
        // Inicializa o simula la preferencia del pasaje transaccional
        return this.request(`/api/reservations/${id}/checkout`, 'POST');
    },

    // 4. MÓDULO DE OFERENTES / PROPIETARIOS
    createSpace(dto) {
        return this.request('/api/spaces/ownedspace', 'POST', dto);
    },

    getOwnedSpaces() {
        return this.request('/api/spaces/ownedspaces');
    },

    // 5. MÓDULO ADMINISTRADOR (ROLE_ADMIN)
    adminListUsers() {
        return this.request('/api/usuarios');
    },

    // 6. SIMULADOR DE EVENTOS ASÍNCRONOS (Webhook Mercado Pago)
    simulateWebhook(payload) {
        // Retornamos al endpoint de pagos original de tus controladores
        return this.request('/api/v1/payments/webhook', 'POST', payload);
    }
};