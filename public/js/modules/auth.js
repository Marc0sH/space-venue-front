/**
 * Módulo de autenticación: login y registro.
 */
const AuthModule = {
    init() {
        document.getElementById('form-login')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('form-register')?.addEventListener('submit', (e) => this.handleRegister(e));
    },

    async handleLogin(event) {
        event.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = event.target.querySelector('button[type="submit"]');

        UI.setLoading(submitBtn, true, 'Ingresando...');

        try {
            const token = await ApiService.login(username, password);
            Auth.setToken(token);
            UI.updateNavbar();
            Navigation.applyRoleRestrictions();

            await NotificationsModule.refreshAll();

            UI.showSuccess('Sesión iniciada correctamente.');
            UI.logConsole('Login exitoso', { username });
            App.navigateTo('view-spaces');
            CatalogModule.load();
        } catch (err) {
            UI.showError(err.message || 'No se pudo iniciar sesión.');
            UI.logConsole(`Error de login: ${err.message}`);
        } finally {
            UI.setLoading(submitBtn, false);
        }
    },

    async handleRegister(event) {
        event.preventDefault();

        const dto = {
            firstname: document.getElementById('reg-firstname').value.trim(),
            lastname: document.getElementById('reg-lastname').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            phone: document.getElementById('reg-phone').value.trim(),
            username: document.getElementById('reg-username').value.trim(),
            password: document.getElementById('reg-password').value,
        };

        const submitBtn = event.target.querySelector('button[type="submit"]');
        UI.setLoading(submitBtn, true, 'Registrando...');

        try {
            await ApiService.register(dto);
            UI.showSuccess('Cuenta creada. Ya podés iniciar sesión.');
            UI.logConsole('Registro exitoso', { username: dto.username });
            event.target.reset();
        } catch (err) {
            UI.showError(err.message || 'No se pudo completar el registro.');
        } finally {
            UI.setLoading(submitBtn, false);
        }
    },
};
