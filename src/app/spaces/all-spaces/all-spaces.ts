import { Component, computed, inject, signal } from '@angular/core';
import { Spaceservice } from '../spaceservice';
import { Spacescard } from '../spacescard/spacescard';
import { SpaceFilter } from '../space-filter/space-filter';
import { SpaceSearch } from '../../models/space.model';
import { NearbyFilter } from '../../models/location.model';

//Lista completa de espacios activos, con filtros de orden, cercanía, nombre, precio y calificación
@Component({
  imports: [Spacescard, SpaceFilter],
  selector: 'app-all-spaces',
  styleUrl: './all-spaces.css',
  templateUrl: './all-spaces.html',
})
export class AllSpaces {
  private readonly spaceService = inject(Spaceservice)
  readonly cercania = signal<NearbyFilter | null>(null);
  private readonly spacesResource = this.spaceService.getSpaces(this.cercania);

  readonly spaces = computed(() => this.spacesResource.value() ?? []);

  readonly orden = signal('Sin ordenar');
  readonly busqueda = signal<SpaceSearch>({ nombre: '', precioMin: null, precioMax: null, calificacionMin: null });
  readonly spacesOrdenados = computed(() =>
    this.spaceService.spaceListFiltration(
      this.spaceService.spaceListSearch(this.spaces(), this.busqueda()),
      this.orden(),
    ),
  );
  //true si hay espacios pero la búsqueda los descarta a todos
  readonly sinResultadosBusqueda = computed(() => this.spaces().length > 0 && this.spacesOrdenados().length === 0);

  readonly loading = this.spacesResource.isLoading;
  readonly error = computed(() =>
    this.spacesResource.error()
      ? 'No se pudieron cargar los espacios'
      : null,
  );

  cambiarOrden(orden: string) {
    this.orden.set(orden)
  }

  cambiarBusqueda(busqueda: SpaceSearch) {
    this.busqueda.set(busqueda)
  }

  cambiarCercania(cercania: NearbyFilter | null) {
    this.cercania.set(cercania)
  }
}
