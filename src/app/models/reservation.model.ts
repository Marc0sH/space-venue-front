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
    createdAt: Date,
    isActive: boolean,
    consumer: UserComplete,
    space: Space,
    servicesSelected: ServiceSpace[]
}

export interface NewReservation extends Omit<ReservationComplete,
    'id' | 'consumer' | 'space' | 'servicesSelected'> {
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
