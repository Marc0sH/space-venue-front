import { Notificacion, NotificationType } from '../../models/notification.model';

export interface NotificationLink { label: string; icon: string; route: (string | number)[]; }
export interface NotificationMeta { title: string; icon: string; }

const DEFAULT_META: NotificationMeta = { title: 'Notificación', icon: 'notifications' };

const META: Record<NotificationType, NotificationMeta> = {
  WELCOME: { title: 'Bienvenida', icon: 'waving_hand' },
  RESERVATION_CREATED: { title: 'Nueva reserva', icon: 'event' },
  RESERVATION_CONFIRMED: { title: 'Reserva confirmada', icon: 'check_circle' },
  RESERVATION_REJECTED: { title: 'Reserva rechazada', icon: 'cancel' },
  RESERVATION_CANCELLED: { title: 'Reserva cancelada', icon: 'event_busy' },
  COMMENT_DEACTIVATED: { title: 'Comentario eliminado', icon: 'speaker_notes_off' },
  COMMENT_REACTIVATED: { title: 'Comentario reactivado', icon: 'comment' },
  OFFERER_REQUEST: { title: 'Solicitud de oferente', icon: 'person_add' },
};

export function getNotificationMeta(type?: string | null): NotificationMeta {
  return META[type as NotificationType] ?? DEFAULT_META;
}

// Devuelve los botones de la notificación; el primero es el principal. Lista vacía = sin botones.
export function getNotificationLink(n: Notificacion): NotificationLink[] {
  const id = n.referenceId;
  const verReserva: NotificationLink[] = id != null
    ? [{ label: 'Ver reserva', icon: 'event', route: ['/reservas', id] }] : [];
  const verEspacio: NotificationLink[] = id != null
    ? [{ label: 'Ver espacio', icon: 'storefront', route: ['/espacios', id] }] : [];

  switch (n.type) {
    case 'WELCOME':
      return [{ label: 'Explorar espacios', icon: 'travel_explore', route: ['/espacios'] }];
    case 'RESERVATION_CREATED':
      return [...verReserva, { label: 'Reservas recibidas', icon: 'inbox', route: ['/reservas/recibidas'] }];
    case 'RESERVATION_CONFIRMED':
    case 'RESERVATION_REJECTED':
    case 'RESERVATION_CANCELLED':
      return verReserva;
    case 'COMMENT_DEACTIVATED':
    case 'COMMENT_REACTIVATED':
      return verEspacio;
    case 'OFFERER_REQUEST':
      return [{ label: 'Gestionar usuarios', icon: 'manage_accounts', route: ['/admin/usuarios'] }];
    default:
      return [];
  }
}