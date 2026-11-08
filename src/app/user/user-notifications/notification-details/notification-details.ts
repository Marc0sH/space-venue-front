import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Notificacion } from '../../../models/notification.model';

@Component({
  imports: [DatePipe],
  selector: 'app-notification-details',
  styleUrl: './notification-details.css',
  templateUrl: './notification-details.html',
})
export class NotificationDetails {
  // Notificación a mostrar (null = no hay ninguna seleccionada)
  notification = input<Notificacion | null>(null);

  // Para el botón "Atrás" en celular
  readonly volver = output<void>();
}