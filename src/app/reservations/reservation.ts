import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { NewReservation, ReservationComplete } from '../models/reservation.model';
import { environment } from '../../environments/enviroment';
import { ServiceSelected, ServiceSpace } from '../models/service.model';

@Service()
export class Reservation {
    private readonly http = inject(HttpClient)

    localDateTimeWithSeconds(value: string): string {
        return value.length === 16 ? `${value}:00` : value;
    }

    createReservation(reservation: NewReservation) {
        return this.http.post<ReservationComplete>(
            `${environment.apiUrl}/reservations`,
            reservation
        );
    }

    insertServicesSelected(idReservation : number, idServices : number[]){
        return this.http.post<ServiceSelected[]>(
            `${environment.apiUrl}/servicesselected/insert/list/${idReservation}`,
            idServices
        );
    }

    getReservationsOfLoggedUser(){
        return this.http.get<ReservationComplete[]>(`${environment.apiUrl}/reservations/me`)
    }

    getReservationsOfAnSpace(idSpace : string){
        return this.http.get<ReservationComplete[]>(`${environment.apiUrl}/reservations/space/${idSpace}`)
    }

    getReservation(idReservation : Signal<string>){
        return httpResource<ReservationComplete>(() => `${environment.apiUrl}/reservations/${idReservation()}`)
    }
    
    getServicesSelected(idReservation : Signal<string>){
        return httpResource<ServiceSelected[]>(() => `${environment.apiUrl}/servicesselected/reservation/${idReservation()}`)
    }

    rejectReservation(id: string) {
        return this.http.put<void>(
            `${environment.apiUrl}/reservations/reject/${id}`,
            id
        );
    }

    confirmReservation(idReservation : string){
        return this.http.put<void>(`${environment.apiUrl}/reservations/confirm/${idReservation}`, idReservation)
    }
    
    cancelReservation(idReservation : string){
        return this.http.put(`${environment.apiUrl}/reservations/cancel/${idReservation}`, idReservation)
    }
}
