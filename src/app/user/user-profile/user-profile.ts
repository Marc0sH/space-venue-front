import { Component, computed, inject, input, signal } from '@angular/core';
import { User } from '../user';
import { Session } from '../../auth/session/session';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-user-profile',
  styleUrl: './user-profile.css',
  templateUrl: './user-profile.html',
})
export class UserProfile {
  private userService = inject(User);
  private sessionService = inject(Session);
  protected readonly perfil = this.userService.getLoggedProfile();

  protected confirmingDeletion = signal(false);
  protected deleting = signal(false);
  protected deletionError = signal<string | null>(null);

  softDeleteUser() {
    this.deleting.set(true);
    this.deletionError.set(null);
    this.userService.deleteLoggedUser().subscribe({
      next: () => this.sessionService.logoutUser(), //Deslogeamos al usuario luego de eliminarlo
      error: () => {
        this.deletionError.set('No se pudo dar de baja la cuenta. Intentá de nuevo.');
        this.deleting.set(false);
      }
    })
  }


}
