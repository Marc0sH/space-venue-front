import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal, signal } from '@angular/core';
import { environment } from '../../environments/enviroment';
import { NewSpace, Space } from '../models/space.model';

@Service()
export class Spaceservice {
    protected readonly http = inject(HttpClient)

    //Filtrado de espacios (permite reutilización)
    spaceListFiltration(spaces : Space[], order : string){
      let lista = [...spaces];
      if (order === 'Precio') {
        lista.sort((a, b) => a.basePrice - b.basePrice);
      } else if (order === 'Nombre') {
        lista.sort((a, b) => a.nameSpace.localeCompare(b.nameSpace));
      }

      return lista;
    }

    // Llamadas HTTP
    getSpaces() {
      return httpResource<Space[]>(() => `${environment.apiUrl}/spaces`);
    }

    getById(id: Signal<string>) {
     return httpResource<Space>(() => `${environment.apiUrl}/spaces/${id()}`);
    }

    createSpace(space : NewSpace){
      return this.http.post<Space>(`${environment.apiUrl}/spaces/ownedspace`, space)
    }

    getSpacesByOwnerLogged() {
      return this.http.get<Space[]>(`${environment.apiUrl}/spaces/ownedspaces`);
    }
}
