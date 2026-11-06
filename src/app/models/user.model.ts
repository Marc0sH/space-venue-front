import { inject } from "@angular/core";
import { User } from "../user/user";

export interface UserComplete {
    idUser: number;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    username: string;
    password: string;
    isActive: boolean;
    role: string;
}

export type CredentialRegister = Omit<UserComplete, 'idUser' | 'isActive' | 'role'>; //Lo que se manda al registrarse en la app

export interface consumerOwner{
    idConsumer: number,
    firstname: string,
    lastname: string
}

export interface LoginRequest{ //Representa los datos que se mandan del front para la autenticacion
    username: string;
    password: string;
}

export interface LoginResponse{ //Formato del DTO de respuesta que manda el backend
    token: string;
    tipo: string;
    rol: string;
    consumerId: number;
}

export interface UserProfileData {
    idConsumer: number;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    credentials: { username: string; isActive: boolean; rol: string; deactivationReason: DeactivationReason | null };
}

//Motivo por el que una cuenta está inactiva (EDeactivationReason en el back). null si está activa
export type DeactivationReason = 'USER_REQUEST' | 'ADMIN';

//Texto del estado de una cuenta para mostrar en la lista y en la ficha
export function etiquetaEstadoCuenta(c: UserProfileData['credentials'] | undefined): string {
    if (c?.isActive) return 'Activa';
    switch (c?.deactivationReason) {
        case 'USER_REQUEST': return 'Baja del usuario';
        case 'ADMIN': return 'Desactivada por el admin';
        default: return 'Desactivada'; //Cuentas desactivadas antes de que existiera el motivo
    }
}

export type UserUpdate = Omit<CredentialRegister, 'username' | 'password'>;

//Filtros de /usuarios/byfields (ConsumerFilterDTO). null = no filtrar por ese campo
export interface ConsumerFilter {
    firstname: string | null;
    lastname: string | null;
    email: string | null;
    phone: string | null; //El back lo compara exacto, no parcial
    username: string | null;
}
