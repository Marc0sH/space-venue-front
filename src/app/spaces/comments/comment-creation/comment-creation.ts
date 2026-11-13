import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommentComplete, CommentForm } from '../../../models/comment.model';
import { form, max, min, required, FormField } from '@angular/forms/signals';
import { Comment } from '../comment';

@Component({
  imports: [FormField],
  selector: 'app-comment-creation',
  styleUrl: './comment-creation.css',
  templateUrl: './comment-creation.html',
})
export class CommentCreation {
  private readonly commentService = inject(Comment)
  readonly idSpace = input.required<string>()
  readonly isEditing = input(false)
  readonly commentToEdit = input<CommentComplete | null>(null)
  readonly saved = output<void>()
  readonly cancelled = output<void>()

  model = signal<CommentForm>({description:'', score:0, idSpace:''})

  constructor() {
    effect(() => {
      const comment = this.commentToEdit()
      this.model.update(model => ({
        ...model,
        idSpace: comment ? comment.idSpace.toString() : this.idSpace(),
        description: comment?.description ?? '',
        score: comment?.score ?? 0,
      }))
    })
  }

  formComment = form(this.model, (path) => {
    required(path.score, {message:'La calificación es obligatoria.'})
    min(path.score, 0, {message:'La calificación no puede ser negativa.'})
    max(path.score, 5, {message:'La calificación no puede ser mayor a 5 puntos.'})
  })

  readonly enviando = signal(false)
  readonly mensajeExito = signal('')
  readonly error = signal('')

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
    this.mensajeExito.set('')
    this.error.set('')

    const request = editing && comment
      ? this.commentService.modifyComment(comment.idComment, this.model())
      : this.commentService.createComment(this.model())

    request.subscribe({
      next: () => {
        this.mensajeExito.set(editing
          ? 'Tu comentario se modificó correctamente.'
          : 'Tu comentario se publicó correctamente.')
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
