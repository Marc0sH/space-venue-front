import { DOCUMENT } from '@angular/common';
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
  private readonly document = inject(DOCUMENT);
  readonly isDarkMode = signal(false);

  protected notiService = inject(Notificationservice)

  readonly notificaciones = this.notiService.getUnseen();
  // value() lanza si el pedido falló, y eso cortaría el change detection de toda la app
  readonly notificacionesCount = computed(
    () => this.notificaciones.hasValue() ? this.notificaciones.value().length : 0
  );
  readonly showScrollTop = signal(false);
   
  protected sessionService = inject(Session);
  private router = inject(Router)

  constructor() {
    this.isDarkMode.set(localStorage.getItem('space-venue-theme') === 'dark');
    this.applyTheme();
  }

  protected toggleTheme(): void {
    this.isDarkMode.update((isDarkMode) => !isDarkMode);
    localStorage.setItem('space-venue-theme', this.isDarkMode() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    this.document.documentElement.dataset['theme'] = this.isDarkMode() ? 'dark' : 'light';
  }

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
