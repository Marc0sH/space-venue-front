import { Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommentComplete } from '../../../models/comment.model';
import { Session } from '../../../auth/session/session';
import { Comment } from '../comment';
import { CommentCreation } from '../comment-creation/comment-creation';

@Component({
  imports: [DatePipe, CommentCreation],
  selector: 'app-comment-view-card',
  styleUrl: './comment-view-card.css',
  templateUrl: './comment-view-card.html',
})
export class CommentViewCard {
  private readonly commentService = inject(Comment)
  readonly session = inject(Session)
  comment = input.required<CommentComplete>()
  readonly deleted = output<void>()
  readonly updated = output<void>()
  readonly editing = signal(false)

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
}
