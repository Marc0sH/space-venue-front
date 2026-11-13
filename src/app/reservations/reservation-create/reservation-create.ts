import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { Session } from '../../auth/session/session';
import { ReservationFormModel, VoidNewReservation } from '../../models/reservation.model';
import { form, FormField, max, min, required, validate } from '@angular/forms/signals';
import { Space } from '../../models/space.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../../spaces/spaceservice';
import { mensajeDeError } from '../../common/http-error';

const MIN_DURATION_MINUTES = 10;

@Component({
  imports: [FormField, CurrencyPipe, DatePipe, FormErrorMessage],
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
    durationHours: 1,
    durationMinutes: 0
  })

  /** Servicios activos del espacio, que son los que se pueden contratar. */
  activeServices = computed(() =>
    (this.spaceToReserve.value()?.services ?? []).filter(service => service.isActive)
  );

  /** Duración total del evento en minutos (0 si los campos no son válidos). */
  durationInMinutes = computed(() => {
    const { durationHours, durationMinutes } = this.model();
    const hours = Number(durationHours);
    const minutes = Number(durationMinutes);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return 0;
    }
    return hours * 60 + minutes;
  });

  /** Fecha de fin calculada a partir de la fecha de inicio y la duración. */
  untilDate = computed<Date | null>(() => {
    const { fromDate } = this.model();
    const start = new Date(fromDate).getTime();
    const duration = this.durationInMinutes();
    if (!fromDate || !Number.isFinite(start) || duration <= 0) {
      return null;
    }
    return new Date(start + duration * 60 * 1000);
  });

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
    required(path.title, {message: 'El título es obligatorio'})
    required(path.description, {message: 'La descripción es obligatoria'})
    required(path.fromDate, {message: 'La fecha de inicio es obligatoria'})
    required(path.durationHours, {message: 'Las horas de duración son obligatorias'})
    required(path.durationMinutes, {message: 'Los minutos de duración son obligatorios'})
    
    validate(path.title, (ctx) => 
      ctx.value() && ctx.value().trim() !== '' 
    ? null 
    : {kind: 'campo vacio', message: 'El título no puede estar vacío'})

    validate(path.description, (ctx) => 
      ctx.value() && ctx.value().trim() !== '' 
    ? null 
    : {kind: 'campo vacio', message: 'La descripción no puede estar vacía'})

    const paseHoras = 1000 * 60 * 60; // 1 hora en milisegundos
    validate(path.fromDate, (ctx) => {
      const fromDate = new Date(ctx.value());
      const now = new Date();
      const diffInHours = (fromDate.getTime() - now.getTime()) / paseHoras;
      return ctx.value() && diffInHours >= (this.spaceToReserve.value()?.bufferTime ?? 60) / 60
      ? null 
      : {kind: 'fecha invalida', message: 'La fecha de inicio choca con el tiempo en que el dueño necesita preparar el espacio'}
    })

    validate(path.fromDate, (ctx) => 
      ctx.value() && new Date(ctx.value()) >= new Date() 
    ? null 
    : {kind: 'fecha invalida', message: 'La fecha de inicio debe ser igual o posterior a la fecha actual'})

    min(path.durationHours, 0, {message: 'Las horas no pueden ser negativas'})
    max(path.durationHours, 23, {message: 'El evento no puede durar 24 horas o más'})
    validate(path.durationHours, (ctx) =>
      Number.isInteger(Number(ctx.value()))
    ? null
    : {kind: 'duracion invalida', message: 'Las horas deben ser un número entero'})

    min(path.durationMinutes, 0, {message: 'Los minutos no pueden ser negativos'})
    max(path.durationMinutes, 59, {message: 'Los minutos deben estar entre 0 y 59'})
    validate(path.durationMinutes, (ctx) =>
      Number.isInteger(Number(ctx.value()))
    ? null
    : {kind: 'duracion invalida', message: 'Los minutos deben ser un número entero'})

    validate(path.durationMinutes, () => 
      this.durationInMinutes() >= MIN_DURATION_MINUTES
    ? null
    : {kind: 'duracion invalida', message: `La duración mínima del evento es de ${MIN_DURATION_MINUTES} minutos`})
  })

  error = signal<string>("")
  finalPrice = computed(() => {
    const space = this.spaceToReserve.value();
    const { idServicesSelect } = this.model();

    if (!space || !this.untilDate()) {
      return 0;
    }

    const hours = this.durationInMinutes() / 60;
    const selectedIds = new Set(idServicesSelect);

    const servicesTotal = space.services
      .filter(service => service.isActive && selectedIds.has(service.id))
      .reduce((total, service) => total + service.price, 0);

    return space.basePrice * hours + servicesTotal;
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

    const { durationHours, durationMinutes, ...reservation } = this.model();
    const untilDate = this.untilDate();

    if (!untilDate) {
      this.error.set("La fecha de inicio y la duración del evento no son válidas");
      return;
    }

    this.reservationService.createReservation({
      ...reservation,
      fromDate: this.reservationService.localDateTimeWithSeconds(reservation.fromDate),
      untilDate: this.toLocalDateTime(untilDate),
      finalPrice: this.finalPrice()
    }).subscribe({
      next: response => {
        console.log("La reserva fue creada con éxito: " + response);

        this.reservationService.insertServicesSelected(response.id, this.model().idServicesSelect).subscribe({
          next: (res) => {
            console.log("Los servicios se ingresaron con éxito");
          },
          error: (e) => {
            console.error("Hubo un error: " + e);
          }
        })

        this.router.navigate(['/espacios'])
      },
      error: (error) => {
        const e = mensajeDeError(error, 'No se pudo crear la reserva')
        this.error.set(e)
        console.error(e);
      }
    });
  }

  /** Formatea una fecha como 'yyyy-MM-ddTHH:mm:ss' en hora local (lo que espera el backend). */
  private toLocalDateTime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
