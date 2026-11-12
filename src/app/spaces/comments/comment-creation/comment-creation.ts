import { Component, effect, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommentForm } from '../../../models/comment.model';
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

  model = signal<CommentForm>({description:'', score:0, idSpace:''})

  constructor() {
    effect(() => {
      this.model().idSpace = this.idSpace()
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

    this.enviando.set(true)
    this.mensajeExito.set('')
    this.error.set('')

    this.commentService.createComment(this.model()).subscribe({
      next: () => {
        this.mensajeExito.set('Tu comentario se publicó correctamente.')
        this.enviando.set(false)
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
            : `No se pudo publicar el comentario.${detalle ? ` ${detalle}` : ' Intentá nuevamente.'}`
        )
        console.error('Error al publicar el comentario:', e)
      }
    })
  }
}
