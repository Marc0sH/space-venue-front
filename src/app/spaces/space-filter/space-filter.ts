import { Component, output, signal } from '@angular/core';
import { obtenerUbicacionActual } from '../../common/geolocation';
import { Coordenadas, FiltroCercania } from '../../models/location.model';

@Component({
  imports: [],
  selector: 'app-space-filter',
  styleUrl: './space-filter.css',
  templateUrl: './space-filter.html',
})
export class SpaceFilter {
  ordenSeleccionado = signal<string>('Sin ordenar');
  ordenSalida =  output<string>();

  // Filtro por cercanía: null mientras no se usa la ubicación del usuario
  readonly radios = [1, 2, 5, 10, 25, 50];
  radioKm = signal(5);
  ubicacion = signal<Coordenadas | null>(null);
  buscando = signal(false);
  errorUbicacion = signal('');
  cercaniaSalida = output<FiltroCercania | null>();

  seleccionarOrden(event: Event) {
    const orden = (event.target as HTMLSelectElement).value;
    this.ordenSeleccionado.set(orden);
    this.ordenSalida.emit(orden);
  }

  buscarCerca() {
    this.buscando.set(true);
    this.errorUbicacion.set('');

    return obtenerUbicacionActual()
      .then(ubicacion => {
        this.ubicacion.set(ubicacion);
        this.emitirCercania();
      })
      .catch((e: Error) => this.errorUbicacion.set(e.message))
      .finally(() => this.buscando.set(false));
  }

  seleccionarRadio(event: Event) {
    this.radioKm.set(Number((event.target as HTMLSelectElement).value));
    // Si ya se está filtrando, se vuelve a buscar con el radio nuevo
    if (this.ubicacion()) this.emitirCercania();
  }

  quitarCercania() {
    this.ubicacion.set(null);
    this.errorUbicacion.set('');
    this.cercaniaSalida.emit(null);
  }

  private emitirCercania() {
    const ubicacion = this.ubicacion();
    if (ubicacion) this.cercaniaSalida.emit({ ...ubicacion, radioKm: this.radioKm() });
  }
}
