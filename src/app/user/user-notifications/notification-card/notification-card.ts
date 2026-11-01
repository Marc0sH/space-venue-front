import { Component, inject, input, output } from '@angular/core';
import { Notificacion } from '../../../models/notification.model';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Notificationservice } from '../notificationservice';

@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-notification-card',
  styleUrl: './notification-card.css',
  templateUrl: './notification-card.html',
})
export class NotificationCard {
  private readonly notificationService = inject(Notificationservice)

  notification = input.required<Notificacion>()

  readonly markedAsSeen = output<void>();

  /*salida = output<Notificacion>()

  private router = inject(Router)

  navigate(){
    this.salida.emit(this.notification());
    this.router.navigate(['/notificaciones', this.notification().idNotification]);
  }*/

    cambiarEstado(){
      this.notificationService.markAsSeen(this.notification().idNotification).subscribe({
        next: () => {
          console.log("Notificación marcada como vista")
          this.markedAsSeen.emit()
        },
        error: (e) => console.error("Hubo un error al marcar la notificación como vista: " + e)
      })
    }
}
