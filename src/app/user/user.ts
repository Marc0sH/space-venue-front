import { inject, Service } from '@angular/core';
import { environment } from '../../environments/enviroment';
import { HttpClient } from '@angular/common/http';

@Service()
export class User {
    private baseUrl = environment.apiUrl + "/usuarios";
    private http = inject(HttpClient);

    getUserById(id: number){
        return this.http.get(`${this.baseUrl}/${id}`);
    }
}
