import { Component, inject, signal } from '@angular/core';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { NewSpace } from '../../models/space.model';
import { emptyLocation } from '../../models/location.model';
// import { emptyPolicies } from '../../models/cancellationpolicies.model';
import { ServiceSpace } from '../../models/service.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../spaceservice';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

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
    services: [] as ServiceSpace[]
  })
  formSpaceCreation = form(this.model, (path) => {
    required(path.nameSpace, {message: 'El nombre del espacio es obligatorio'})
    required(path.description, {message: 'La descripción del espacio es obligatoria'})
    required(path.basePrice, {message: 'El precio base es obligatorio'})
    required(path.bufferTime, {message: 'El tiempo de espera entre reservas es obligatiorio'})
    required(path.location.latitude, {message: 'La latitud es obligatoria'})
    required(path.location.longitude, {message: 'La longitud es obligatoria'})
  
    min(path.location.latitude, -90, {message: 'La latitud debe ser menor a -90'})
    max(path.location.latitude, 90, {message: 'La latitud debe ser mayor a 90'})
    min(path.location.longitude, -180, {message: 'La latitud debe ser menor a -180'})
    max(path.location.longitude, 180, {message: 'La latitud debe ser mayor a -180'})
  })

  private spaceService = inject(Spaceservice)
  private router = inject(Router)

  error = signal<string>("")

  onSubmit(event : Event){
    event.preventDefault()

    this.spaceService.createSpace(this.model()).subscribe({
      next: (res) => {
        this.error.set("")
        console.log("Usuario ingresado correctamente: " + res)
        this.router.navigate(['/espacios'])
      },
      error: (e: HttpErrorResponse) => {
        this.error.set("Error al crear un espacio: " + e.message);
        console.error('Error ' + e.status + ' al registrar usuario:', e);
      }
    })
  }
}
