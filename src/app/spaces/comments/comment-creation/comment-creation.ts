import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommentComplete, CommentForm } from '../../../models/comment.model';
import { form, max, maxLength, min, required, FormField } from '@angular/forms/signals';
import { FormErrorMessage } from '../../../common/form-error-message/form-error-message';
import { Comment } from '../comment';
import { hasChangedFrom } from '../../../common/unsaved-changes';
import { ToastService } from '../../../common/toast-service';

@Component({
  imports: [FormField, FormErrorMessage],
  selector: 'app-comment-creation',
  styleUrl: './comment-creation.css',
  templateUrl: './comment-creation.html',
})
export class CommentCreation {
  private readonly toastService = inject(ToastService);
  private readonly commentService = inject(Comment)
  readonly idSpace = input.required<string>()
  readonly isEditing = input(false)
  readonly commentToEdit = input<CommentComplete | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  model = signal<CommentForm>({description:'', score:1, idSpace:''})

  constructor() {
    effect(() => {
      const comment = this.commentToEdit()
      this.model.update(model => ({
        ...model,
        idSpace: comment ? comment.idSpace.toString() : this.idSpace(),
        description: comment?.description ?? '',
        score: comment?.score ?? 1,
      }))
    })
  }

  formComment = form(this.model, (path) => {
    maxLength(path.description, 250, {message:'La reseña no puede superar los 250 caracteres.'})
    required(path.score, {message:'La calificación es obligatoria.'})
    min(path.score, 1, {message:'La calificación mínima es 1 estrella.'})
    max(path.score, 5, {message:'La calificación no puede ser mayor a 5 puntos.'})
  })

  readonly enviando = signal(false)
  readonly error = signal('')
  private readonly savedModel = signal<{ description: string; score: number } | null>(null)

  hasUnsavedChanges(): boolean {
    const comment = this.isEditing() ? this.commentToEdit() : null;
    const savedModel = this.savedModel() ?? (comment
      ? { description: comment.description, score: comment.score }
      : { description: '', score: 1 });
    return hasChangedFrom(
      { description: this.model().description, score: this.model().score },
      savedModel,
    );
  }

  onSubmit(event: Event){
    event.preventDefault()

    if (this.formComment().invalid() || this.enviando()) {
      return
    }

    const editing = this.isEditing()
    const comment = this.commentToEdit()
    if (editing && !comment) {
      this.error.set('No se pudo identificar el comentario a modificar.')
      return
    }

    this.enviando.set(true)
    this.error.set('')
    const submittedModel = { ...this.model() };

    const request = editing && comment
      ? this.commentService.modifyComment(comment.idComment, submittedModel)
      : this.commentService.createComment(submittedModel)

    request.subscribe({
      next: () => {
        this.savedModel.set({
          description: submittedModel.description,
          score: submittedModel.score,
        })
        this.toastService.success(editing
          ? 'Tu reseña se modificó correctamente.'
          : 'Tu reseña se publicó correctamente.')
        this.enviando.set(false)
        this.saved.emit()
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false)
        const detalle = typeof e.error?.mensaje === 'string'
          ? e.error.mensaje
          : typeof e.error?.message === 'string'
            ? e.error.message
            : ''
        this.error.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor.'
            : `${editing ? 'No se pudo modificar' : 'No se pudo publicar'} el comentario.${detalle ? ` ${detalle}` : ' Intentá nuevamente.'}`
        )
        console.error(
          editing ? 'Error al modificar el comentario:' : 'Error al publicar el comentario:',
          e
        )
      }
    })
  }

  onCancel(){
    this.cancelled.emit()
  }
}
