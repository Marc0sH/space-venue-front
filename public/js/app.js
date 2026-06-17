/**
 * Punto de entrada y orquestador de la aplicación.
 */
const App = {
    init() {
        UI.initDebugPanel();

        AuthModule.init();
        CatalogModule.init();
        OwnerModule.init();
        ReservationsModule.init();
        CommentsModule.init();
        NotificationsModule.init();
        AdminModule.init();
        Navigation.init();

        this.restoreSession();
    },

    restoreSession() {
        if (Auth.isAuthenticated()) {
            UI.updateNavbar();
            Navigation.applyRoleRestrictions();
            UI.logConsole('Sesión restaurada desde almacenamiento local');

            this.navigateTo('view-spaces');
            NotificationsModule.refreshAll();
        } else {
            Auth.clearSession();
            UI.updateNavbar();
            Navigation.applyRoleRestrictions();
            this.navigateTo('view-auth');
        }
    },

    navigateTo(viewId) {
        UI.switchView(viewId);
        Navigation.onViewChange(viewId);
    },
};

document.addEventListener('DOMContentLoaded', () => App.init());
