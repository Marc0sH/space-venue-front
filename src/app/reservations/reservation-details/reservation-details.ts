import { Component, computed, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  imports: [DatePipe, CurrencyPipe],
  selector: 'app-reservation-details',
  styleUrl: './reservation-details.css',
  templateUrl: './reservation-details.html',
})
export class ReservationDetails {
  private readonly reservationService = inject(Reservation)
  readonly idReservation = input.required<string>()

  readonly reservation = this.reservationService.getReservation(this.idReservation)
  readonly serviceSelected = this.reservationService.getServicesSelected(this.idReservation)

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
}
