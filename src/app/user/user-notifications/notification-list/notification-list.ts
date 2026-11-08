import { Component, computed, inject, signal } from '@angular/core';
import { Notificationservice } from '../notificationservice';
import { NotificationCard } from '../notification-card/notification-card';
import { NotificationDetails } from '../notification-details/notification-details';
import { Notificacion } from '../../../models/notification.model';

@Component({
  imports: [NotificationCard, NotificationDetails],
  selector: 'app-notification-list',
  styleUrl: './notification-list.css',
  templateUrl: './notification-list.html',
})
export class NotificationList {
  private notiservice = inject(Notificationservice)
  protected readonly notificaciones = this.notiservice.getNotification();

  protected readonly notificacionesOrdenadas = computed(() =>
    [...(this.notificaciones.value() ?? [])]
      .sort((a, b) => b.createdAt - a.createdAt)
  );

  // Notificación abierta en el panel de la derecha
  protected readonly seleccionadaId = signal<number | null>(null);

  // Se busca en la lista (y no se guarda el objeto) para que se actualice sola
  // cuando se recarga y pasa a estar vista
  protected readonly seleccionada = computed(() =>
    this.notificacionesOrdenadas().find(n => n.idNotification === this.seleccionadaId()) ?? null
  );

  protected seleccionar(noti: Notificacion): void {
    this.seleccionadaId.set(noti.idNotification);
  }

  protected recargarNotificaciones(): void {
    this.notificaciones.reload();
  }
  markAllAsSeen(){
    for(let noti of this.notificacionesOrdenadas()){
      this.notiservice.markAsSeen(noti.idNotification)
    }
  }
}