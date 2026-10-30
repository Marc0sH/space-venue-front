import { inject, Service, Signal } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { HttpClient, httpResource } from '@angular/common/http';
import { ServiceSpace, ServiceSpaceItemDTO, ServiceSpaceUpdateDTO } from '../../models/service.model';

@Service()
export class ServiceServicios {
    private url = `${environment.apiUrl}/services`
    private http = inject(HttpClient)

    getServicio(idSpace: string){
        return httpResource<ServiceSpace[]>(() => `${this.url}/space/${idSpace}`)
    }

    postServicio(newSer: ServiceSpaceItemDTO){
        return this.http.post<ServiceSpace>(`${this.url}/insert`, newSer)
    }

    updateServicio(ser: ServiceSpaceUpdateDTO){
        return this.http.put<ServiceSpace>(`${this.url}/update/${ser.id}`, ser)
    }

    deleteServicio(idSpace:string,idSer: string){
        return this.http.delete(`${this.url}/space/${idSpace}/delete/${idSer}`)
    }

}
