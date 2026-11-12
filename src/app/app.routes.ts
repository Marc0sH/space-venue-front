import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';
import { Register } from './auth/register/register';
import { Login } from './auth/login/login';
import { Spaceslist } from './spaces/spaceslist/spaceslist';
import { Spacescard } from './spaces/spacescard/spacescard';
import { Spacesdetail } from './spaces/spacesdetail/spacesdetail';
import { SpaceCreation } from './spaces/space-creation/space-creation';
import { SpaceEdit } from './spaces/space-edit/space-edit';
import { ListMySpaces } from './spaces/list-my-spaces/list-my-spaces';
import { AllSpaces } from './spaces/all-spaces/all-spaces';
import { UserProfile } from './user/user-profile/user-profile';
import { logInGuard } from './guard/log-in-guard';
import { UserEdit } from './user/user-edit/user-edit';
import { NotificationList } from './user/user-notifications/notification-list/notification-list';
import { AdminSpaces } from './spaces/admin-spaces/admin-spaces';
import { adminGuard } from './guard/admin-guard';
import { publicadorGuard } from './guard/publicador-guard';
import { AdminUsers } from './user/admin-users/admin-users';
import { ReservationCreate } from './reservations/reservation-create/reservation-create';
import { ReservationList } from './reservations/reservation-list/reservation-list';
import { ReservationDetails } from './reservations/reservation-details/reservation-details';

export const routes: Routes = [
    {path: '', redirectTo: 'espacios', pathMatch: 'full'},
    {path: 'login', component: Login},
    {path: 'registro', component: Register},
    {path: 'espacios', component: Spaceslist},
    {path: 'espacios/todos', component: AllSpaces},
    {path: 'espacios/crear', component: SpaceCreation, canActivate: [publicadorGuard]},
    {path: 'espacios/espaciospropios', component: ListMySpaces, canActivate: [publicadorGuard]},
    {path: 'espacios/:id/editar', component: SpaceEdit, canActivate: [publicadorGuard]},
    {path: 'espacios/:id', component: Spacesdetail},
    {path: 'reserva/:idSpace', component: ReservationCreate, canActivate: [logInGuard]},
    {path: 'reservas', component: ReservationList, canActivate: [logInGuard]},
    {path: 'reservas/:idReservation', component: ReservationDetails, canActivate: [logInGuard]},
    {path: 'reservas/byspace/:idSpace', component: ReservationList, canActivate: [publicadorGuard]},
    {path: 'perfil', component: UserProfile, canActivate: [logInGuard]},
    {path: 'perfil/editar', component: UserEdit, canActivate: [logInGuard]},
    {path: 'notificaciones', component: NotificationList, canActivate: [logInGuard]},
    {path: 'admin/espacios', component: AdminSpaces, canActivate: [adminGuard]},
    {path: 'admin/usuarios', component: AdminUsers, canActivate: [adminGuard]},
    {path: 'admin/usuarios/:id', component: UserProfile, canActivate: [adminGuard]},
    {path:'**', component: NotFound}
];
