import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { Session } from '../../auth/session/session';
import { Notificacion, NotificacionCount } from '../../models/notification.model';

@Service()
export class Notificationservice {
    private baseUrl = environment.apiUrl + "/notifications";
    private http = inject(HttpClient);
    private sessionService = inject(Session);

    getNotification(){
        return httpResource<Notificacion[]>(() => `${this.baseUrl}/me`)
    }
    getUnseen(){
        return httpResource<NotificacionCount>(() => `${this.baseUrl}/consumer/onlyunseen`)
    }
}