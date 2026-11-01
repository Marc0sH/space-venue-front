import { Component, computed, output, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-space-filter',
  styleUrl: './space-filter.css',
  templateUrl: './space-filter.html',
})
export class SpaceFilter {
  ordenSeleccionado = signal<string>('Sin ordenar');
  ordenSalida =  output<string>();

  seleccionarOrden(event: Event) {
    const orden = (event.target as HTMLSelectElement).value;
    this.ordenSeleccionado.set(orden);
    this.ordenSalida.emit(orden);
  }
}
