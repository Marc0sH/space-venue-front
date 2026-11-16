import { effect, inject, Service, signal } from '@angular/core';
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

    private unseenVersion = signal(0);
    // Tick del polling: cada incremento dispara un refetch de getUnseen() en el header
    private pollVersion = signal(0);
    private static readonly POLL_INTERVAL_MS = 10_000;

    constructor() {
        // Mientras haya sesión, refresca las notificaciones no vistas cada POLL_INTERVAL_MS,
        // para que el contador del header llegue en tiempo real sin recargar la página.
        // onCleanup detiene el timer al cambiar de sesión (login/logout) o al destruir el servicio,
        // así nunca queda un intervalo colgado.
        effect((onCleanup) => {
            if (!this.sessionService.session()) return;
            const id = setInterval(
                () => this.pollVersion.update(version => version + 1),
                Notificationservice.POLL_INTERVAL_MS
            );
            onCleanup(() => clearInterval(id));
        });
    }

    getNotification(){
        return httpResource<Notificacion[]>(() => `${this.baseUrl}/me`)
    }

    getUnseen(){
        return httpResource<Notificacion[]>(() => {
            const session = this.sessionService.session();
            this.unseenVersion();
            this.pollVersion();

            return session
            ? { url: `${this.baseUrl}/consumer/onlyunseen` }
            : undefined;
        });    
    }

    markAsSeen(idNotification : number){
        return this.http.post(
            `${this.baseUrl}/${idNotification}`,
            null
        ).pipe(
            tap(() => this.unseenVersion.update(version => version + 1))
        );
    }

    //Marca como vistas todas las notificaciones del usuario logueado en una sola petición
    markAllAsSeen(){
        return this.http.patch<{ updatedCount: number }>(
            `${this.baseUrl}/me/read`,
            null
        ).pipe(
            tap(() => this.unseenVersion.update(version => version + 1))
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
