import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Spaceservice } from '../spaceservice';

@Component({
  imports: [RouterLink, CurrencyPipe, DatePipe],
  selector: 'app-admin-spaces',
  styleUrl: './admin-spaces.css',
  templateUrl: './admin-spaces.html',
})
export class AdminSpaces {
  private readonly spaceService = inject(Spaceservice)
  readonly espacios = this.spaceService.getAllSpaces();

  readonly busqueda = signal('');
  readonly estado = signal<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  //Id del espacio que se está actualizando, para deshabilitar su botón
  readonly actualizando = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  readonly espaciosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return (this.espacios.value() ?? []).filter(s =>
      (this.estado() === 'Todos' || s.isActive === (this.estado() === 'Activos')) &&
      (!texto || s.nameSpace.toLowerCase().includes(texto)
        || `${s.consumerOwner?.firstname} ${s.consumerOwner?.lastname}`.toLowerCase().includes(texto))
    );
  });

  readonly cantidadInactivos = computed(() =>
    (this.espacios.value() ?? []).filter(s => !s.isActive).length
  );

  cambiarEstado(id: number, active: boolean) {
    this.actualizando.set(id);
    this.error.set(null);
    this.spaceService.setActive(id, active).subscribe({
      next: () => {
        //Actualizamos la lista local en vez de volver a pedir todo
        this.espacios.value.update(lista =>
          lista?.map(s => s.idSpace === id ? { ...s, isActive: active } : s)
        );
        this.actualizando.set(null);
      },
      error: () => {
        this.error.set('No se pudo cambiar el estado del espacio');
        this.actualizando.set(null);
      },
    });
  }
}
