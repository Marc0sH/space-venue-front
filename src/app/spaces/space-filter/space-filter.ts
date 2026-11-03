import { Component, output, signal } from '@angular/core';
import { Coordinates, NearbyFilter } from '../../models/location.model';
import { geolocalizacionDisponible, obtenerUbicacionActual } from '../../common/geolocation';

@Component({
  imports: [],
  selector: 'app-space-filter',
  styleUrl: './space-filter.css',
  templateUrl: './space-filter.html',
})
export class SpaceFilter {
  ordenSeleccionado = signal<string>('Sin ordenar');
  ordenSalida =  output<string>();

  // Filtro por cercanía: se toma la ubicación del usuario y se buscan los espacios dentro del radio elegido
  readonly radios = [1, 5, 10, 25, 50];
  readonly geolocalizacionDisponible = geolocalizacionDisponible();
  radioKm = signal(5);
  ubicacion = signal<Coordinates | null>(null);
  buscandoUbicacion = signal(false);
  errorUbicacion = signal('');
  cercaniaSalida = output<NearbyFilter | null>();

  seleccionarOrden(event: Event) {
    const orden = (event.target as HTMLSelectElement).value;
    this.ordenSeleccionado.set(orden);
    this.ordenSalida.emit(orden);
  }

  seleccionarRadio(event: Event) {
    this.radioKm.set(Number((event.target as HTMLSelectElement).value));
    this.emitirCercania();
  }

  buscarCercanos() {
    this.errorUbicacion.set('');
    this.buscandoUbicacion.set(true);
    obtenerUbicacionActual(
      ubicacion => {
        this.buscandoUbicacion.set(false);
        this.ubicacion.set(ubicacion);
        this.emitirCercania();
      },
      (mensaje: string) => {
        this.buscandoUbicacion.set(false);
        this.errorUbicacion.set(mensaje);
      }
    );
  }

  quitarCercania() {
    this.ubicacion.set(null);
    this.cercaniaSalida.emit(null);
  }

  private emitirCercania() {
    const ubicacion = this.ubicacion();
    if (ubicacion) this.cercaniaSalida.emit({ ...ubicacion, radiusKm: this.radioKm() });
  }
}
