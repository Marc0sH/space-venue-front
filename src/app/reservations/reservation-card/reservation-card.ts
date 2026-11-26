import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationChange, ReservationComplete, etiquetaEstadoReserva } from '../../models/reservation.model';
import { CancellationRefund, textoVistaPrevia } from '../../models/cancellation-refund.model';
import { Router } from '@angular/router';
import { Session } from '../../auth/session/session';
import { Reservation } from '../reservation';
import { mensajeDeError } from '../../common/http-error';

@Component({
  imports: [],
  selector: 'app-reservation-card',
  styleUrl: './reservation-card.css',
  templateUrl: './reservation-card.html',
})
export class ReservationCard {
  private readonly router = inject(Router)
  private readonly session = inject(Session)
  private readonly reservationService = inject(Reservation)
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
