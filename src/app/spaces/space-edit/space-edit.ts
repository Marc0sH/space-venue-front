import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Spaceservice } from '../spaceservice';
import { Session } from '../../auth/session/session';
import { SpaceUpdate } from '../../models/space.model';
import { Coordinates, hasLocation } from '../../models/location.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { LocationPicker } from '../../common/location-picker/location-picker';

// La ubicación puede quedar vacía si el espacio se creó antes del mapa
type SpaceEditForm = Omit<SpaceUpdate, 'location'> & { location: Coordinates | null }

@Component({
  imports: [FormField, FormErrorMessage, RouterLink, LocationPicker],
  selector: 'app-space-edit',
  // Mismo diseño que el formulario de creación
  styleUrl: '../space-creation/space-creation.css',
  templateUrl: './space-edit.html',
})
export class SpaceEdit {
  private readonly spaceService = inject(Spaceservice);
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly space = this.spaceService.getById(this.id);

  //Solo el dueño puede editar, y no si ya eliminó el espacio (el back también lo valida)
  protected readonly esDuenio = computed(() => {
    const s = this.space.hasValue() ? this.space.value() : undefined;
    const idLogueado = this.session.session()?.consumerId;
    return !!s && idLogueado != null && s.consumerOwner?.idConsumer === idLogueado && !s.deletedByOwner;
  });

  //Se precarga con los datos actuales del espacio
  model = linkedSignal<SpaceEditForm>(() => {
    const s = this.space.hasValue() ? this.space.value() : undefined;
    return {
      nameSpace: s?.nameSpace ?? '',
      description: s?.description ?? '',
      basePrice: s?.basePrice ?? 0,
      bufferTime: s?.bufferTime ?? 0,
      //No se edita desde el formulario, pero el back la exige: se reenvía la política actual
      cancellationPolicies: s?.cancellationPolicies?.type ?? 'FLEXIBLE',
      location: hasLocation(s?.location) ? { latitude: s.location.latitude, longitude: s.location.longitude } : null,
    };
  });

  formEdit = form(this.model, (path) => {
    required(path.nameSpace, { message: 'El nombre del espacio es obligatorio' });
    required(path.description, { message: 'La descripción del espacio es obligatoria' });
    required(path.basePrice, { message: 'El precio base es obligatorio' });
    min(path.basePrice, 1, { message: 'El precio base debe ser mayor a 0' });
    required(path.bufferTime, { message: 'El tiempo de receso es obligatorio' });
    min(path.bufferTime, 1, { message: 'El tiempo de receso debe ser mayor a 0' });
    required(path.location, { message: 'Marcá la ubicación del espacio en el mapa' });
  });

  error = signal('');
  guardando = signal(false);

  onSubmit(event: Event) {
    event.preventDefault();
    const { location, ...datos } = this.model();
    if (!location || this.formEdit().invalid()) return;
    const idSpace = Number(this.id());
    this.guardando.set(true);
    this.error.set('');

    this.spaceService.updateOwnedSpace(idSpace, { ...datos, location }).subscribe({
      next: () => this.router.navigate(['/espacios', idSpace]),
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        const detalle = e.error?.errores
          ? JSON.stringify(e.error.errores)
          : e.error?.mensaje ?? e.error?.message;
        this.error.set('No se pudo guardar el espacio' + (detalle ? ': ' + detalle : ''));
        console.error('Error ' + e.status + ' al editar espacio:', e);
      },
    });
  }
}
