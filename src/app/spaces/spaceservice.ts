import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal, signal } from '@angular/core';
import { environment } from '../../environments/enviroment';
import { NewSpace, Space } from '../models/space.model';

@Service()
export class Spaceservice {
    protected readonly http = inject(HttpClient)
    private readonly _spaces = signal<Space[]>([] as Space[]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    private loaded = false;
    readonly spaces = this._spaces.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    load(force = false) {
      if (this._loading() || (this.loaded && !force)) return;

      this._loading.set(true);
      this._error.set(null);

      this.http.get<Space[]>(`${environment.apiUrl}/spaces`).subscribe({
        next: data => {
          this._spaces.set(data);
          this.loaded = true;
          this._loading.set(false);
        },
        error: () => {
          this._error.set('No se pudieron cargar los espacios');
          this._loading.set(false);
        },
      });
    }

    getById(id: Signal<string>) {
     return httpResource<Space>(() => `${environment.apiUrl}/spaces/${id()}`);
    }

    createSpace(space : NewSpace){
      return this.http.post<Space>(`${environment.apiUrl}/spaces/ownedspace`, space)
    }
}
