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
    private static readonly POLL_INTERVAL_MS = 15_000;

    constructor() {
        // Mientras haya sesión, refresca las notificaciones sin leer cada POLL_INTERVAL_MS,
        // para que el contador del header se actualice sin recargar la página.
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
}