import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { environment } from '../../environments/enviroment';
import { NewSpace, Space } from '../models/space.model';
import { ImageUploadUrl, SpaceImage } from '../models/space-image.model';

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

    //Arma la URL pública de una imagen a partir de la key guardada en el back
    imageUrl(key: string) {
      return key.startsWith('http') ? key : `${environment.mediaUrl}/${key}`;
    }

    // Llamadas HTTP
    getSpaces() {
      return httpResource<Space[]>(() => `${environment.apiUrl}/spaces`);
    }

    getById(id: Signal<string>) {
     return httpResource<Space>(() => `${environment.apiUrl}/spaces/${id()}`);
    }

    createSpace(space : NewSpace){
      return this.http.post<{ idSpace: number }>(`${environment.apiUrl}/spaces/ownedspace`, space)
    }

    getSpacesByOwnerLogged() {
      return this.http.get<Space[]>(`${environment.apiUrl}/spaces/ownedspaces`);
    }

    getImagesBySpaceId(id: Signal<string>) {
      return httpResource<SpaceImage[]>(() => `${environment.apiUrl}/spaceimages/byspaceid/${id()}`);
    }

    //1. El back firma una URL de subida  2. El archivo va directo a S3  3. Se registra la imagen en el espacio
    //El PUT a S3 no lleva el token porque no empieza con apiUrl (ver auth-interceptor)
    uploadImage(idSpace: number, file: File) {
      return this.http.post<ImageUploadUrl>(`${environment.apiUrl}/spaceimages/upload-url`, {
        idSpace, contentType: file.type, size: file.size
      }).pipe(
        switchMap(({ uploadUrl, key }) =>
          this.http.put(uploadUrl, file, { headers: { 'Content-Type': file.type }, responseType: 'text' }).pipe(
            switchMap(() => this.http.post<void>(`${environment.apiUrl}/spaceimages`, {
              idSpace,
              fileName: file.name,
              urlImage: key,
              // Fecha local sin zona horaria, que es lo que espera el LocalDateTime del back
              dateSend: new Date().toLocaleString('sv-SE').replace(' ', 'T')
            }))
          )
        )
      );
    }
}
