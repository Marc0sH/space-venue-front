import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Session } from '../../auth/session/session';
import { Notificationservice } from '../../user/user-notifications/notificationservice';

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected notiService = inject(Notificationservice)

  readonly notificaciones = this.notiService.getUnseen();
  readonly notificacionesCount = computed(
    () => this.notificaciones.value()?.length ?? 0
  );
  readonly showScrollTop = signal(false);
   
  protected sessionService = inject(Session);
  private router = inject(Router)

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.showScrollTop.set(window.scrollY > 200);
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigate(){
      this.router.navigate(['/espacios']);
  }
}
