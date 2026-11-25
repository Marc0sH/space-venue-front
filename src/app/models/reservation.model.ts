import { ServiceSpace } from "./service.model";
import { Space } from "./space.model";
import { UserComplete } from "./user.model";

export interface ReservationComplete {
    id: number,
    title: string,
    description: string,
    fromDate: string,
    untilDate: string,
    finalPrice: number,
    status: string,
    //Por qué se canceló (ECancellationReason en el back). Solo si status es CANCELLED; null en las canceladas antes de existir el campo
    cancellationReason?: CancellationReason | null,
    createdAt: Date,
    isActive: boolean,
    consumer: UserComplete,
    space: Space,
    servicesSelected: ServiceSpace[]
}

export type CancellationReason = 'CLIENT' | 'OWNER' | 'EXPIRED' | 'PAYMENT_REJECTED' | 'PLATFORM';

//Texto del estado de una reserva; en las canceladas incluye el motivo
export function etiquetaEstadoReserva(r: Pick<ReservationComplete, 'status' | 'cancellationReason'> | undefined): string {
    switch (r?.status) {
        case 'CONFIRMED': return 'Confirmada';
        case 'REJECTED': return 'Rechazada';
        case 'TENTATIVE': return 'En espera de validación';
        case 'COMPLETED': return 'Completada';
        case 'IN_PROGRESS': return 'En curso';
        case 'CANCELLED':
            switch (r.cancellationReason) {
                case 'CLIENT': return 'Cancelada por el cliente';
                case 'OWNER': return 'Cancelada por el dueño';
                case 'EXPIRED': return 'Cancelada: no se confirmó a tiempo';
                case 'PAYMENT_REJECTED': return 'Cancelada: pago rechazado';
                case 'PLATFORM': return 'Cancelada por la plataforma';
                default: return 'Cancelada'; //Canceladas antes de que existiera el motivo
            }
        default: return '';
    }
}

export interface NewReservation extends Omit<ReservationComplete,
    'id' | 'consumer' | 'space' | 'servicesSelected' | 'cancellationReason'> {
  idConsumer: number;
  idSpace: number;
  idServicesSelect: number[];
}

export function VoidNewReservation(idSpace : number, idConsumer: number) {
    return {
        title: "",
        description: "",
        fromDate: new Date().toString(),
        untilDate: new Date().toString(),
        finalPrice: 0,
        status: "TENTATIVE",
        createdAt: new Date(),
        isActive: false,
        idConsumer: idConsumer,
        idSpace: idSpace,
        idServicesSelect: []
    }
}

export type ReservationFormModel = Omit<NewReservation, 'fromDate' | 'untilDate'> & {
  fromDate: string;
  durationHours: number;
  durationMinutes: number;
};

export type ReservationForServicesSelected = Omit<ReservationComplete, 'servicesSelected'>

//Reserva reducida que devuelve /reservations/space/{id}/calendar.
//id, title y consumerName vienen en null si el usuario no es el dueño, admin o el cliente de esa reserva.
export interface ReservationCalendarEntry {
    id: number | null,
    fromDate: string,
    untilDate: string,
    status: 'TENTATIVE' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED',
    title: string | null,
    consumerName: string | null
}
export interface OwnerReservationFilters {
    idSpace: string,
    status: string,
    title: string,
    date: string
}
