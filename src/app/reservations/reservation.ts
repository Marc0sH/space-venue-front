import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { NewReservation, ReservationCalendarEntry, ReservationComplete } from '../models/reservation.model';
import { environment } from '../../environments/enviroment';
import { ServiceSelected, ServiceSpace } from '../models/service.model';
import { filter, fromEvent, map, merge, Observable, timer } from 'rxjs';

@Service()
export class Reservation {
    private readonly http = inject(HttpClient)

    refreshTrigger$(): Observable<void> {
        const isVisible = () => document.visibilityState === 'visible';

        // Se utiliza solo un segundo para probar visibilidad inmediata, 
        // pero este rango es muy corto, por lo que compromete recursos, tráfico,
        // y rendimiento básico del sistema en todo su conjunto. Lo recomendable son de 60 
        // segundos para arriba.
        const everyMinute$ = timer(1_000, 1_000).pipe(
            filter(isVisible),
            map((): void => undefined)
        );

        const whenTabBecomesVisible$ = fromEvent(document, 'visibilitychange').pipe(
            filter(isVisible),
            map((): void => undefined)
        );

        return merge(everyMinute$, whenTabBecomesVisible$);
    }

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

    //Reservas pendientes y confirmadas de un espacio entre dos fechas (yyyy-MM-dd, ambas inclusive).
    //Devuelve undefined en la request (no pide nada) mientras range() sea null.
    getCalendarOfSpace(idSpace : Signal<string>, range : Signal<{ from: string, to: string } | null>){
        return httpResource<ReservationCalendarEntry[]>(() => {
            const r = range();
            if (!r) return undefined;
            return {
                url: `${environment.apiUrl}/reservations/space/${idSpace()}/calendar`,
                params: { from: r.from, to: r.to }
            };
        }, { defaultValue: [] });
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
