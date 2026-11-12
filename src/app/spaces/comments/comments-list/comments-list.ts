import { Component, computed, inject, input, signal } from '@angular/core';
import { Comment } from '../comment';
import { CommentViewCard } from '../comment-view-card/comment-view-card';
import { CommentFilter } from '../comment-filter/comment-filter';

@Component({
  imports: [CommentViewCard, CommentFilter],
  selector: 'app-comments-list',
  styleUrl: './comments-list.css',
  templateUrl: './comments-list.html',
})
export class CommentsList {
  private commentService = inject(Comment)
  readonly idSpace = input.required<string>()
  scoreFilterSelected = signal<number | null>(null)
  comments = this.commentService.getCommentsOfSpace(this.idSpace)
  commentsListFiltered = computed(() => this.comments.value()?.filter((c) => 
    this.scoreFilterSelected() === null ? 
    this.comments.value() : 
    c.score === this.scoreFilterSelected()))

  changeFilter(value: number | null){
    this.scoreFilterSelected.set(value)
  }
}
