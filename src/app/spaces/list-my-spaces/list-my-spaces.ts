import { Component, computed, effect, inject, signal } from '@angular/core';
import { Spacescard } from '../spacescard/spacescard';
import { Spaceservice } from '../spaceservice';
import { etiquetaEstadoEspacio, Space } from '../../models/space.model';
import { SpaceFilter } from '../space-filter/space-filter';
import { mensajeDeError } from '../../common/http-error';

@Component({
  imports: [Spacescard, SpaceFilter],
  selector: 'app-list-my-spaces',
  styleUrl: './list-my-spaces.css',
  templateUrl: './list-my-spaces.html',
})
export class ListMySpaces {
  private readonly spaceService = inject(Spaceservice)
  lista = signal<Space[]>([] as Space[]);
  error = signal<string | null>(null);
  cargando = signal<boolean>(true);

  readonly orden = signal('Sin ordenar');
  readonly etiquetaEstado = etiquetaEstadoEspacio;
  readonly spacesOrdenados = computed(() =>
    this.spaceService.spaceListFiltration(this.lista(), this.orden()),
  );

  constructor() {
    effect(() => {
      this.spaceService.getSpacesByOwnerLogged().subscribe({
        next: data => {
          this.cargando.set(false);
          this.lista.set(data);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(err, 'No se pudieron cargar los espacios'));
        },
      });
    })
  }

  //Id del espacio que espera confirmación de baja y del que se está dando de baja
  readonly confirmandoEliminacion = signal<number | null>(null);
  readonly confirmandoPausa = signal<number | null>(null);
  readonly confirmandoReactivacion = signal<number | null>(null);

  readonly eliminando = signal<number | null>(null);
  readonly pausando = signal<number | null>(null);
  readonly reactivando = signal<number | null>(null);

  readonly errorBaja = signal<string | null>(null);
  readonly errorPausa = signal<string | null>(null);
  readonly errorReactivacion = signal<string | null>(null);

  cambiarOrden(orden : string){
    this.orden.set(orden)
  }

  pedirConfirmacionDeEliminacion(id: number) {
    this.errorBaja.set(null);
    this.confirmandoEliminacion.set(id);
  }

  pedirConfirmacionDePausa(id: number) {
    this.errorPausa.set(null);
    this.confirmandoPausa.set(id);
  }

  pedirConfirmacionReactivacion(id: number) {
    this.errorReactivacion.set(null);
    this.confirmandoReactivacion.set(id);
  }

  darDeBaja(id: number) {
    this.eliminando.set(id);
    this.errorBaja.set(null);
    this.spaceService.deleteOwnedSpace(id).subscribe({
      next: () => {
        //El back ya no devuelve los espacios eliminados por el dueño, así que lo sacamos de la lista
        this.lista.update(lista => lista.filter(s => s.idSpace !== id));
        this.confirmandoEliminacion.set(null);
        this.eliminando.set(null);
      },
      error: (err) => {
        this.errorBaja.set(mensajeDeError(err, 'No se pudo dar de baja el espacio'));
        this.eliminando.set(null);
      },
    });
  }

  pausar(id: number){
    this.pausando.set(id);
    this.errorPausa.set(null);
    this.spaceService.pauseOwnedSpace(id).subscribe({
      next: () => {
        this.lista.update(lista => lista.map(s => s.idSpace === id
          ? { ...s, isActive: false, deactivationReason: 'OWNER_PAUSED' as const }
          : s
        ));
        this.confirmandoPausa.set(null);
        this.pausando.set(null);
      },
      error: (err) => {
        this.errorPausa.set(mensajeDeError(err, 'No se pudo pausar el espacio'));
        this.pausando.set(null);
      },
    });
  }

  reactivar(id: number){
    this.reactivando.set(id);
    this.errorReactivacion.set(null);
    this.spaceService.reactiveOwnedSpace(id).subscribe({
      next: () => {
        this.lista.update(lista => lista.map(s => s.idSpace === id
          ? { ...s, isActive: true, deactivationReason: null }
          : s
        ));
        this.confirmandoReactivacion.set(null);
        this.reactivando.set(null);
      },
      error: (err) => {
        this.errorReactivacion.set(mensajeDeError(err, 'No se pudo reactivar el espacio'));
        this.reactivando.set(null);
      },
    });
  }

  estaEnPausa(id: number): boolean {
    const espacio = this.lista().find(s => s.idSpace === id);
    return espacio !== undefined
      && !espacio.isActive
      && espacio.deactivationReason === 'OWNER_PAUSED';
  }
}
