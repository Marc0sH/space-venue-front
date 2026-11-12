import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Spaceservice } from '../spaceservice';
import { etiquetaEstadoEspacio } from '../../models/space.model';
import { mensajeDeError } from '../../common/http-error';

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
  readonly etiquetaEstado = etiquetaEstadoEspacio;

  //Además de Todos/Activos/Inactivos se puede filtrar por motivo de baja (OWNER_DELETED, ADMIN, PENDING_APPROVAL)
  readonly estado = signal<string>('Todos');
  //Id del espacio que se está actualizando, para deshabilitar su botón
  readonly actualizando = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  readonly espaciosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return (this.espacios.value() ?? []).filter(s =>
      this.coincideEstado(s.isActive, s.deactivationReason) &&
      (!texto || s.nameSpace.toLowerCase().includes(texto)
        || `${s.consumerOwner?.firstname} ${s.consumerOwner?.lastname}`.toLowerCase().includes(texto))
    );
  });

  private coincideEstado(isActive: boolean, motivo: string | null): boolean {
    switch (this.estado()) {
      case 'Todos': return true;
      case 'Activos': return isActive;
      case 'Inactivos': return !isActive;
      default: return !isActive && motivo === this.estado();
    }
  }

  readonly cantidadInactivos = computed(() =>
    (this.espacios.value() ?? []).filter(s => !s.isActive).length
  );

  cambiarEstado(id: number, active: boolean) {
    this.actualizando.set(id);
    this.error.set(null);
    this.spaceService.setActive(id, active).subscribe({
      next: () => {
        //Actualizamos la lista local en vez de volver a pedir todo (mismo criterio que el back para el motivo)
        this.espacios.value.update(lista =>
          lista?.map(s => s.idSpace === id
            ? { ...s, isActive: active, deactivationReason: active ? null : 'ADMIN' as const }
            : s)
        );
        this.actualizando.set(null);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado del espacio'));
        this.actualizando.set(null);
      },
    });
  }
}
