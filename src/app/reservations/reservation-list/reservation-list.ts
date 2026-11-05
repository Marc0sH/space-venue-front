import { Component, computed, effect, inject, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { HttpErrorResponse } from '@angular/common/http';
import { ReservationComplete } from '../../models/reservation.model';
import { ReservationCard } from '../reservation-card/reservation-card';

@Component({
  imports: [ReservationCard],
  selector: 'app-reservation-list',
  styleUrl: './reservation-list.css',
  templateUrl: './reservation-list.html',
})
export class ReservationList {
  private readonly reservationService = inject(Reservation)
  private readonly reservationsResource = this.reservationService.getReservationsOfLoggedUser()
  readonly reservationsOfActualUser = signal<ReservationComplete[]>([] as ReservationComplete[])

  isLoading = signal(true)
  error = signal('')

  constructor() {
    effect(() => {
      this.reservationsResource.subscribe({
        next: (res) => {
          this.reservationsOfActualUser.set(res)
          this.isLoading.set(false)
          this.error.set('')
          console.log("Reservas obtenidas: " + res)
        },
        error: (e : HttpErrorResponse) => {
          this.isLoading.set(false)
          this.error.set(e.message)
          console.error("Hubo un error al cargar las reservas: " + e.error)
        }
    
      })
    })
  }
}
