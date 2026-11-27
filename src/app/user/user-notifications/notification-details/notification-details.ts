import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Notificacion } from '../../../models/notification.model';
import { getNotificationLink, getNotificationMeta } from '../notification-link';

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-notification-details',
  styleUrl: './notification-details.css',
  templateUrl: './notification-details.html',
})
export class NotificationDetails {
  // Notificación a mostrar (null = no hay ninguna seleccionada)
  notification = input<Notificacion | null>(null);

  // Para el botón "Atrás" en celular
  readonly volver = output<void>();

  // Título e ícono según el tipo de notificación
  protected readonly meta = computed(() => getNotificationMeta(this.notification()?.type));

  // Botones de redirección (vacío si el tipo no tiene destino)
  protected readonly links = computed(() => {
    const n = this.notification();
    return n ? getNotificationLink(n) : [];
  });
}