import { Component, computed, effect, inject, signal } from '@angular/core';
import { Spacescard } from '../spacescard/spacescard';
import { Spaceservice } from '../spaceservice';
import { Space } from '../../models/space.model';
import { SpaceFilter } from '../space-filter/space-filter';

@Component({
  imports: [Spacescard, SpaceFilter],
  selector: 'app-list-my-spaces',
  styleUrl: './list-my-spaces.css',
  templateUrl: './list-my-spaces.html',
})
export class ListMySpaces {
  private readonly spaceService = inject(Spaceservice)
  lista = signal<Space[]>([] as Space[]);
  error = signal<string | null>(null);
  cargando = signal<boolean>(true);

  readonly orden = signal('Sin ordenar');
  readonly spacesOrdenados = computed(() =>
    this.spaceService.spaceListFiltration(this.lista(), this.orden()),
  );

  constructor() {
    effect(() => {
      this.spaceService.getSpacesByOwnerLogged().subscribe({
        next: data => {
          this.cargando.set(false);
          this.lista.set(data);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudieron cargar los espacios');
        },
      });
    })
  }

  //Id del espacio que espera confirmación de baja y del que se está dando de baja
  readonly confirmando = signal<number | null>(null);
  readonly eliminando = signal<number | null>(null);
  readonly errorBaja = signal<string | null>(null);

  cambiarOrden(orden : string){
    this.orden.set(orden)
  }

  pedirConfirmacion(id: number) {
    this.errorBaja.set(null);
    this.confirmando.set(id);
  }

  darDeBaja(id: number) {
    this.eliminando.set(id);
    this.errorBaja.set(null);
    this.spaceService.deleteOwnedSpace(id).subscribe({
      next: () => {
        //Es soft delete: el espacio sigue existiendo, solo queda inactivo
        this.lista.update(lista => lista.map(s => s.idSpace === id ? { ...s, isActive: false } : s));
        this.confirmando.set(null);
        this.eliminando.set(null);
      },
      error: () => {
        this.errorBaja.set('No se pudo dar de baja el espacio');
        this.eliminando.set(null);
      },
    });
  }
}
