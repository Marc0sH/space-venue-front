import { UserProfileData } from "./user.model";

export type NotificationType =
    | 'WELCOME' | 'RESERVATION_CREATED' | 'RESERVATION_CONFIRMED' | 'RESERVATION_REJECTED'
    | 'RESERVATION_CANCELLED' | 'COMMENT_DEACTIVATED' | 'COMMENT_REACTIVATED' | 'OFFERER_REQUEST';

export interface Notificacion{
    idNotification: number,
    createdAt: number,
    message: string,
    isSeen: boolean,
    idConsumer: number,
    consumerOwner: UserProfileData,
    type?: NotificationType | null,
    referenceId?: number | null
}

export interface NotificacionCount{
    count:number
}