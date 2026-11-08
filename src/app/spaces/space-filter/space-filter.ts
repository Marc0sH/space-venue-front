import { Component, input, output, signal } from '@angular/core';
import { Coordinates, NearbyFilter } from '../../models/location.model';
import { LocationPicker } from '../../common/location-picker/location-picker';

@Component({
  imports: [LocationPicker],
  selector: 'app-space-filter',
  styleUrl: './space-filter.css',
  templateUrl: './space-filter.html',
})
export class SpaceFilter {
  ordenSeleccionado = signal<string>('Sin ordenar');
  ordenSalida =  output<string>();

  // Filtro por cercanía: el usuario elige una ubicación de referencia (buscador, mapa o su ubicación actual)
  // y se buscan los espacios dentro del radio elegido. Solo se muestra si el padre lo pide
  conCercania = input(false);
  readonly radios = [1, 5, 10, 25, 50];
  radioKm = signal(5);
  ubicacion = signal<Coordinates | null>(null);
  mostrarMapa = signal(false);
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

  alternarMapa() {
    this.mostrarMapa.update(v => !v);
  }

  elegirUbicacion(ubicacion: Coordinates | null) {
    this.ubicacion.set(ubicacion);
    this.emitirCercania();
  }

  quitarCercania() {
    this.ubicacion.set(null);
    this.mostrarMapa.set(false);
    this.cercaniaSalida.emit(null);
  }

  private emitirCercania() {
    const ubicacion = this.ubicacion();
    if (ubicacion) this.cercaniaSalida.emit({ ...ubicacion, radiusKm: this.radioKm() });
  }
}
