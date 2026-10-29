import { Component, inject, input, output } from '@angular/core';
import { Notificacion } from '../../../models/notification.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-notification-card',
  styleUrl: './notification-card.css',
  templateUrl: './notification-card.html',
})
export class NotificationCard {
  notification = input.required<Notificacion>()
    private router = inject(Router)
    salida = output<Notificacion>()

  navigate(){
  this.salida.emit(this.notification());
  this.router.navigate(['/notificaciones', this.notification().idNotification]);
  }
}
