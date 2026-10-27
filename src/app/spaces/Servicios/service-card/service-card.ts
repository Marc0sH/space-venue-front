import { Component, input } from '@angular/core';
import { ServiceSpace } from '../../../models/service.model';

@Component({
  imports: [],
  selector: 'app-service-card',
  styleUrl: './service-card.css',
  templateUrl: './service-card.html',
})
export class ServiceCard {
    servicio = input.required<ServiceSpace>()

    
}
