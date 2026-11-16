import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reservation } from '../../reservations/reservation';
import { ReservationCalendarEntry } from '../../models/reservation.model';

interface CalendarDay {
  key: string;          // yyyy-MM-dd
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  entries: ReservationCalendarEntry[];
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
  'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const STATUS_LABELS: Record<ReservationCalendarEntry['status'], string> = {
  TENTATIVE: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Finalizada',
};

//Fecha local en formato yyyy-MM-dd (sin pasar por UTC, para no correr el día)
function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

@Component({
  selector: 'app-space-calendar',
  imports: [RouterLink],
  templateUrl: './space-calendar.html',
  styleUrl: './space-calendar.css',
})
export class SpaceCalendar {
  private readonly reservationService = inject(Reservation);

  readonly idSpace = input.required<string>();

  protected readonly weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  protected readonly statusLabels = STATUS_LABELS;

  //Primer día del mes que se está mostrando
  protected readonly month = signal(this.firstOfMonth(new Date()));
  protected readonly selectedKey = signal<string | null>(null);

  protected readonly monthLabel = computed(() =>
    `${MONTHS[this.month().getMonth()]} ${this.month().getFullYear()}`);

  //La grilla siempre son 6 semanas (42 días) empezando en lunes,
  //incluyendo los días de relleno del mes anterior y el siguiente.
  private readonly gridStart = computed(() => {
    const first = this.month();
    const offset = (first.getDay() + 6) % 7; //getDay(): 0 = domingo
    return addDays(first, -offset);
  });

  private readonly range = computed(() => ({
    from: toKey(this.gridStart()),
    to: toKey(addDays(this.gridStart(), 41)),
  }));

  protected readonly reservations = this.reservationService.getCalendarOfSpace(this.idSpace, this.range);

  //Reservas agrupadas por día. Una reserva que cruza la medianoche aparece en cada día que ocupa.
  private readonly entriesByDay = computed(() => {
    const map = new Map<string, ReservationCalendarEntry[]>();
    const list = this.reservations.hasValue() ? this.reservations.value() : [];
    for (const entry of list) {
      const start = new Date(entry.fromDate);
      //Restar 1 ms hace que una reserva que termina justo a las 00:00 no ocupe el día siguiente
      const end = new Date(new Date(entry.untilDate).getTime() - 1);
      for (let day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
           day <= end;
           day = addDays(day, 1)) {
        const key = toKey(day);
        const dayList = map.get(key);
        if (dayList) dayList.push(entry);
        else map.set(key, [entry]);
      }
    }
    //El back ya las devuelve ordenadas, pero se asegura el orden cronológico por día
    for (const dayList of map.values()) {
      dayList.sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime());
    }
    return map;
  });

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const start = this.gridStart();
    const month = this.month().getMonth();
    const todayKey = toKey(new Date());
    const byDay = this.entriesByDay();
    const weeks: CalendarDay[][] = [];
    for (let w = 0; w < 6; w++) {
      const week: CalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = toKey(date);
        week.push({
          key,
          date,
          inMonth: date.getMonth() === month,
          isToday: key === todayKey,
          isPast: key < todayKey,
          entries: byDay.get(key) ?? [],
        });
      }
      weeks.push(week);
    }
    return weeks;
  });

  protected readonly selectedDay = computed(() => {
    const key = this.selectedKey();
    if (!key) return null;
    const [y, m, d] = key.split('-').map(Number);
    return { key, date: new Date(y, m - 1, d), entries: this.entriesByDay().get(key) ?? [] };
  });

  protected previousMonth(): void {
    this.changeMonth(-1);
  }

  protected nextMonth(): void {
    this.changeMonth(1);
  }

  protected goToToday(): void {
    this.month.set(this.firstOfMonth(new Date()));
    this.selectedKey.set(toKey(new Date()));
  }

  protected selectDay(day: CalendarDay): void {
    if (this.selectedKey() === day.key) {
      this.selectedKey.set(null);
      return;
    }
    //Al tocar un día de relleno se navega a ese mes
    if (!day.inMonth) {
      this.month.set(this.firstOfMonth(day.date));
    }
    this.selectedKey.set(day.key);
  }

  protected closeDetail(): void {
    this.selectedKey.set(null);
  }

  protected formatTime(value: string): string {
    const date = new Date(value);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  //Hora de inicio/fin dentro del día mostrado; si la reserva viene de otro día o sigue en otro, se aclara la fecha
  protected formatRange(entry: ReservationCalendarEntry, dayKey: string): string {
    const from = new Date(entry.fromDate);
    const until = new Date(entry.untilDate);
    const fromText = toKey(from) === dayKey ? this.formatTime(entry.fromDate) : `${this.shortDate(from)} ${this.formatTime(entry.fromDate)}`;
    const untilText = toKey(until) === dayKey ? this.formatTime(entry.untilDate) : `${this.shortDate(until)} ${this.formatTime(entry.untilDate)}`;
    return `${fromText} – ${untilText}`;
  }

  protected longDate(date: Date): string {
    const weekDay = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    return `${weekDay} ${date.getDate()} de ${MONTHS[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`;
  }

  protected dayAriaLabel(day: CalendarDay): string {
    const count = day.entries.length;
    const detail = count === 0 ? 'sin reservas' : count === 1 ? '1 reserva' : `${count} reservas`;
    return `${this.longDate(day.date)}, ${detail}`;
  }

  private shortDate(date: Date): string {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private changeMonth(delta: number): void {
    const current = this.month();
    this.month.set(new Date(current.getFullYear(), current.getMonth() + delta, 1));
    this.selectedKey.set(null);
  }

  private firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}
