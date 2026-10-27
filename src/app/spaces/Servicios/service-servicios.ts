import { inject, Service, Signal } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { service, ServiceReg } from '../../models/service.model';

@Service()
export class ServiceServicios {
    private url = `${environment.apiUrl}/service`
    private http = inject(HttpClient)

    getServicio(id: Signal<string>){
        return httpResource<service>(() => ({
            url: this.url,
            params: {id: id()}
        }))
    }/// no lo uso por ahora

    postServicio(newSer: ServiceReg){
        return this.http.post<service>(`${this.url}/insert`, newSer)
    }

    updateServicio(ser: service){
        return this.http.put<service>(`${this.url}/update`, ser)
    }

    deleteServicio(idSpace:string,idSer: string){
        return this.http.delete(`${this.url}/space/${idSpace}/delete/${idSer}`)
    }

}
