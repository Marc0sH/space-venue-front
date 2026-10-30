import { Component, inject, signal } from '@angular/core';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { NewSpace } from '../../models/space.model';
import { ServiceReg } from '../../models/service.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../spaceservice';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ServiceCreation } from '../Servicios/service-creation/service-creation';

@Component({
  imports: [FormField, FormErrorMessage, ServiceCreation],
  selector: 'app-space-creation',
  styleUrl: './space-creation.css',
  templateUrl: './space-creation.html',
})
export class SpaceCreation {
  model = signal<NewSpace>({
    location: { latitude: 0, longitude: 0 },
    cancellationPolicies: 'FLEXIBLE',
    nameSpace: '',
    description: '',
    basePrice: 0,
    bufferTime: 0,
    services: [],
  });

  formSpaceCreation = form(this.model, (path) => {
    required(path.nameSpace, { message: 'El nombre del espacio es obligatorio' });
    required(path.description, { message: 'La descripción del espacio es obligatoria' });
    required(path.basePrice, { message: 'El precio base es obligatorio' });
    required(path.bufferTime, { message: 'El tiempo de espera entre reservas es obligatorio' });
    required(path.location.latitude, { message: 'La latitud es obligatoria' });
    required(path.location.longitude, { message: 'La longitud es obligatoria' });

    min(path.location.latitude, -90, { message: 'La latitud debe ser mayor o igual a -90' });
    max(path.location.latitude, 90, { message: 'La latitud debe ser menor o igual a 90' });
    min(path.location.longitude, -180, { message: 'La longitud debe ser mayor o igual a -180' });
    max(path.location.longitude, 180, { message: 'La longitud debe ser menor o igual a 180' });
  });

  private spaceService = inject(Spaceservice);
  private router = inject(Router);

  error = signal('');
  saving = signal(false);

  addServices(servicio: ServiceReg) {
    this.model.update((current) => ({
      ...current,
      services: [...current.services, servicio],
    }));
    this.error.set('');
  }

  removeService(index: number) {
    this.model.update((current) => ({
      ...current,
      services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
    }));
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.formSpaceCreation().invalid() || this.saving()) {
      return;
    }

    const current = this.model();
    const payload: NewSpace = {
      location: {
        latitude: current.location.latitude,
        longitude: current.location.longitude,
      },
      cancellationPolicies: current.cancellationPolicies,
      nameSpace: current.nameSpace,
      description: current.description,
      basePrice: current.basePrice,
      bufferTime: current.bufferTime,
      services: current.services.map(({ description, price }) => ({ description, price })),
    };

    this.saving.set(true);
    this.error.set('');
    this.spaceService.createSpace(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.error.set('');
        console.log('Espacio creado correctamente:', res);
        this.router.navigate(['/espacios']);
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const validationDetail = e.error?.errores
          ? JSON.stringify(e.error.errores)
          : undefined;
        const detail = typeof e.error === 'string'
          ? e.error
          : validationDetail ?? e.error?.mensaje ?? e.error?.message ?? e.message;
        this.error.set('Error al crear un espacio: ' + detail);
        console.error('Error ' + e.status + ' al crear espacio:', e);
      },
    });
  }
}