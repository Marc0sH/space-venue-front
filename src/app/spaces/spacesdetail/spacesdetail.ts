import { Component, inject, input } from '@angular/core';
import { Spaceservice } from '../spaceservice';

@Component({
  imports: [],
  selector: 'app-spacesdetail',
  styleUrl: './spacesdetail.css',
  templateUrl: './spacesdetail.html',
})
export class Spacesdetail {
  readonly service = inject(Spaceservice)
  readonly id = input.required<string>();
  protected readonly space = this.service.getById(this.id);

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
}
