import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Session } from '../../auth/session/session';
import { Notificationservice } from '../../user/user-notifications/notificationservice';
import { etiquetaRol } from '../../models/user.model';

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);
  private previousBodyOverflow = '';

  protected readonly sessionService = inject(Session);
  protected readonly notiService = inject(Notificationservice);

  readonly isDarkMode = signal(false);
  readonly showScrollTop = signal(false);
  readonly mobileMenuOpen = signal(false);

  // Controla qué desplegable está abierto ('perfil' | 'admin' | null)
  readonly openDropdown = signal<'perfil' | 'admin' | null>(null);

  // Rol del usuario logueado para mostrar junto a su nombre
  readonly rolLabel = computed(() => etiquetaRol(this.sessionService.session()?.rol));

  readonly notificaciones = this.notiService.getUnseen();
  readonly notificacionesCount = computed(
    () => (this.notificaciones.hasValue() ? this.notificaciones.value().length : 0)
  );

  constructor() {
    this.isDarkMode.set(localStorage.getItem('space-venue-theme') === 'dark');
    this.applyTheme();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.closeMobileMenu());
    this.destroyRef.onDestroy(() => this.closeMobileMenu());
  }

  protected openMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      return;
    }

    this.previousBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.mobileMenuOpen.set(true);
  }

  protected closeMobileMenu(): void {
    if (!this.mobileMenuOpen()) {
      return;
    }

    this.document.body.style.overflow = this.previousBodyOverflow;
    this.mobileMenuOpen.set(false);
  }

  protected toggleMobileMenu(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
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
      this.closeMobileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMobileMenu();
    this.closeDropdowns();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (window.innerWidth >= 768) {
      this.closeMobileMenu();
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
    this.closeMobileMenu();
    this.router.navigate(['/espacios']);
  }
}