import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationChange, ReservationComplete, etiquetaEstadoReserva } from '../../models/reservation.model';
import { CancellationRefund, textoVistaPrevia } from '../../models/cancellation-refund.model';
import { Router, RouterLink } from '@angular/router';
import { Session } from '../../auth/session/session';
import { Reservation } from '../reservation';
import { mensajeDeError } from '../../common/http-error';
import { Spaceservice } from '../../spaces/spaceservice';

@Component({
  imports: [RouterLink],
  selector: 'app-reservation-card',
  styleUrl: './reservation-card.css',
  templateUrl: './reservation-card.html',
})
export class ReservationCard {
  private readonly router = inject(Router)
  private readonly session = inject(Session)
  private readonly reservationService = inject(Reservation)
  protected readonly spaceService = inject(Spaceservice)
  readonly reservation = input.required<ReservationComplete>()
  //El back devuelve la reserva actualizada: se emite el estado y, si se canceló, el motivo y el reembolso
  readonly statusChange = output<ReservationChange>()
  protected readonly etiquetaEstado = etiquetaEstadoReserva
  protected readonly isUpdating = signal(false)
  protected readonly actionError = signal('')

  protected readonly esDuenio = computed(() => {
    const s = this.reservation().space
    const idLogueado = this.session.session()?.consumerId;
    return !!s && idLogueado != null && s.consumerOwner?.idConsumer === idLogueado && !s.deletedByOwner;
  });

  // ---- Foto del espacio (primera imagen, igual que en la tarjeta de espacios) ----
  private readonly images = this.spaceService.getImagesBySpaceId(
    computed(() => String(this.reservation().space.idSpace))
  )
  protected readonly firstImage = computed(() => {
    const lista = this.images.hasValue() ? this.images.value() : undefined
    return lista && lista.length > 0 ? lista[0] : null
  })

  // ---- Formato de fecha, horario y montos ----
  private static readonly fechaFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  private static readonly fechaCortaFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
  private static readonly horaFmt = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  private static readonly montoFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 })

  //Ej: "Sábado, 14 nov 2026"
  protected readonly fecha = computed(() => {
    const texto = ReservationCard.fechaFmt.format(new Date(this.reservation().fromDate))
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  })

  //Ej: "15:00 a 21:00 (6 hs)"; si termina otro día: "22:00 a 2 nov, 02:00 (4 hs)"
  protected readonly horario = computed(() => {
    const r = this.reservation()
    const desde = new Date(r.fromDate)
    const hasta = new Date(r.untilDate)
    const hora = (d: Date) => ReservationCard.horaFmt.format(d)
    const mismoDia = desde.toDateString() === hasta.toDateString()
    const fin = mismoDia ? hora(hasta) : `${ReservationCard.fechaCortaFmt.format(hasta)}, ${hora(hasta)}`
    return `${hora(desde)} a ${fin} (${this.duracion(desde, hasta)})`
  })

  private duracion(desde: Date, hasta: Date): string {
    const min = Math.max(0, Math.round((hasta.getTime() - desde.getTime()) / 60000))
    const h = Math.floor(min / 60)
    const m = min % 60
    if (!h) return `${m} min`
    if (m) return `${h} h ${m} min`
    return h === 1 ? '1 h' : `${h} hs`
  }

  protected monto(valor: number | null | undefined): string {
    return ReservationCard.montoFmt.format(valor ?? 0)
  }

  protected readonly etiquetaPrecio = computed(() => {
    const r = this.reservation()
    if (r.paid) return 'Total abonado'
    if (r.status === 'TENTATIVE') return 'Presupuesto estimado'
    return 'Precio total'
  })

  //Reserva cancelada estando pagada: tiene guardado el resultado de la política de cancelación
  protected readonly reembolso = computed(() => {
    const r = this.reservation()
    return r.status === 'CANCELLED' && r.refundPercentage != null ? r : null
  })

  //Si no hay ninguna acción para mostrar en esta reserva, no se dibuja el pie de la card
  protected readonly hayAcciones = computed(() => {
    const status = this.reservation().status
    switch (status) {
      case 'TENTATIVE':
      case 'CONFIRMED':
        return true
      case 'COMPLETED':
      case 'CANCELLED':
      case 'REJECTED':
        return !this.esDuenio() //"Volver a reservar" no tiene sentido para el dueño
      default:
        return false
    }
  })

  // Confirmación de cancelación: antes de cancelar se muestra cuánto se reintegra
  private readonly cancelDialog = viewChild.required<ElementRef<HTMLDialogElement>>('cancelDialog')
  protected readonly preview = signal<CancellationRefund | null>(null)
  protected readonly previewLoading = signal(false)
  protected readonly previewError = signal('')
  protected readonly textoPreview = computed(() => {
    const p = this.preview()
    return p ? textoVistaPrevia(p) : ''
  })

  onReject(){
    this.updateStatus('REJECTED', id => this.reservationService.rejectReservation(id))
  }

  onAccept(){
    this.updateStatus('CONFIRMED', id => this.reservationService.confirmReservation(id))
  }

  openCancelConfirmation(){
    if (this.isUpdating()) return
    this.preview.set(null)
    this.previewError.set('')
    this.actionError.set('')
    this.previewLoading.set(true)
    this.cancelDialog().nativeElement.showModal()
    this.reservationService.getCancellationPreview(this.reservation().id.toString()).subscribe({
      next: (p) => {
        this.preview.set(p)
        this.previewLoading.set(false)
      },
      error: (error: unknown) => {
        this.previewError.set(mensajeDeError(error, 'No se pudo calcular el reembolso'))
        this.previewLoading.set(false)
      }
    })
  }

  closeCancelConfirmation(){
    if (this.isUpdating()) return
    this.cancelDialog().nativeElement.close()
  }

  // Cierra el pop-up al hacer clic en el fondo oscuro (fuera del contenido)
  onCancelDialogClick(event: MouseEvent){
    if (event.target === this.cancelDialog().nativeElement) {
      this.closeCancelConfirmation()
    }
  }

  onCancel(){
    this.updateStatus('CANCELLED', id => this.reservationService.cancelReservation(id),
      () => this.cancelDialog().nativeElement.close())
  }

  private updateStatus(
    status: ReservationComplete['status'],
    action: (id: string) => Observable<unknown>,
    onSuccess?: () => void
  ): void {
    if (this.isUpdating()) return

    this.isUpdating.set(true)
    this.actionError.set('')
    action(this.reservation().id.toString()).subscribe({
      next: (res) => {
        const actualizada = res as Partial<ReservationComplete> | null
        this.isUpdating.set(false)
        onSuccess?.()
        this.statusChange.emit({
          status: actualizada?.status ?? status,
          cancellationReason: actualizada?.cancellationReason ?? null,
          refundPercentage: actualizada?.refundPercentage ?? null,
          refundAmount: actualizada?.refundAmount ?? null,
          refundPending: actualizada?.refundPending ?? null,
        })
      },
      error: (error: unknown) => {
        console.error('No se pudo actualizar la reserva:', error)
        this.actionError.set(mensajeDeError(error, 'No se pudo actualizar la reserva'))
        this.isUpdating.set(false)
      }
    })
  }

  onDetails(){
    this.router.navigate(['/reservas', this.reservation().id])
  }
}