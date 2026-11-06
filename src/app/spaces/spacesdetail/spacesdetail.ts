import { Component, inject, input, signal } from '@angular/core';
import { Spaceservice } from '../spaceservice';
import { LocationMap } from '../../common/location-map/location-map';
import { hasLocation } from '../../models/location.model';

@Component({
  imports: [LocationMap],
  selector: 'app-spacesdetail',
  styleUrl: './spacesdetail.css',
  templateUrl: './spacesdetail.html',
})
export class Spacesdetail {
  readonly service = inject(Spaceservice)
  readonly id = input.required<string>();
  protected readonly space = this.service.getById(this.id);
  protected readonly images = this.service.getImagesBySpaceId(this.id);
  protected readonly currentImageIndex = signal(0);
  protected readonly hasLocation = hasLocation;

  protected showPreviousImage(): void {
    this.moveImage(-1);
  }

  protected showNextImage(): void {
    this.moveImage(1);
  }

  private moveImage(direction: number): void {
    const imageCount = this.images.value()?.length ?? 0;
    if (imageCount > 1) {
      this.currentImageIndex.update(index => Math.max(0, Math.min(index + direction, imageCount - 1)));
    }
  }

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
