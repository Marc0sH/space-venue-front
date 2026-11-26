import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Reservation } from '../reservation';
import { HttpErrorResponse } from '@angular/common/http';
import { ReservationChange, ReservationComplete } from '../../models/reservation.model';
import { ReservationCard } from '../reservation-card/reservation-card';
import { Observable } from 'rxjs';
import { mensajeDeError } from '../../common/http-error';

type ReservationSort = 'recent' | 'upcoming' | 'price-high';

interface MyReservationsFilters {
  text: string;
  status: string;
  idSpace: string;
  date: string; // yyyy-MM-dd
  sort: ReservationSort;
}

@Component({
  imports: [ReservationCard],
  selector: 'app-reservation-list',
  styleUrl: './reservation-list.css',
  templateUrl: './reservation-list.html',
})
export class ReservationList {
  private readonly reservationService = inject(Reservation)
  private reservationsResource = new Observable<ReservationComplete[]>()
  readonly idSpace = input<string>()
  readonly reservations = signal<ReservationComplete[]>([] as ReservationComplete[])

  isLoading = signal(true)
  error = signal('')

  //Pestañas de estado (mismos valores que usa el panel del oferente; '' = todas)
  protected readonly quickStatuses = [
    { value: '', label: 'Todas' },
    { value: 'TENTATIVE', label: 'Pendientes' },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'IN_PROGRESS', label: 'En curso' },
    { value: 'COMPLETED', label: 'Completadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
    { value: 'REJECTED', label: 'Rechazadas' },
  ]

  //La lista completa ya viene cargada del back, así que los filtros se aplican acá, sin pedir nada de nuevo
  protected readonly filters = signal<MyReservationsFilters>({ text: '', status: '', idSpace: '', date: '', sort: 'recent' })

  protected readonly hayFiltros = computed(() => {
    const f = this.filters()
    return !!(f.text.trim() || f.status || f.idSpace || f.date)
  })

  //Cantidad de reservas por estado (sin tener en cuenta los otros filtros); la clave '' es el total
  protected readonly counts = computed(() => {
    const c: Record<string, number> = { '': this.reservations().length }
    for (const r of this.reservations()) c[r.status] = (c[r.status] ?? 0) + 1
    return c
  })

  //Espacios que aparecen en las reservas, para el selector
  protected readonly spaceOptions = computed(() => {
    const porId = new Map<number, string>()
    for (const r of this.reservations()) porId.set(r.space.idSpace, r.space.nameSpace)
    return [...porId]
      .map(([id, name]) => ({ id: String(id), name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  })

  protected readonly visibleReservations = computed(() => {
    const f = this.filters()
    const text = f.text.trim().toLowerCase()
    const filtradas = this.reservations().filter(r => {
      if (f.status && r.status !== f.status) return false
      if (f.idSpace && String(r.space.idSpace) !== f.idSpace) return false
      if (f.date && !this.tocaElDia(r, f.date)) return false
      if (text) {
        const texto = `${r.title} ${r.space.nameSpace} #${r.id} ${r.id}`.toLowerCase()
        if (!texto.includes(text)) return false
      }
      return true
    })
    return this.ordenar(filtradas, f.sort)
  })

  protected setFilter<K extends keyof MyReservationsFilters>(key: K, value: MyReservationsFilters[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }))
  }

  //Limpiar no toca el orden elegido
  protected clearFilters(): void {
    this.filters.update(f => ({ ...f, text: '', status: '', idSpace: '', date: '' }))
  }

  //La reserva ocupa algún momento del día elegido (yyyy-MM-dd)
  private tocaElDia(r: ReservationComplete, fecha: string): boolean {
    const inicioDia = new Date(`${fecha}T00:00:00`).getTime()
    const finDia = inicioDia + 24 * 60 * 60 * 1000
    return new Date(r.fromDate).getTime() < finDia && new Date(r.untilDate).getTime() > inicioDia
  }

  private ordenar(lista: ReservationComplete[], orden: ReservationSort): ReservationComplete[] {
    const copia = [...lista]
    switch (orden) {
      case 'price-high':
        return copia.sort((a, b) => b.finalPrice - a.finalPrice)
      case 'upcoming': {
        //Primero las que todavía no terminaron (la más próxima arriba) y después las pasadas (la más reciente primero)
        const ahora = Date.now()
        const vigentes = copia.filter(r => new Date(r.untilDate).getTime() >= ahora)
          .sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime())
        const pasadas = copia.filter(r => new Date(r.untilDate).getTime() < ahora)
          .sort((a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime())
        return [...vigentes, ...pasadas]
      }
      default: //'recent': las últimas que se hicieron primero (los ids crecen con el tiempo)
        return copia.sort((a, b) => b.id - a.id)
    }
  }

  protected onStatusChange(id: number, cambio: ReservationChange): void {
    this.reservations.update(reservations =>
      reservations.map(reservation =>
        reservation.id === id ? { ...reservation, ...cambio } : reservation
      )
    )
  }

  constructor() {
    effect(() => {
      if(this.idSpace() === undefined){
        this.reservationsResource = this.reservationService.getReservationsOfLoggedUser()

        this.reservationsResource.subscribe({
          next: (res) => {
            this.reservations.set(res)
            this.isLoading.set(false)
            this.error.set('')
            console.log("Reservas obtenidas: " + res)
          },
          error: (e : HttpErrorResponse) => {
            this.isLoading.set(false)
            this.error.set(mensajeDeError(e, 'No se pudieron cargar las reservas'))
            console.error("Hubo un error al cargar las reservas: " + e.error)
          }
        })
      } else {
        const idSpace = this.idSpace() ?? ''
        this.reservationsResource = this.reservationService.getReservationsOfAnSpace(idSpace)

        this.reservationsResource.subscribe({
          next: (res) => {
            this.reservations.set(res)
            this.isLoading.set(false)
            this.error.set('')
            console.log("Reservas obtenidas: " + res) 
          },
          error: (e : HttpErrorResponse) => {
            this.isLoading.set(false)
            this.error.set(mensajeDeError(e, 'No se pudieron cargar las reservas'))
            console.error("Hubo un error al cargar las reservas: " + e.error)
          }
        })
      }
    })
  }
}