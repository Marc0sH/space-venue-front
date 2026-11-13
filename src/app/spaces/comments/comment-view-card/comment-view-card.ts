import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommentComplete } from '../../../models/comment.model';
import { Session } from '../../../auth/session/session';
import { Comment } from '../comment';
import { CommentCreation } from '../comment-creation/comment-creation';
import { Spaceservice } from '../../spaceservice';
import { Space } from '../../../models/space.model';

@Component({
  imports: [DatePipe, CommentCreation],
  selector: 'app-comment-view-card',
  styleUrl: './comment-view-card.css',
  templateUrl: './comment-view-card.html',
})
export class CommentViewCard {
  private readonly spaceService = inject(Spaceservice)
  private readonly commentService = inject(Comment)
  readonly session = inject(Session)
  comment = input.required<CommentComplete>()
  readonly deleted = output<void>()
  readonly updated = output<void>()
  readonly editing = signal(false)

  readonly spaceId = computed(() => this.comment().idSpace.toString());
  readonly space = this.spaceService.getById(this.spaceId);

  onUpdated(){
    this.editing.set(false)
    this.updated.emit()
  }

  onCancelEditing(){
    this.editing.set(false)
  }

  onDelete(){
    this.commentService.deleteComment(this.comment().idComment.toString()).subscribe({
      next: () => {
        console.log("Comentario eliminado exitosamente")
        this.deleted.emit()
      },
      error: (e) => {
        console.error("Hubo un error al eliminar el comentario")
      }
    })
  }

  onActivate(){
    this.commentService.activateComment(this.comment().idComment.toString()).subscribe({
      next: () => {
        console.log("Comentario activado exitosamente")
        this.deleted.emit()
      },
      error: (e) => {
        console.error("Hubo un error al activar el comentario")
      }
    })
  }
}
