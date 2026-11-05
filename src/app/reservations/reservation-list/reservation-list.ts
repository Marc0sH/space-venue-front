import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { HttpErrorResponse } from '@angular/common/http';
import { ReservationComplete } from '../../models/reservation.model';
import { ReservationCard } from '../reservation-card/reservation-card';
import { Observable } from 'rxjs';

@Component({
  imports: [ReservationCard],
  selector: 'app-reservation-list',
  styleUrl: './reservation-list.css',
  templateUrl: './reservation-list.html',
})
export class ReservationList {
  private readonly reservationService = inject(Reservation)
  private reservationsResource = new Observable<ReservationComplete[]>()
  readonly idSpace = input<string>()
  readonly reservations = signal<ReservationComplete[]>([] as ReservationComplete[])

  isLoading = signal(true)
  error = signal('')

  constructor() {
    effect(() => {
      if(this.idSpace() === undefined){
        this.reservationsResource = this.reservationService.getReservationsOfLoggedUser()

        this.reservationsResource.subscribe({
          next: (res) => {
            this.reservations.set(res)
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
      } else {
        const idSpace = this.idSpace() ?? ''
        this.reservationsResource = this.reservationService.getReservationsOfAnSpace(idSpace)

        this.reservationsResource.subscribe({
          next: (res) => {
            this.reservations.set(res)
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
      }
    })
  }
}
