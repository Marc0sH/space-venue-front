import { Component, computed, effect, ElementRef, inject, viewChild } from '@angular/core';
import { ToastService } from '../toast-service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  readonly toastService = inject(ToastService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  // Se muestra un cartel a la vez: el primero de la cola
  readonly actual = computed(() => this.toastService.toasts()[0] ?? null);

  constructor() {
    // Abre o cierra el <dialog> según haya un cartel pendiente (igual que el de cambios sin guardar)
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;

      if (this.actual() && !element.open) {
        element.showModal();
      } else if (!this.actual() && element.open) {
        element.close();
      }
    });
  }

  cerrar(): void {
    const actual = this.actual();
    if (actual) this.toastService.dismiss(actual.id);
  }

  // Escape cierra el cartel pasando por el servicio, para que el estado no quede desfasado
  onCancel(event: Event): void {
    event.preventDefault();
    this.cerrar();
  }
}
