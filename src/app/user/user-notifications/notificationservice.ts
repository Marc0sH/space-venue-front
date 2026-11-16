import { effect, inject, Service, signal, untracked } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { Session } from '../../auth/session/session';
import { Notificacion, NotificacionCount } from '../../models/notification.model';
import { tap } from 'rxjs';

@Service()
export class Notificationservice {
    private baseUrl = environment.apiUrl + "/notifications";
    private http = inject(HttpClient);
    private sessionService = inject(Session);

    // Cada incremento dispara un reload() de getUnseen() en el header:
    // lo incrementan el polling y markAsSeen/markAllAsSeen.
    private refreshTick = signal(0);
    private static readonly POLL_INTERVAL_MS = 10_000;

    constructor() {
        // Mientras haya sesión, refresca las notificaciones no vistas cada POLL_INTERVAL_MS,
        // para que el contador del header llegue en tiempo real sin recargar la página.
        // onCleanup detiene el timer al cambiar de sesión (login/logout) o al destruir el servicio,
        // así nunca queda un intervalo colgado.
        effect((onCleanup) => {
            if (!this.sessionService.session()) return;
            const id = setInterval(
                () => {
                    // Con la pestaña oculta no se consulta; al volver se refresca enseguida.
                    if (document.visibilityState === 'visible') this.bumpRefresh();
                },
                Notificationservice.POLL_INTERVAL_MS
            );
            const onVisible = () => {
                if (document.visibilityState === 'visible') this.bumpRefresh();
            };
            document.addEventListener('visibilitychange', onVisible);
            onCleanup(() => {
                clearInterval(id);
                document.removeEventListener('visibilitychange', onVisible);
            });
        });
    }

    private bumpRefresh(){
        this.refreshTick.update(version => version + 1);
    }

    getNotification(){
        return httpResource<Notificacion[]>(() => `${this.baseUrl}/me`)
    }

    getUnseen(){
        // La request depende solo de la sesión. Si el tick se leyera acá, cada cambio sería
        // una request "nueva": el recurso pasa a 'loading' y value() vuelve a undefined, y el
        // badge del header parpadea a 0. Con reload() el estado es 'reloading' y conserva el valor.
        const resource = httpResource<Notificacion[]>(() =>
            this.sessionService.session()
                ? { url: `${this.baseUrl}/consumer/onlyunseen` }
                : undefined
        );

        effect(() => {
            if (this.refreshTick() === 0) return;
            untracked(() => resource.reload());
        });

        return resource;
    }

    markAsSeen(idNotification : number){
        return this.http.post(
            `${this.baseUrl}/${idNotification}`,
            null
        ).pipe(
            tap(() => this.bumpRefresh())
        );
    }

    //Marca como vistas todas las notificaciones del usuario logueado en una sola petición
    markAllAsSeen(){
        return this.http.patch<{ updatedCount: number }>(
            `${this.baseUrl}/me/read`,
            null
        ).pipe(
            tap(() => this.bumpRefresh())
        );
    }

    //El usuario logueado (cliente) pide ser oferente. El back arma el mensaje con sus datos
    //y se lo manda como notificación a todos los admins. Solo se permite una vez cada 24 hs
    requestOffererRole(){
        return this.http.post<{ notifiedAdmins: number }>(
            `${this.baseUrl}/offerer-request`,
            null
        );
    }
}
