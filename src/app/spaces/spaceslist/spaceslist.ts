import { Component, computed, inject, signal } from '@angular/core';
import { Spaceservice } from '../spaceservice';
import { Spacescard } from '../spacescard/spacescard';
import { SpaceFilter } from '../space-filter/space-filter';
import { FiltroCercania } from '../../models/location.model';

@Component({
  imports: [Spacescard, SpaceFilter],
  selector: 'app-spaceslist',
  styleUrl: './spaceslist.css',
  templateUrl: './spaceslist.html',
})
export class Spaceslist {
  private readonly spaceService = inject(Spaceservice)
  // Cambiar el filtro de cercanía vuelve a pedir los espacios al back
  readonly cercania = signal<FiltroCercania | null>(null);
  private readonly spacesResource = this.spaceService.getSpaces(this.cercania);

  readonly spaces = computed(() => this.spacesResource.value() ?? []);

  readonly orden = signal('Sin ordenar');
  readonly spacesOrdenados = computed(() =>
    this.spaceService.spaceListFiltration(this.spaces(), this.orden()),
  );

  readonly loading = this.spacesResource.isLoading;
  readonly error = computed(() =>
    this.spacesResource.error()
      ? 'No se pudieron cargar los espacios'
      : null,
  );

  cambiarOrden(orden: string) {
    this.orden.set(orden)
  }

  cambiarCercania(cercania: FiltroCercania | null) {
    this.cercania.set(cercania)
  }
}
