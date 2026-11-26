import { Component } from '@angular/core';
import { POLITICA_CANCELACION } from '../../models/cancellation-refund.model';

// Tabla de la política de cancelación global, para mostrar antes de reservar o pagar
@Component({
  selector: 'app-cancellation-policy',
  templateUrl: './cancellation-policy.html',
  styleUrl: './cancellation-policy.css',
})
export class CancellationPolicy {
  protected readonly filas = POLITICA_CANCELACION
}
