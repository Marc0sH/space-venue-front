import { effect, inject, Service, signal, untracked } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { Session } from '../../auth/session/session';
import { Notificacion } from '../../models/notification.model';
import { tap } from 'rxjs';

@Service()
export class Notificationservice {
    private baseUrl = environment.apiUrl + "/notifications";
    private http = inject(HttpClient);
    private sessionService = inject(Session);

    private refreshTick = signal(0);
    private static readonly RECONNECT_DELAY_MS = 3_000;

    constructor() {
        effect((onCleanup) => {
            const session = this.sessionService.session();
            if (!session) return;

            // EventSource no permite configurar Authorization. fetch permite enviar el bearer
            // token que exige el backend y leer su respuesta como un stream SSE.
            const controller = new AbortController();
            void this.connectToNotificationStream(session.tipo, session.token, controller.signal);
            // El stream solo debe vivir mientras esta sesión siga activa; al cerrar o cambiar
            // la sesión se aborta la conexión para no conservar una suscripción con otro token.
            onCleanup(() => controller.abort());
        });
    }

    private bumpRefresh(){
        this.refreshTick.update(version => version + 1);
    }

    private async connectToNotificationStream(tipo: string, token: string, signal: AbortSignal): Promise<void> {
        while (!signal.aborted) {
            try {
                const response = await fetch(`${this.baseUrl}/stream`, {
                    headers: {
                        Accept: 'text/event-stream',
                        Authorization: `${tipo} ${token}`,
                    },
                    signal,
                });

                if (response.status === 401) {
                    this.sessionService.clearSession();
                    return;
                }
                if (!response.ok) {
                    throw new Error(`SSE request failed with status ${response.status}`);
                }
                if (!response.body) {
                    throw new Error('SSE response has no readable body');
                }

                await this.readNotificationEvents(response.body, signal);
                if (!signal.aborted) {
                    // Si el servidor cierra el stream, se considera una desconexión y se reintenta.
                    throw new Error('SSE connection closed unexpectedly');
                }
            } catch (error) {
                if (signal.aborted) return;
                console.error('Error en el flujo SSE de notificaciones', error);
                // Evita reintentos continuos cuando hay un fallo temporal de red o del servidor.
                await this.waitBeforeReconnect(signal);
            }
        }
    }

    private async readNotificationEvents(body: ReadableStream<Uint8Array>, signal: AbortSignal): Promise<void> {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (!signal.aborted) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split(/\r\n\r\n|\n\n|\r\r/);
                buffer = events.pop() ?? '';
                events.forEach(event => this.handleNotificationEvent(event));
            }

            buffer += decoder.decode();
            if (buffer) this.handleNotificationEvent(buffer);
        } finally {
            reader.releaseLock();
        }
    }

    private handleNotificationEvent(eventData: string): void {
        const eventType = eventData
            .split(/\r\n|\n|\r/)
            .find(line => line.startsWith('event:'))
            ?.slice('event:'.length)
            .trim();

        if (eventType === 'notification' || eventType === 'unread-count') {
            // Una notificación nueva o marcarla como vista cambia el total no leído;
            // bumpRefresh hace que getUnseen recargue la lista usada por el badge del header.
            this.bumpRefresh();
        }
    }

    private waitBeforeReconnect(signal: AbortSignal): Promise<void> {
        if (signal.aborted) return Promise.resolve();
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                signal.removeEventListener('abort', onAbort);
                resolve();
            }, Notificationservice.RECONNECT_DELAY_MS);
            const onAbort = () => {
                clearTimeout(timeout);
                resolve();
            };
            signal.addEventListener('abort', onAbort, { once: true });
        });
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
