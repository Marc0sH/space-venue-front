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
    credentials: { username: string; isActive: boolean; rol: string };
}

export type UserUpdate = Omit<CredentialRegister, 'username' | 'password'>;
