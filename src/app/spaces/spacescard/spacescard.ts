import { Component, inject, input, output } from '@angular/core';
import { required } from '@angular/forms/signals';
import { space } from '../../models/space.model';
import { Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-spacescard',
  styleUrl: './spacescard.css',
  templateUrl: './spacescard.html',
})
export class Spacescard {
  space = input.required<space>()
  private router = inject(Router)
  salida = output<space>()

  navigate(){
    if(this.space().isActive){
  this.salida.emit(this.space());
  this.router.navigate(['/espacios', this.space().idSpace]);
    }  
  }
}
