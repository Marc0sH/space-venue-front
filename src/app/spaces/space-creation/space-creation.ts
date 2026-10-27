import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { newSpace } from '../../models/space.model';
import { emptyLocation } from '../../models/location.model';
import { emptyPolicies } from '../../models/cancellationpolicies.model';
import { service } from '../../models/service.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';

@Component({
  imports: [FormField, FormErrorMessage],
  selector: 'app-space-creation',
  styleUrl: './space-creation.css',
  templateUrl: './space-creation.html',
})
export class SpaceCreation {
  model = signal<newSpace>({
    location: emptyLocation(), 
    cancellationPolicies: 'FLEXIBLE', 
    nameSpace:'', 
    description:'', 
    basePrice:0, 
    bufferTime:0, 
    services: [] as service[]
  })
  formSpaceCreation = form(this.model, (path) => {

  })

  onSubmit(event : Event){
    event.preventDefault()
  }
}
