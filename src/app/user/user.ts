import { inject, Service } from '@angular/core';
import { environment } from '../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { UserProfileData, UserUpdate } from '../models/user.model';
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
        return httpResource<UserProfileData>(() => `${this.baseUrl}/${this.sessionService.session()?.consumerId}`)
    }

    deleteLoggedUser() {
        return this.http.delete<{ message: string }>(`${this.baseUrlSingular}`);
    }

    updateLoggedUser(data: UserUpdate){
        return this.http.put<{ message: string }>(`${environment.apiUrl}/usuario`, data);
    }


}
