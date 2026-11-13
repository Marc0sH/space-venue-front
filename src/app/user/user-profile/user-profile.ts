import { Component, computed, inject, input, signal } from '@angular/core';
import { User } from '../user';
import { Session } from '../../auth/session/session';
import { RouterLink } from '@angular/router';
import { etiquetaEstadoCuenta, etiquetaRol } from '../../models/user.model';
import { mensajeDeError } from '../../common/http-error';

@Component({
  imports: [RouterLink],
  selector: 'app-user-profile',
  styleUrl: './user-profile.css',
  templateUrl: './user-profile.html',
})
export class UserProfile {
  private userService = inject(User);
  private sessionService = inject(Session);

  //Viene de la ruta admin/usuarios/:id (withComponentInputBinding). En /perfil queda undefined
  readonly id = input<string>();

  //Si hay id, el admin está viendo la ficha de otro usuario: solo lectura, sin editar ni dar de baja
  protected readonly vistaAdmin = computed(() => this.id() != null);

  protected readonly perfil = this.userService.getProfile(() =>
    this.vistaAdmin() ? Number(this.id()) : this.sessionService.session()?.consumerId
  );

  protected readonly etiquetaEstado = etiquetaEstadoCuenta;
  protected readonly etiquetaRol = etiquetaRol;

  protected confirmingDeletion = signal(false);
  protected deleting = signal(false);
  protected deletionError = signal<string | null>(null);

  softDeleteUser() {
    this.deleting.set(true);
    this.deletionError.set(null);
    this.userService.deleteLoggedUser().subscribe({
      next: () => this.sessionService.clearSession(), //El backend ya invalidó el token en la baja, solo limpiamos la sesion local
      error: (err) => {
        this.deletionError.set(mensajeDeError(err, 'No se pudo dar de baja la cuenta'));
        this.deleting.set(false);
      }
    })
  }


}
