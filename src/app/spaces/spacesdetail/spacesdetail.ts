import { Component, computed, inject, input, signal } from '@angular/core';
import { Spaceservice } from '../spaceservice';
import { Router, RouterLink } from '@angular/router';
import { Session } from '../../auth/session/session';
import { ReservationCreate } from '../../reservations/reservation-create/reservation-create';
import { LocationMap } from '../../common/location-map/location-map';
import { hasLocation } from '../../models/location.model';
import { Comment } from '../comments/comment';
import { CommentCreation } from '../comments/comment-creation/comment-creation';
import { CommentsList } from '../comments/comments-list/comments-list';

@Component({
  imports: [LocationMap, RouterLink, CommentCreation, CommentsList],
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
  protected readonly currentImageIndex = signal(0);
  protected readonly hasLocation = hasLocation;
  private readonly session = inject(Session);
  private readonly commentService = inject(Comment)

  readonly hasComment = this.commentService.hasCommentOnSpace(this.id);
  readonly canComment = this.commentService.canCommentOnSpace(this.id);

  readonly haveToComment = computed(() => {
    if (!this.hasComment.hasValue() || !this.canComment.hasValue()) {
      return false;
    }

    return !this.hasComment.value() && this.canComment.value();
  });

  //Solo el dueño puede editar, y no si ya eliminó el espacio. Además tiene que poder gestionar espacios (ADMIN u OFFERER)
  protected readonly esDuenio = computed(() => {
    const s = this.space.hasValue() ? this.space.value() : undefined;
    const idLogueado = this.session.session()?.consumerId;
    return !!s && idLogueado != null && s.consumerOwner?.idConsumer === idLogueado && !s.deletedByOwner && this.session.puedePublicar();
  });

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

  onReserve(){
    const idSpace = this.space.value()?.idSpace;
    if (idSpace !== undefined) {
      this.router.navigate(['/reserva', idSpace]);
    }
  }

  navToReservations(){
    this.router.navigate(['/reservas/byspace', this.space.value()?.idSpace])
  }
}
