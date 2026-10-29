import { inject, Service, Signal } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { ServiceSpace, ServiceReg } from '../../models/service.model';

@Service()
export class ServiceServicios {
    private url = `${environment.apiUrl}/service`
    private http = inject(HttpClient)

    getServicio(idSpace: string){
        return httpResource<ServiceSpace[]>(() => ({
            url: this.url,
            params: {id: idSpace}
        }))
    }/// no lo uso por ahora

    postServicio(newSer: ServiceReg){
        return this.http.post<ServiceSpace>(`${this.url}/insert`, newSer)
    }

    updateServicio(ser: Service){
        return this.http.put<ServiceSpace>(`${this.url}/update`, ser)
    }

    deleteServicio(idSpace:string,idSer: string){
        return this.http.delete(`${this.url}/space/${idSpace}/delete/${idSer}`)
    }

}
