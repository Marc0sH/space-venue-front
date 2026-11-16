import { Component, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { HttpErrorResponse } from '@angular/common/http';
import { ReservationComplete } from '../../models/reservation.model';
import { ReservationCard } from '../reservation-card/reservation-card';
import { EMPTY, merge } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { mensajeDeError } from '../../common/http-error';

@Component({
  imports: [ReservationCard],
  selector: 'app-reservation-list',
  styleUrl: './reservation-list.css',
  templateUrl: './reservation-list.html',
})
export class ReservationList {
  private readonly reservationService = inject(Reservation)
  readonly idSpace = input<string>()
  readonly reservations = signal<ReservationComplete[]>([])

  isLoading = signal(true)
  error = signal('')

  protected onStatusChange(id: number, cambio: Pick<ReservationComplete, 'status' | 'cancellationReason'>): void {
    this.reservations.update(reservations =>
      reservations.map(reservation =>
        reservation.id === id ? { ...reservation, ...cambio } : reservation
      )
    )
  }

  constructor() {
    const spaceChanges$ = toObservable(this.idSpace).pipe(
      map((): void => undefined)
    );

    merge(spaceChanges$, this.reservationService.refreshTrigger$())
      .pipe(
        switchMap(() => {
          const idSpace = this.idSpace();
          const request = idSpace === undefined
            ? this.reservationService.getReservationsOfLoggedUser()
            : this.reservationService.getReservationsOfAnSpace(idSpace);

          return request.pipe(
            tap(reservations => {
              this.reservations.set(reservations);
              this.isLoading.set(false);
              this.error.set('');
            }),
            catchError((e: HttpErrorResponse) => {
              this.isLoading.set(false);
              this.error.set(mensajeDeError(e, 'No se pudieron cargar las reservas'));
              console.error('Hubo un error al cargar las reservas:', e.error);
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }
}
