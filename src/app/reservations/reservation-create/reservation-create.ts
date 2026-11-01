import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { Session } from '../../auth/session/session';
import { ReservationFormModel, VoidNewReservation } from '../../models/reservation.model';
import { form, FormField } from '@angular/forms/signals';
import { Space } from '../../models/space.model';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../../spaces/spaceservice';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [FormField, CurrencyPipe, FormErrorMessage],
  selector: 'app-reservation-create',
  styleUrl: './reservation-create.css',
  templateUrl: './reservation-create.html',
})
export class ReservationCreate {
  private session = inject(Session);
  private reservationService = inject(Reservation);
  private spaceService = inject(Spaceservice)
  private router = inject(Router)

  idSpace = input.required<string>() 
  spaceToReserve = this.spaceService.getById(this.idSpace)

  model = signal<ReservationFormModel>({
    ...VoidNewReservation(-1, this.session.session()?.consumerId ?? -1),
    fromDate: '',
    untilDate: ''
  })

  constructor() {
    effect(() => {
      const space = this.spaceToReserve.value();
      this.model.update(reservation => ({
        ...reservation,
        idSpace: space?.idSpace ?? -1
      }));
    });
  } 

  formReservation = form(this.model, (path) => {

  })

  error = signal<string>("")
  finalPrice = computed(() => {
    const space = this.spaceToReserve.value();
    const selectedIds = new Set(this.model().idServicesSelect);

    const servicesTotal = space?.services
      .filter(service => service.isActive && selectedIds.has(service.id))
      .reduce((total, service) => total + service.price, 0);

    return (space?.basePrice ?? 0) + (servicesTotal ?? 0);
  });

  onServiceToggle(serviceId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.model.update(reservation => {
      const selectedIds = new Set(reservation.idServicesSelect);

      if (checked) {
        selectedIds.add(serviceId);
      } else {
        selectedIds.delete(serviceId);
      }

      return { ...reservation, idServicesSelect: [...selectedIds] };
    });

    this.formReservation.idServicesSelect().markAsTouched();
  }

  onSubmit(event: Event){
    event.preventDefault()

    if (!this.session.session()) {
      const e = "Necesita iniciar sesión para reservar un espacio"
      this.error.set(e)
      console.error(e)
      return;
    }

    const reservation = this.model();

    this.reservationService.createReservation({
      ...reservation,
      fromDate: this.reservationService.localDateTimeWithSeconds(reservation.fromDate),
      untilDate: this.reservationService.localDateTimeWithSeconds(reservation.untilDate),
      finalPrice: this.finalPrice()
    }).subscribe({
      next: response => {
        console.log("La reserva fue creada con éxito: " + response);
        this.router.navigate(['/espacios'])
      },
      error: (error) => {
        const e = this.reservationService.getBackendErrorMessage(error)
        this.error.set(e)
        console.error(e);
      }
    });
  }
}
