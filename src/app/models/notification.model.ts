import { UserProfileData } from "./user.model";

export interface Notificacion{
    idNotification: number,
    createdAt: number,
    message: string,
    isSeen: boolean,
    idConsumer: number,
    consumerOwner: UserProfileData
}

export interface NotificacionCount{
    count:number
}