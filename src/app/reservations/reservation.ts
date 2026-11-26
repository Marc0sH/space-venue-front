import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { NewReservation, OwnerReservationFilters, ReservationCalendarEntry, ReservationComplete } from '../models/reservation.model';
import { environment } from '../../environments/enviroment';
import { ServiceSelected, ServiceSpace } from '../models/service.model';
import { CancellationRefund } from '../models/cancellation-refund.model';

//Los pagos simulados usan ids altos para no chocar con ids reales de Mercado Pago
const ID_PAGO_SIMULADO_BASE = 9_000_000_000;

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
        return this.http.put<ReservationComplete>(`${environment.apiUrl}/reservations/cancel/${idReservation}`, idReservation)
    }

    //Lo que le correspondería al cliente si quien consulta cancelara la reserva ahora (no modifica nada)
    getCancellationPreview(idReservation : string){
        return this.http.get<CancellationRefund>(`${environment.apiUrl}/reservations/${idReservation}/cancellation-preview`)
    }

    //PAGO SIMULADO: marca la reserva como pagada usando la simulación del webhook (no pasa por Mercado Pago).
    //Reemplazar por el checkout real cuando se integre Mercado Pago.
    //El id de pago es fijo por reserva: si se paga dos veces se actualiza el mismo pago en vez de crear otro
    //(el back espera un solo pago por reserva)
    simulatePayment(idReservation : number){
        return this.http.post<void>(`${environment.apiUrl}/v1/payments/webhook`, {
            type: 'payment',
            data: { id: ID_PAGO_SIMULADO_BASE + idReservation },
            isSimulation: true,
            reservationId: idReservation,
        })
    }

    getOwnerReservations(filters: Signal<OwnerReservationFilters>) {
    return httpResource<ReservationComplete[]>(() => {
        const f = filters();
        const params: Record<string, string> = {};
        if (f.idSpace) params['idSpace'] = f.idSpace;
        if (f.status) params['status'] = f.status;
        if (f.title.trim()) params['title'] = f.title.trim();
        if (f.date) params['date'] = f.date;
        return { url: `${environment.apiUrl}/reservations/owner`, params };
    }, { defaultValue: [] });
}
}
