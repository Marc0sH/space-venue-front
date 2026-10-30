import { UserProfileData } from "./user.model";

export interface Notificacion{
    idNotification: number,
    createdAt: Date,
    message: string,
    isSeen: boolean,
    idConsumer: number,
    consumerOwner: UserProfileData
}

export interface NotificacionCount{
    count:number
}