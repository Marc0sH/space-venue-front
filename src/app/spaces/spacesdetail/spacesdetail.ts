import { Component, inject, input } from '@angular/core';
import { Spaceservice } from '../spaceservice';
import { Router } from '@angular/router';
import { ReservationCreate } from '../../reservations/reservation-create/reservation-create';
import { LocationMap } from '../../common/location-map/location-map';
import { hasLocation } from '../../models/location.model';

@Component({
  imports: [LocationMap],
  selector: 'app-spacesdetail',
  styleUrl: './spacesdetail.css',
  templateUrl: './spacesdetail.html',
})
export class Spacesdetail {
  private readonly router = inject(Router)
  readonly service = inject(Spaceservice)
  readonly id = input.required<string>();
  protected readonly space = this.service.getById(this.id);
  protected readonly images = this.service.getImagesBySpaceId(this.id);
  protected readonly hasLocation = hasLocation;

  protected formatName(name: string): string {
    if (!/[ÃÂ][\u0080-\u00bf]/u.test(name)) {
      return name;
    }

    const bytes = new Uint8Array(name.length);
    for (let index = 0; index < name.length; index++) {
      const codeUnit = name.charCodeAt(index);
      if (codeUnit > 0xff) {
        return name;
      }
      bytes[index] = codeUnit;
    }

    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return name;
    }
  }

  onReserve(){
    // <app-reservation-create [idSpace]="space.value().idSpace.toString()" />
    const idSpace = this.space.value()?.idSpace;
    if (idSpace !== undefined) {
      this.router.navigate(['/reserva', idSpace]);
    }
  }
}
