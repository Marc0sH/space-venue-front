import { Component } from '@angular/core';
import { POLITICA_CANCELACION } from '../models/cancellation-refund.model';

// Pantalla pública con la política de cancelación (enlazada desde el footer)
@Component({
  selector: 'app-cancellation-policy-page',
  templateUrl: './cancellation-policy-page.html',
  styleUrl: './cancellation-policy-page.css',
})
export class CancellationPolicyPage {
  protected readonly filas = POLITICA_CANCELACION
}
