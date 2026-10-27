import { Component, computed, input } from '@angular/core';
import { ServiceSpace } from '../../../models/service.model';
import { ServiceCard } from '../service-card/service-card';

@Component({
  imports: [ServiceCard],
  selector: 'app-service-list',
  styleUrl: './service-list.css',
  templateUrl: './service-list.html',
})
export class ServiceList {
  list= input.required<ServiceSpace[]>()

  filteredList = computed(()=>{
    return this.list().filter((ser) => ser.isActive)    
  })
}
