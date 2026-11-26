import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Reservation } from '../reservation';
import { Spaceservice } from '../../spaces/spaceservice';
import { Space } from '../../models/space.model';
import {
  OwnerReservationFilters,
  ReservationCalendarEntry,
  ReservationComplete,
  etiquetaEstadoReserva,
} from '../../models/reservation.model';
import { ListMySpaces } from '../../spaces/list-my-spaces/list-my-spaces';

interface CalendarDay {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  status: 'FREE' | 'TENTATIVE' | 'CONFIRMED';
}

@Component({
  imports: [RouterLink, DatePipe, CurrencyPipe, ListMySpaces],
  selector: 'app-reservation-owner-list',
  styleUrl: './reservation-owner-list.css',
  templateUrl: './reservation-owner-list.html',
})
export class ReservationOwnerList {
  private readonly reservationService = inject(Reservation);
  private readonly spaceService = inject(Spaceservice);
  private readonly route = inject(ActivatedRoute);
  readonly activeTab = signal<'solicitudes' | 'espacios'>('solicitudes');

  // Si se llega desde el detalle de un espacio (?idSpace=5) el panel arranca filtrado por ese espacio.
  // Solo se acepta un número, para no mandarle cualquier cosa al back.
  private readonly initialSpaceId = (() => {
    const id = this.route.snapshot.queryParamMap.get('idSpace');
    return id && /^\d+$/.test(id) ? id : '';
  })();

  readonly filters = signal<OwnerReservationFilters>({
    idSpace: this.initialSpaceId,
    status: '',
    title: '',
    date: '',
  });
  readonly reservations = this.reservationService.getOwnerReservations(this.filters);
  readonly spaces = signal<Space[]>([]);

  readonly quickStatuses = [
    { value: '', label: 'Todas' },
    { value: 'TENTATIVE', label: 'Pendientes' },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'IN_PROGRESS', label: 'En curso' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
    { value: 'REJECTED', label: 'Rechazadas' },
  ];

  readonly processingId = signal<number | null>(null);

  // Pasamos la reserva entera para que incluya cancellationReason si está CANCELLED
  protected readonly etiqueta = (r: ReservationComplete) => etiquetaEstadoReserva(r);

  // Calendario de ocupación
  readonly calendarSpaceId = signal<string>('');
  readonly currentMonth = signal<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  readonly calendarRange = computed<{ from: string; to: string } | null>(() => {
    const id = this.calendarSpaceId();
    if (!id) return null;

    const base = this.currentMonth();
    const year = base.getFullYear();
    const month = base.getMonth();

    return {
      from: this.formatDateISO(new Date(year, month, 1)),
      to: this.formatDateISO(new Date(year, month + 1, 0)),
    };
  });

  readonly calendarEntries = this.reservationService.getCalendarOfSpace(
    this.calendarSpaceId,
    this.calendarRange
  );

  readonly monthLabel = computed(() => {
    const label = this.currentMonth().toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const base = this.currentMonth();
    const year = base.getFullYear();
    const month = base.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const entries = this.calendarEntries.value() ?? [];
    const todayStr = this.formatDateISO(new Date());
    const days: CalendarDay[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        dayNumber: prevMonthLastDay - i,
        dateStr: this.formatDateISO(d),
        isCurrentMonth: false,
        isToday: false,
        status: 'FREE',
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const current = new Date(year, month, day);
      const dateStr = this.formatDateISO(current);
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        status: this.getDateStatus(dateStr, entries),
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        dayNumber: i,
        dateStr: this.formatDateISO(d),
        isCurrentMonth: false,
        isToday: false,
        status: 'FREE',
      });
    }

    return days;
  });

  constructor() {
    this.spaceService.getSpacesByOwnerLogged().subscribe((spacesList) => {
      this.spaces.set(spacesList);
      if (spacesList.length > 0 && !this.calendarSpaceId()) {
        this.calendarSpaceId.set(String(spacesList[0].idSpace));
      }
    });

    effect(() => {
      const filteredSpace = this.filters().idSpace;
      if (filteredSpace) {
        this.calendarSpaceId.set(filteredSpace);
      }
    });
  }

  setFilter(key: keyof OwnerReservationFilters, value: string) {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  toggleDateFilter(dateStr: string) {
    const current = this.filters().date;
    this.setFilter('date', current === dateStr ? '' : dateStr);
  }

  clearFilters() {
    this.filters.set({ idSpace: '', status: '', title: '', date: '' });
  }

  prevMonth() {
    const curr = this.currentMonth();
    this.currentMonth.set(new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
  }

  nextMonth() {
    const curr = this.currentMonth();
    this.currentMonth.set(new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
  }

  confirmReservation(reservation: ReservationComplete) {
    this.processingId.set(reservation.id);
    this.reservationService.confirmReservation(String(reservation.id)).subscribe({
      next: () => {
        this.processingId.set(null);
        this.onReservationMutated();
      },
      error: () => this.processingId.set(null),
    });
  }

  rejectReservation(reservation: ReservationComplete) {
    this.processingId.set(reservation.id);
    this.reservationService.rejectReservation(String(reservation.id)).subscribe({
      next: () => {
        this.processingId.set(null);
        this.onReservationMutated();
      },
      error: () => this.processingId.set(null),
    });
  }

  onReservationMutated() {
    this.reservations.reload();
    this.calendarEntries.reload();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'badge-success';
      case 'TENTATIVE':
        return 'badge-warning';
      case 'IN_PROGRESS':
        return 'badge-info';
      case 'CANCELLED':
      case 'REJECTED':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  }

  private getDateStatus(
    dateStr: string,
    entries: ReservationCalendarEntry[]
  ): 'FREE' | 'TENTATIVE' | 'CONFIRMED' {
    let hasTentative = false;
    for (const entry of entries) {
      const start = entry.fromDate.slice(0, 10);
      const end = entry.untilDate.slice(0, 10);

      if (start && dateStr >= start && dateStr <= end) {
        if (entry.status === 'CONFIRMED' || entry.status === 'IN_PROGRESS') {
          return 'CONFIRMED';
        }
        if (entry.status === 'TENTATIVE') {
          hasTentative = true;
        }
      }
    }
    return hasTentative ? 'TENTATIVE' : 'FREE';
  }

  private formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}