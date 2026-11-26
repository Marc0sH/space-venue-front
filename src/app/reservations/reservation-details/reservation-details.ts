import { Component, computed, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Session } from '../../auth/session/session';
import { mensajeDeError } from '../../common/http-error';
import { etiquetaEstadoReserva } from '../../models/reservation.model';
import { pesos } from '../../models/cancellation-refund.model';
import { Observable } from 'rxjs';

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
  protected readonly pesos = pesos
  protected readonly isUpdating = signal(false)
  protected readonly actionError = signal('')

  
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

  //Reserva cancelada estando pagada: tiene guardado el resultado de la política de cancelación
  protected readonly reembolso = computed(() => {
    const r = this.reservation.hasValue() ? this.reservation.value() : undefined;
    return r?.status === 'CANCELLED' && r.refundPercentage != null ? r : null;
  });

  //PAGO SIMULADO (hasta integrar Mercado Pago): el cliente puede pagar su reserva una vez que el dueño la confirmó
  protected readonly puedePagar = computed(() =>
    this.esCliente() && this.reservation.value()?.status === 'CONFIRMED' && !this.reservation.value()?.paid
  )
  protected readonly pagando = signal(false)
  protected readonly pagoError = signal('')

  onPay() {
    const r = this.reservation.value()
    if (!r || this.pagando()) return
    this.pagando.set(true)
    this.pagoError.set('')
    this.reservationService.simulatePayment(r.id).subscribe({
      next: () => {
        this.pagando.set(false)
        this.reservation.reload() //la etiqueta pasa a "Confirmada y pagada" y el botón desaparece
      },
      error: (error: unknown) => {
        this.pagoError.set(mensajeDeError(error, 'No se pudo registrar el pago'))
        this.pagando.set(false)
      },
    })
  }

  //Solo el dueño puede responder, y solo mientras la reserva sigue pendiente (mismo criterio que reservation-card)
  protected readonly puedeResponder = computed(() =>
    this.esDuenio()
    && this.reservation.value()?.status === 'TENTATIVE'
    && !this.reservation.value()?.space?.deletedByOwner
  )

  onAccept() {
    this.responder(id => this.reservationService.confirmReservation(id))
  }

  onReject() {
    this.responder(id => this.reservationService.rejectReservation(id))
  }

  private responder(action: (id: string) => Observable<unknown>) {
    if (this.isUpdating()) return
    this.isUpdating.set(true)
    this.actionError.set('')
    action(this.idReservation()).subscribe({
      next: () => {
        this.isUpdating.set(false)
        this.reservation.reload() //el estado y la etiqueta se actualizan solos
      },
      error: (error: unknown) => {
        this.actionError.set(mensajeDeError(error, 'No se pudo actualizar la reserva'))
        this.isUpdating.set(false)
      },
    })
  }
}
