import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
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

  // Pop-up de confirmación antes de eliminar/desactivar el comentario
  private readonly confirmDialog = viewChild.required<ElementRef<HTMLDialogElement>>('confirmDialog')
  readonly deleting = signal(false)
  readonly deleteError = signal('')

  openDeleteConfirmation(){
    this.deleteError.set('')
    this.confirmDialog().nativeElement.showModal()
  }

  closeDeleteConfirmation(){
    if (this.deleting()) return
    this.confirmDialog().nativeElement.close()
  }

  // Cierra el pop-up al hacer clic en el fondo oscuro (fuera del contenido)
  onDialogClick(event: MouseEvent){
    if (event.target === this.confirmDialog().nativeElement) {
      this.closeDeleteConfirmation()
    }
  }

  onDelete(){
    this.deleting.set(true)
    this.deleteError.set('')
    this.commentService.deleteComment(this.comment().idComment.toString()).subscribe({
      next: () => {
        this.deleting.set(false)
        this.confirmDialog().nativeElement.close()
        this.deleted.emit()
      },
      error: () => {
        this.deleting.set(false)
        this.deleteError.set('No se pudo eliminar el comentario. Intentá de nuevo.')
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
