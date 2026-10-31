import { inject, Service, signal } from '@angular/core';
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

    getNotification(){
        return httpResource<Notificacion[]>(() => `${this.baseUrl}/me`)
    }

    getUnseen(){
        return httpResource<Notificacion[]>(() => {
            const session = this.sessionService.session();
            this.unseenVersion();

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