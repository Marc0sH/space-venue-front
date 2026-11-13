import { DOCUMENT } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
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
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);

  protected readonly sessionService = inject(Session);
  protected readonly notiService = inject(Notificationservice);

  readonly isDarkMode = signal(false);
  readonly showScrollTop = signal(false);

  // Controla qué desplegable está abierto ('perfil' | 'admin' | null)
  readonly openDropdown = signal<'perfil' | 'admin' | null>(null);

  readonly notificaciones = this.notiService.getUnseen();
  readonly notificacionesCount = computed(
    () => (this.notificaciones.hasValue() ? this.notificaciones.value().length : 0)
  );

  constructor() {
    this.isDarkMode.set(localStorage.getItem('space-venue-theme') === 'dark');
    this.applyTheme();
  }

  protected toggleDropdown(menu: 'perfil' | 'admin', event: Event): void {
    event.stopPropagation();
    this.openDropdown.update((current) => (current === menu ? null : menu));
  }

  protected closeDropdowns(): void {
    this.openDropdown.set(null);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdowns();
    }
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

  navigate(): void {
    this.closeDropdowns();
    this.router.navigate(['/espacios']);
  }
}