import { Component, inject, signal } from '@angular/core';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { NewSpace } from '../../models/space.model';
import { emptyLocation } from '../../models/location.model';
import { ServiceReg, ServiceSpace } from '../../models/service.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../spaceservice';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ServiceCreation } from '../Servicios/service-creation/service-creation';
import { ServiceServicios } from '../Servicios/service-servicios';

@Component({
  imports: [FormField, FormErrorMessage, ServiceCreation],
  selector: 'app-space-creation',
  styleUrl: './space-creation.css',
  templateUrl: './space-creation.html',
})
export class SpaceCreation {
  model = signal<NewSpace>({
    location: emptyLocation(),
    cancellationPolicies: 'FLEXIBLE',
    nameSpace: '',
    description: '',
    basePrice: 0,
    bufferTime: 0,
    services: [] as ServiceSpace[],
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
  private serviceService = inject(ServiceServicios);
  private router = inject(Router);

  error = signal('');

  addServices(servicio: ServiceReg) {
    this.serviceService.postServicio(servicio).subscribe({
      next: (createdService) => {
        this.model.update((current) => ({
          ...current,
          services: [
            ...current.services,
            {
              id: createdService.id,
              description: createdService.description ?? '',
              price: Number(createdService.price ?? 0),
              isActive: createdService.isActive ?? true,
            },
          ],
        }));
      },
      error: (e) => console.error('Error creando servicio', e),
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    const payload = {
      ...this.model(),
      services: this.model().services.map((s) => ({
        id: s.id,
        description: s.description,
        price: s.price,
        isActive: s.isActive,
      })),
    };

    this.spaceService.createSpace(payload).subscribe({
      next: (res) => {
        this.error.set('');
        console.log('Espacio creado correctamente:', res);
        this.router.navigate(['/espacios']);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set('Error al crear un espacio: ' + e.message);
        console.error('Error ' + e.status + ' al crear espacio:', e);
      },
    });
  }
}