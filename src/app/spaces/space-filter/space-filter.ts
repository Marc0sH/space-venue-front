import { Component, input, output, signal } from '@angular/core';
import { Coordinates, NearbyFilter } from '../../models/location.model';
import { LocationPicker } from '../../common/location-picker/location-picker';
import { SpaceSearch } from '../../models/space.model';

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

  // Filtro por nombre y precio. Solo se muestra si el padre lo pide
  conBusqueda = input(false);
  nombre = signal('');
  precioMin = signal<number | null>(null);
  precioMax = signal<number | null>(null);
  // Calificación promedio mínima: los espacios van de 0 a 5
  readonly calificaciones = [1, 2, 3, 4, 5];
  calificacionMin = signal<number | null>(null);
  busquedaSalida = output<SpaceSearch>();

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

  cambiarNombre(event: Event) {
    this.nombre.set((event.target as HTMLInputElement).value);
    this.emitirBusqueda();
  }

  cambiarPrecioMin(event: Event) {
    this.precioMin.set(this.leerPrecio(event));
    this.emitirBusqueda();
  }

  cambiarPrecioMax(event: Event) {
    this.precioMax.set(this.leerPrecio(event));
    this.emitirBusqueda();
  }

  seleccionarCalificacion(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.calificacionMin.set(valor === '' ? null : Number(valor));
    this.emitirBusqueda();
  }

  limpiarBusqueda() {
    this.nombre.set('');
    this.precioMin.set(null);
    this.precioMax.set(null);
    this.calificacionMin.set(null);
    this.emitirBusqueda();
  }

  hayBusqueda() {
    return this.nombre().trim() !== '' || this.precioMin() !== null || this.precioMax() !== null
      || this.calificacionMin() !== null;
  }

  private leerPrecio(event: Event): number | null {
    const valor = (event.target as HTMLInputElement).value;
    if (valor === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : null;
  }

  private emitirBusqueda() {
    this.busquedaSalida.emit({
      nombre: this.nombre(),
      precioMin: this.precioMin(),
      precioMax: this.precioMax(),
      calificacionMin: this.calificacionMin(),
    });
  }

  private emitirCercania() {
    const ubicacion = this.ubicacion();
    if (ubicacion) this.cercaniaSalida.emit({ ...ubicacion, radiusKm: this.radioKm() });
  }
}
