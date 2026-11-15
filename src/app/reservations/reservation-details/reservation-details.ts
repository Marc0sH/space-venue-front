import { Component, computed, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Session } from '../../auth/session/session';
import { mensajeDeError } from '../../common/http-error';
import { etiquetaEstadoReserva } from '../../models/reservation.model';

@Component({
  imports: [DatePipe, CurrencyPipe],
  selector: 'app-reservation-details',
  styleUrl: './reservation-details.css',
  templateUrl: './reservation-details.html',
})
export class ReservationDetails {
  private readonly reservationService = inject(Reservation)
  private readonly session = inject(Session)
  readonly idReservation = input.required<string>()
  protected readonly etiquetaEstado = etiquetaEstadoReserva

  
  readonly reservation = this.reservationService.getReservation(this.idReservation)
  readonly serviceSelected = this.reservationService.getServicesSelected(this.idReservation)

  readonly errorReserva = computed(() =>
    mensajeDeError(this.reservation.error(), 'No se pudieron obtener los datos de la reserva')
  )
  
  readonly hoursReservation = computed(() => {
    const reservation = this.reservation.value();
    
    if (!reservation?.fromDate || !reservation.untilDate) {
      return null;
    }
    
    const fromDate = new Date(reservation.fromDate).getTime();
    const untilDate = new Date(reservation.untilDate).getTime();
    
    if (!Number.isFinite(fromDate) || !Number.isFinite(untilDate)) {
      return null;
    }
    
    return (untilDate - fromDate) / (1000 * 60 * 60);
  });
  
  protected readonly esDuenio = computed(() => {
    const s = this.reservation.hasValue() ? this.reservation.value().space : undefined;
    const idLogueado = this.session.session()?.consumerId;
    return !!s && idLogueado != null && s.consumerOwner?.idConsumer === idLogueado;
  });

  protected readonly esCliente = computed(() => {
    const consumer = this.reservation.hasValue() ? this.reservation.value().consumer : undefined;
    const idLogueado = this.session.session()?.consumerId;
    const idCliente = consumer && 'idConsumer' in consumer ? consumer.idConsumer : undefined;
    return idLogueado != null && typeof idCliente === 'number' && idCliente === idLogueado;
  });
}
