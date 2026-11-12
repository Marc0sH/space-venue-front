import { Component, computed, effect, inject, signal } from '@angular/core';
import { Spacescard } from '../spacescard/spacescard';
import { Spaceservice } from '../spaceservice';
import { Space } from '../../models/space.model';
import { SpaceFilter } from '../space-filter/space-filter';
import { mensajeDeError } from '../../common/http-error';

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
        error: (err) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(err, 'No se pudieron cargar los espacios'));
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
        //El back ya no devuelve los espacios eliminados por el dueño, así que lo sacamos de la lista
        this.lista.update(lista => lista.filter(s => s.idSpace !== id));
        this.confirmando.set(null);
        this.eliminando.set(null);
      },
      error: (err) => {
        this.errorBaja.set(mensajeDeError(err, 'No se pudo dar de baja el espacio'));
        this.eliminando.set(null);
      },
    });
  }
}
