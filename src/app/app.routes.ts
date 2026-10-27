import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';
import { Register } from './auth/register/register';
import { Login } from './auth/login/login';
import { Spaceslist } from './spaces/spaceslist/spaceslist';
import { Spacescard } from './spaces/spacescard/spacescard';
import { Spacesdetail } from './spaces/spacesdetail/spacesdetail';

export const routes: Routes = [
    {path: '', redirectTo: 'espacios', pathMatch: 'full'},
    {path: 'login', component: Login},
    {path:'registro', component: Register},
    {path: 'espacios', component: Spaceslist},
    {path: 'espacios/:id', component: Spacesdetail},
    {path:'**', component: NotFound}
];
