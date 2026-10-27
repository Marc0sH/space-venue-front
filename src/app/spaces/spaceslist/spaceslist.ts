import { Component, computed, inject, signal } from '@angular/core';
import { Spaceservice } from '../spaceservice';
import { Spacescard } from '../spacescard/spacescard';

@Component({
  imports: [Spacescard],
  selector: 'app-spaceslist',
  styleUrl: './spaceslist.css',
  templateUrl: './spaceslist.html',
})
export class Spaceslist {
  protected readonly spaceService = inject(Spaceservice)
  lista = this.spaceService.spaces;
  loading = this.spaceService.loading;

  ngOnInit() {
    this.spaceService.load(); // 
  }
  ordenSeleccionado = signal<string>('Sin ordenar');

  productosFiltrados = computed(() => {
    let lista = [...this.lista()];
     if (this.ordenSeleccionado() === 'Precio') {
      lista.sort((a, b) => a.basePrice - b.basePrice);
    } else if (this.ordenSeleccionado() === 'Nombre') {
      lista.sort((a, b) => a.nameSpace.localeCompare(b.nameSpace));
    }
    return lista;
    }); 


}
