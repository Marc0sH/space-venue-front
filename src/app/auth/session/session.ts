import { computed, inject, Service, signal } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { CredentialRegister, LoginRequest, LoginResponse } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Notificationservice } from '../../user/user-notifications/notificationservice';

@Service()
export class Session {
    private baseUrl = environment.apiUrl + "/auth";
    private http = inject(HttpClient);
    private router = inject(Router);

    private _session = signal<LoginResponse | null>(this.loadFromStorage());
    session = this._session.asReadonly();
    isLoggedIn = computed(() => this._session() != null);
    isAdmin = computed(() => this._session()?.rol === 'ROLE_ADMIN');

    registerUser(user: CredentialRegister) {
        return this.http.post(`${this.baseUrl}/register`, user);
    }


    //Esto devuelve el login: return ResponseEntity.ok(new LoginResponseDTO(token, "Bearer", rol, consumerId));
    //LoginResponseDTO es: public record LoginResponseDTO(String token, String tipo, String rol, Integer consumerId) {}
    //Guarda en local sotrage la sesion para que no se pierda al recargar
    loginUser(loginRequest: LoginRequest){
        return this.http.post<LoginResponse>(`${this.baseUrl}/login`, loginRequest).pipe(
            tap(res =>{
                localStorage.setItem('session', JSON.stringify(res));
                this._session.set(res);
            })
        );
    }

    //Avisa al backend para que invalide el token (blacklist) y despues limpia la sesion local.
    //La sesion local se limpia siempre, aunque el request falle (sin red, token ya vencido, etc.)
    logoutUser(){
        if (!this._session()) {
            this.clearSession();
            return;
        }
        this.http.post(`${this.baseUrl}/logout`, {}).pipe(
            finalize(() => this.clearSession())
        ).subscribe({ error: () => {} });
    }

    //Solo limpia la sesion local, sin llamar al backend.
    //Se usa cuando el token ya no es valido (401) o ya fue invalidado por el backend (baja de cuenta),
    //para no entrar en un loop de 401 -> logout -> 401
    clearSession(){
        localStorage.removeItem('session');
        this._session.set(null);
        this.router.navigateByUrl('login');
    }


    private loadFromStorage(): LoginResponse | null{ 
        const raw = localStorage.getItem('session');
        return raw ? JSON.parse(raw) : null; 
    }

}
