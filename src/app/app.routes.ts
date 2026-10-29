import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';
import { Register } from './auth/register/register';
import { Login } from './auth/login/login';
import { Spaceslist } from './spaces/spaceslist/spaceslist';
import { Spacescard } from './spaces/spacescard/spacescard';
import { Spacesdetail } from './spaces/spacesdetail/spacesdetail';
import { SpaceCreation } from './spaces/space-creation/space-creation';
import { ListMySpaces } from './spaces/list-my-spaces/list-my-spaces';
import { UserProfile } from './user/user-profile/user-profile';
import { logInGuard } from './guard/log-in-guard';
import { UserEdit } from './user/user-edit/user-edit';
import { NotificationList } from './user/user-notifications/notification-list/notification-list';

export const routes: Routes = [
    {path: '', redirectTo: 'espacios', pathMatch: 'full'},
    {path: 'login', component: Login},
    {path: 'registro', component: Register},
    {path: 'espacios', component: Spaceslist},
    {path: 'espacios/crear', component: SpaceCreation},
    {path: 'espacios/espaciospropios', component: ListMySpaces},
    {path: 'espacios/:id', component: Spacesdetail},
    {path: 'perfil', component: UserProfile, canActivate: [logInGuard]},
    {path: 'perfil/editar', component: UserEdit, canActivate: [logInGuard]},
    {path: 'notificaciones', component: NotificationList, canActivate: [logInGuard]},
    {path:'**', component: NotFound}
];
