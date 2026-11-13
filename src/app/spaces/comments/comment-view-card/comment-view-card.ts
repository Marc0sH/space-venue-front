import { Component, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommentComplete } from '../../../models/comment.model';
import { Session } from '../../../auth/session/session';
import { Comment } from '../comment';

@Component({
  imports: [DatePipe],
  selector: 'app-comment-view-card',
  styleUrl: './comment-view-card.css',
  templateUrl: './comment-view-card.html',
})
export class CommentViewCard {
  private readonly commentService = inject(Comment)
  readonly session = inject(Session)
  comment = input.required<CommentComplete>()
  readonly deleted = output<void>()

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
