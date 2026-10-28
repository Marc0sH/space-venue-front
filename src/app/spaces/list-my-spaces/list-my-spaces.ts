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

  cambiarOrden(orden : string){
    this.orden.set(orden)
  }
}
