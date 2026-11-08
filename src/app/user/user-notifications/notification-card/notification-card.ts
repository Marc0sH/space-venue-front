import { Component, inject, input, output } from '@angular/core';
import { Notificacion } from '../../../models/notification.model';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Notificationservice } from '../notificationservice';

@Component({
  imports: [DatePipe],
  selector: 'app-notification-card',
  styleUrl: './notification-card.css',
  templateUrl: './notification-card.html',
})
export class NotificationCard {
  private readonly notificationService = inject(Notificationservice)

  notification = input.required<Notificacion>()

  // Para resaltar la tarjeta que está abierta en el detalle
  selected = input(false)

  // Avisa a la lista que se hizo clic para mostrar el detalle
  readonly abrir = output<Notificacion>();

  readonly markedAsSeen = output<void>();

  /*salida = output<Notificacion>()

  private router = inject(Router)

  navigate(){
    this.salida.emit(this.notification());
    this.router.navigate(['/notificaciones', this.notification().idNotification]);
  }*/

    cambiarEstado(){
      this.abrir.emit(this.notification())

      // Si ya estaba vista no hace falta volver a avisarle al back
      if (this.notification().isSeen) return

      this.notificationService.markAsSeen(this.notification().idNotification).subscribe({
        next: () => {
          console.log("Notificación marcada como vista")
          this.markedAsSeen.emit()
        },
        error: (e) => console.error("Hubo un error al marcar la notificación como vista: " + e)
      })
    }
}