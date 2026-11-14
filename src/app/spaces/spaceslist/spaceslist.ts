import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Spaceservice } from '../spaceservice';
import { Spacescard } from '../spacescard/spacescard';
import { Session } from '../../auth/session/session';
import { Notificationservice } from '../../user/user-notifications/notificationservice';
import { mensajeDeError } from '../../common/http-error';

@Component({
  imports: [Spacescard, RouterLink],
  selector: 'app-spaceslist',
  styleUrl: './spaceslist.css',
  templateUrl: './spaceslist.html',
})
export class Spaceslist {
  private readonly spaceService = inject(Spaceservice);
  private readonly notificationService = inject(Notificationservice);
  protected readonly sessionService = inject(Session);

  private readonly spacesResource = this.spaceService.getSpaces();

  readonly spaces = computed(() => this.spacesResource.value() ?? []);

  // Espacios que superan 4.5 de valoración, ordenados de mayor a menor rating
  readonly featuredSpaces = computed(() =>
    this.spaces()
      .filter((s) => s.rating > 4.5)
      .sort((a, b) => b.rating - a.rating)
  );

  readonly loading = this.spacesResource.isLoading;
  readonly error = computed(() =>
    this.spacesResource.error()
      ? 'No se pudieron cargar los espacios'
      : null,
  );

  // Estado para la solicitud de ser oferente
  protected readonly requestingOfferer = signal(false);
  protected readonly offererRequestSent = signal(false);
  protected readonly offererRequestError = signal<string | null>(null);

  // Muestra el banner a visitantes no logueados o usuarios con rol ROLE_CLIENT
  protected readonly mostrarBannerOferente = computed(() => {
    const sesion = this.sessionService.session();
    if (!sesion) return true;
    return sesion.rol === 'ROLE_CLIENT';
  });

  requestOffererRole() {
    this.requestingOfferer.set(true);
    this.offererRequestError.set(null);

    this.notificationService.requestOffererRole().subscribe({
      next: () => {
        this.offererRequestSent.set(true);
        this.requestingOfferer.set(false);
      },
      error: (err) => {
        this.offererRequestError.set(
          mensajeDeError(err, 'No se pudo enviar la solicitud')
        );
        this.requestingOfferer.set(false);
      },
    });
  }
}