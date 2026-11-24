import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommentComplete } from '../../../models/comment.model';
import { Session } from '../../../auth/session/session';
import { Comment } from '../comment';
import { CommentCreation } from '../comment-creation/comment-creation';
import { Spaceservice } from '../../spaceservice';
import { Space } from '../../../models/space.model';

@Component({
  imports: [DatePipe, CommentCreation, RouterLink],
  selector: 'app-comment-view-card',
  styleUrl: './comment-view-card.css',
  templateUrl: './comment-view-card.html',
})
export class CommentViewCard {
  private readonly spaceService = inject(Spaceservice)
  private readonly commentService = inject(Comment)
  readonly session = inject(Session)
  comment = input.required<CommentComplete>()
  // Si es true, el admin ve el nombre del espacio como enlace a su detalle (usado en el perfil del usuario)
  readonly showSpace = input(false)
  readonly deleted = output<void>()
  readonly updated = output<void>()
  readonly editing = signal(false)
  private readonly commentCreation = viewChild(CommentCreation)

  readonly spaceId = computed(() => this.comment().idSpace.toString());
  // Los comentarios que eliminó el propio autor no se pueden reactivar (solo los desactivados por un admin)
  readonly eliminadoPorAutor = computed(() => !this.comment().isActive && this.comment().deactivationReason === 'AUTHOR_REQUEST');
  // Solo se pide el espacio cuando se va a mostrar su nombre
  readonly space = this.spaceService.getById(
    computed(() => this.showSpace() && this.session.isAdmin() ? this.spaceId() : undefined)
  );

  hasUnsavedChanges(): boolean {
    return this.editing() && (this.commentCreation()?.hasUnsavedChanges() ?? false);
  }

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

  // Pop-up de confirmación antes de que el admin reactive un comentario que había desactivado
  private readonly activateDialog = viewChild.required<ElementRef<HTMLDialogElement>>('activateDialog')
  readonly activating = signal(false)
  readonly activateError = signal('')

  openActivateConfirmation(){
    this.activateError.set('')
    this.activateDialog().nativeElement.showModal()
  }

  closeActivateConfirmation(){
    if (this.activating()) return
    this.activateDialog().nativeElement.close()
  }

  // Cierra el pop-up al hacer clic en el fondo oscuro (fuera del contenido)
  onActivateDialogClick(event: MouseEvent){
    if (event.target === this.activateDialog().nativeElement) {
      this.closeActivateConfirmation()
    }
  }

  onActivate(){
    this.activating.set(true)
    this.activateError.set('')
    this.commentService.activateComment(this.comment().idComment.toString()).subscribe({
      next: () => {
        this.activating.set(false)
        this.activateDialog().nativeElement.close()
        this.deleted.emit()
      },
      error: () => {
        this.activating.set(false)
        this.activateError.set('No se pudo reactivar el comentario. Intentá de nuevo.')
      }
    })
  }
}
