/**
 * Utilidades de autenticación y manejo de JWT.
 */
const Auth = {
    TOKEN_KEY: 'jwt_token',
    CONSUMER_ID_KEY: 'consumer_id',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.CONSUMER_ID_KEY);
    },

    parsePayload(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch {
            return null;
        }
    },

    getUsername() {
        const token = this.getToken();
        if (!token) return null;
        return this.parsePayload(token)?.sub ?? null;
    },

    getRole() {
        const token = this.getToken();
        if (!token) return null;
        const payload = this.parsePayload(token);
        return payload?.rol || payload?.role || '';
    },

    isAdmin() {
        return this.getRole().includes('ADMIN');
    },

    isAuthenticated() {
        return Boolean(this.getToken());
    },

    /**
     * Extrae el token limpio de una respuesta "Bearer <token>".
     */
    extractBearerToken(responseText) {
        if (!responseText?.includes('Bearer')) return null;
        return responseText.replace('Bearer', '').trim();
    },

    setConsumerId(id) {
        if (id != null) {
            localStorage.setItem(this.CONSUMER_ID_KEY, String(id));
        }
    },

    getConsumerId() {
        const stored = localStorage.getItem(this.CONSUMER_ID_KEY);
        if (stored) return parseInt(stored, 10);

        const token = this.getToken();
        if (!token) return null;

        const payload = this.parsePayload(token);
        return payload?.idConsumer ?? payload?.id ?? null;
    },

    /**
     * Intenta resolver el ID del consumidor desde datos de la API.
     */
    resolveConsumerIdFromEntity(entity) {
        const id =
            entity?.idConsumer ??
            entity?.consumer?.idConsumer ??
            entity?.consumerOwner?.idConsumer ??
            null;

        if (id != null) {
            this.setConsumerId(id);
        }
        return id;
    },
};
