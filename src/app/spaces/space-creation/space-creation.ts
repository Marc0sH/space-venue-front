import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NewSpace } from '../../models/space.model';
import { emptyLocation } from '../../models/location.model';
// import { emptyPolicies } from '../../models/cancellationpolicies.model';
import { Service } from '../../models/service.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../spaceservice';

@Component({
  imports: [FormField, FormErrorMessage],
  selector: 'app-space-creation',
  styleUrl: './space-creation.css',
  templateUrl: './space-creation.html',
})
export class SpaceCreation {
  model = signal<NewSpace>({
    location: emptyLocation(), 
    cancellationPolicies: 'FLEXIBLE', 
    nameSpace:'', 
    description:'', 
    basePrice:0, 
    bufferTime:0, 
    services: [] as Service[]
  })
  formSpaceCreation = form(this.model, (path) => {
    required(path.nameSpace, {message: 'El nombre del espacio es obligatorio'})
    required(path.description, {message: 'La descripción del espacio es obligatoria'})
    required(path.basePrice, {message: 'El precio base es obligatorio'})
    required(path.bufferTime, {message: 'El tiempo de espera entre reservas es obligatiorio'})
    required(path.location.latitude, {message: 'La latitud es obligatoria'})
    required(path.location.longitude, {message: 'La longitud es obligatoria'})
  })

  private spaceService = inject(Spaceservice)

  onSubmit(event : Event){
    event.preventDefault()

    this.spaceService.createSpace(this.model()).subscribe({
      next: () => console.log("Salio bien"),
      error: (e) => console.error("Hay un error: " + e)
    })
  }
}
