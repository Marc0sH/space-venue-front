import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { NewReservation, ReservationComplete } from '../models/reservation.model';
import { environment } from '../../environments/enviroment';

@Service()
export class Reservation {
    private readonly http = inject(HttpClient)

    localDateTimeWithSeconds(value: string): string {
        return value.length === 16 ? `${value}:00` : value;
    }

    getBackendErrorMessage(error: unknown): string {
        if (error instanceof HttpErrorResponse) {
            const body: unknown = error.error;

            if (
                typeof body === 'object' &&
                body !== null &&
                'mensaje' in body &&
                typeof body.mensaje === 'string'
            ) {
                return body.mensaje;
            }
        }

        return 'Ocurrió un error al crear la reserva.';
    }

    createReservation(reservation: NewReservation) {
        return this.http.post<ReservationComplete>(
            `${environment.apiUrl}/reservations`,
            reservation
        );
    }
}
