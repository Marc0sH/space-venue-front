import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationComplete } from '../../models/reservation.model';
import { Router } from '@angular/router';
import { Session } from '../../auth/session/session';
import { Reservation } from '../reservation';
import { mensajeDeError } from '../../common/http-error';

@Component({
  imports: [],
  selector: 'app-reservation-card',
  styleUrl: './reservation-card.css',
  templateUrl: './reservation-card.html',
})
export class ReservationCard {
  private readonly router = inject(Router)
  private readonly session = inject(Session)
  private readonly reservationService = inject(Reservation)
  readonly reservation = input.required<ReservationComplete>()
  readonly statusChange = output<ReservationComplete['status']>()
  protected readonly isUpdating = signal(false)
  protected readonly actionError = signal('')

  protected readonly esDuenio = computed(() => {
    const s = this.reservation().space
    const idLogueado = this.session.session()?.consumerId;
    return !!s && idLogueado != null && s.consumerOwner?.idConsumer === idLogueado && !s.deletedByOwner;
  });


  onReject(){
    this.updateStatus('REJECTED', id => this.reservationService.rejectReservation(id))
  }

  onAccept(){
    this.updateStatus('CONFIRMED', id => this.reservationService.confirmReservation(id))
  }

  onCancel(){
    this.updateStatus('CANCELLED', id => this.reservationService.cancelReservation(id))
  }

  private updateStatus(
    status: ReservationComplete['status'],
    action: (id: string) => Observable<unknown>
  ): void {
    if (this.isUpdating()) return

    this.isUpdating.set(true)
    this.actionError.set('')
    action(this.reservation().id.toString()).subscribe({
      next: () => {
        this.statusChange.emit(status)
        this.isUpdating.set(false)
      },
      error: (error: unknown) => {
        console.error('No se pudo actualizar la reserva:', error)
        this.actionError.set(mensajeDeError(error, 'No se pudo actualizar la reserva'))
        this.isUpdating.set(false)
      }
    })
  }

  onDetails(){
    this.router.navigate(['/reservas', this.reservation().id])
  }
}
