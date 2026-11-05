import { inject, Service } from '@angular/core';
import { environment } from '../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { ConsumerFilter, UserProfileData, UserUpdate } from '../models/user.model';
import { Session } from '../auth/session/session';

@Service()
export class User {
    private baseUrl = environment.apiUrl + "/usuarios";
    private baseUrlSingular = environment.apiUrl + "/usuario"

    private http = inject(HttpClient);
    private sessionService = inject(Session);

    getUserById(id: number){
        return this.http.get(`${this.baseUrl}/${id}`);
    }

    getLoggedProfile(){
        return this.getProfile(() => this.sessionService.session()?.consumerId);
    }

    //Perfil de cualquier usuario. El back solo lo permite si es el propio o si el que pide es ADMIN
    getProfile(id: () => number | undefined){
        return httpResource<UserProfileData>(() => id() != null ? `${this.baseUrl}/${id()}` : undefined);
    }

    //Solo ADMIN: busca cuentas (activas e inactivas) filtrando en el back. Se vuelve a pedir cada vez que cambia el filtro
    searchUsers(filtro: () => ConsumerFilter){
        return httpResource<UserProfileData[]>(() => ({
            url: `${this.baseUrl}/byfields`,
            method: 'POST',
            body: filtro()
        }));
    }

    setUserStatus(id: number, active: boolean) {
        return this.http.put<{ message: string }>(`${this.baseUrl}/${id}/status`, null, { params: { active } });
    }

    deleteLoggedUser() {
        return this.http.delete<{ message: string }>(`${this.baseUrlSingular}`);
    }

    updateLoggedUser(data: UserUpdate){
        return this.http.put<{ message: string }>(`${environment.apiUrl}/usuario`, data);
    }


}
