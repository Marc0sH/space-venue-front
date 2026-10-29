import { Component, output, signal } from '@angular/core';
import { ServiceReg } from '../../../models/service.model';
import { form, FormField, required } from '@angular/forms/signals';
import { FormErrorMessage } from '../../../common/form-error-message/form-error-message';

@Component({
  imports: [FormField, FormErrorMessage],
  selector: 'app-service-creation',
  styleUrl: './service-creation.css',
  templateUrl: './service-creation.html',
})
export class ServiceCreation {
  serviceModel = signal<ServiceReg>({description: '', price: 0, isActive: true})
  serviceForm = form(this.serviceModel, (path) => {
    required(path.description, {message: 'La descripción es obligatoria'})
    required(path.price, {message: 'El precio es obligatorio'})
  })

  dataEntry = output<ServiceReg>()

  updateDescription(value: string){
    this.serviceModel.update((current) => ({
      ...current, description: value
    }))
  }
  
  updatePrice(value: number){
    this.serviceModel.update((current) => ({
      ...current, price: Number(value) || 0
    }))
  }

  onSubmit(event : Event){
    event.preventDefault()

    if (this.serviceForm().invalid()) {
      return;
    }

    const servicio: ServiceReg = {
      ...this.serviceModel(),
      price: Number(this.serviceModel().price) || 0,
    };

    this.dataEntry.emit(servicio)
  }
}
