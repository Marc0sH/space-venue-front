import { Component, inject, input, output } from '@angular/core';
import { Space } from '../../models/space.model';
import { Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-spacescard',
  styleUrl: './spacescard.css',
  templateUrl: './spacescard.html',
})
export class Spacescard {
  space = input.required<Space>()
  private router = inject(Router)
  salida = output<Space>()

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

  navigate(){  
    this.salida.emit(this.space());
    this.router.navigate(['/espacios', this.space().idSpace]);
  }
}
