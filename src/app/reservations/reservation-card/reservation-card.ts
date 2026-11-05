import { Component, inject, input } from '@angular/core';
import { ReservationComplete } from '../../models/reservation.model';
import { Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-reservation-card',
  styleUrl: './reservation-card.css',
  templateUrl: './reservation-card.html',
})
export class ReservationCard {
  private readonly router = inject(Router)
  readonly reservation = input.required<ReservationComplete>()

  onDetails(){
    this.router.navigate(['/reservas', this.reservation().id])
  }
}
