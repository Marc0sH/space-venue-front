import { Component, computed, inject, signal } from '@angular/core';
import { Spaceservice } from '../spaceservice';
import { Spacescard } from '../spacescard/spacescard';
import { SpaceFilter } from '../space-filter/space-filter';
import { NearbyFilter } from '../../models/location.model';

@Component({
  imports: [Spacescard, SpaceFilter],
  selector: 'app-spaceslist',
  styleUrl: './spaceslist.css',
  templateUrl: './spaceslist.html',
})
export class Spaceslist {
  private readonly spaceService = inject(Spaceservice)
  readonly cercania = signal<NearbyFilter | null>(null);
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

  cambiarCercania(cercania: NearbyFilter | null) {
    this.cercania.set(cercania)
  }
}
