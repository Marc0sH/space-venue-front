import { Component, inject, signal } from '@angular/core';
import { Notificationservice } from '../notificationservice';
import { NotificationCard } from '../notification-card/notification-card';

@Component({
  imports: [NotificationCard],
  selector: 'app-notification-list',
  styleUrl: './notification-list.css',
  templateUrl: './notification-list.html',
})
export class NotificationList {
  private notiservice = inject(Notificationservice)
  protected readonly notificaciones = signal(this.notiservice.getNotification())
}
