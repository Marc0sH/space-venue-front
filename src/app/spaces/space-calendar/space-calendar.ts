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
  //Recesos que empiezan en un día anterior (la reserva terminó cerca de la medianoche)
  carriedBuffers: BufferBlock[];
}

//Tiempo de receso después de una reserva, en el que el espacio sigue sin estar disponible
interface BufferBlock {
  from: Date;
  until: Date;
  entry: ReservationCalendarEntry;
}

type DayItem =
  | { kind: 'reservation'; start: number; entry: ReservationCalendarEntry }
  | { kind: 'buffer'; start: number; block: BufferBlock };

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
  //Minutos de receso entre reservas configurados en el espacio
  readonly bufferTime = input<number>(0);

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

  //Bloques de receso agrupados por día. Si el receso cruza la medianoche aparece también en el día siguiente.
  private readonly buffersByDay = computed(() => {
    const map = new Map<string, BufferBlock[]>();
    const minutes = this.bufferTime();
    if (!minutes || minutes <= 0) return map;
    const list = this.reservations.hasValue() ? this.reservations.value() : [];
    for (const entry of list) {
      const from = new Date(entry.untilDate);
      const until = new Date(from.getTime() + minutes * 60_000);
      const block: BufferBlock = { from, until, entry };
      const last = new Date(until.getTime() - 1);
      for (let day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
           day <= last;
           day = addDays(day, 1)) {
        const key = toKey(day);
        const dayList = map.get(key);
        if (dayList) dayList.push(block);
        else map.set(key, [block]);
      }
    }
    return map;
  });

  protected readonly bufferLabel = computed(() => this.formatDuration(this.bufferTime()));

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const start = this.gridStart();
    const month = this.month().getMonth();
    const todayKey = toKey(new Date());
    const byDay = this.entriesByDay();
    const buffers = this.buffersByDay();
    const weeks: CalendarDay[][] = [];
    for (let w = 0; w < 6; w++) {
      const week: CalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        const key = toKey(date);
        const entries = byDay.get(key) ?? [];
        week.push({
          key,
          date,
          inMonth: date.getMonth() === month,
          isToday: key === todayKey,
          isPast: key < todayKey,
          entries,
          carriedBuffers: (buffers.get(key) ?? []).filter(b => !entries.includes(b.entry)),
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
    const entries = this.entriesByDay().get(key) ?? [];
    //Reservas y recesos intercalados en orden cronológico
    const items: DayItem[] = [
      ...entries.map(entry => ({ kind: 'reservation' as const, start: new Date(entry.fromDate).getTime(), entry })),
      ...(this.buffersByDay().get(key) ?? []).map(block => ({ kind: 'buffer' as const, start: block.from.getTime(), block })),
    ].sort((a, b) => a.start - b.start);
    return { key, date: new Date(y, m - 1, d), entries, items };
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

  protected formatTime(value: string | Date): string {
    const date = new Date(value);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  //Hora de inicio/fin dentro del día mostrado; si la reserva viene de otro día o sigue en otro, se aclara la fecha
  protected formatRange(entry: ReservationCalendarEntry, dayKey: string): string {
    return this.formatSpan(new Date(entry.fromDate), new Date(entry.untilDate), dayKey);
  }

  protected formatSpan(from: Date, until: Date, dayKey: string): string {
    const fromText = toKey(from) === dayKey ? this.formatTime(from) : `${this.shortDate(from)} ${this.formatTime(from)}`;
    const untilText = toKey(until) === dayKey ? this.formatTime(until) : `${this.shortDate(until)} ${this.formatTime(until)}`;
    return `${fromText} – ${untilText}`;
  }

  //Tooltip de la pastilla de la celda: horario completo y hasta cuándo dura el receso
  protected pillTitle(entry: ReservationCalendarEntry): string {
    const range = `${this.formatTime(entry.fromDate)} – ${this.formatTime(entry.untilDate)}`;
    const minutes = this.bufferTime();
    if (!minutes || minutes <= 0) return range;
    const freeAt = new Date(new Date(entry.untilDate).getTime() + minutes * 60_000);
    return `${range} · Receso hasta ${this.formatTime(freeAt)}`;
  }

  //Texto para la celda: hasta qué hora no está disponible el espacio por el receso
  protected bufferPillText(block: BufferBlock): string {
    return `Receso hasta ${this.formatTime(block.until)}`;
  }

  protected formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
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
