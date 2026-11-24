import { Component, computed, inject, input, output, signal, viewChildren } from '@angular/core';
import { Comment } from '../comment';
import { CommentViewCard } from '../comment-view-card/comment-view-card';
import { CommentFilter, type CommentFilterOptions } from '../comment-filter/comment-filter';

@Component({
  imports: [CommentViewCard, CommentFilter],
  selector: 'app-comments-list',
  styleUrl: './comments-list.css',
  templateUrl: './comments-list.html',
})
export class CommentsList {
  private commentService = inject(Comment)
  private readonly commentCards = viewChildren(CommentViewCard);
  readonly idSpace = input.required<string>()
  readonly commentsChanged = output<void>()
  filterOptions = signal<CommentFilterOptions>({
    score: null,
    username: '',
    scoreOrder: 'none',
    status: 'all',
  })
  comments = this.commentService.getCommentsOfSpace(this.idSpace)
  commentsListFiltered = computed(() => {
    const comments = this.comments.value() ?? [];
    const { score, username, scoreOrder, status } = this.filterOptions();
    const usernameQuery = username.trim().toLocaleLowerCase();
    const filtered = comments.filter((comment) =>
      (score === null || comment.score === score) &&
      (status === 'all' || comment.isActive === (status === 'active')) &&
      (!usernameQuery || (comment.username ?? '').toLocaleLowerCase().includes(usernameQuery))
    );

    if (scoreOrder === 'none') {
      return filtered;
    }

    return [...filtered].sort((a, b) =>
      scoreOrder === 'asc' ? a.score - b.score : b.score - a.score
    );
  })

  hasUnsavedChanges(): boolean {
    return this.commentCards().some(card => card.hasUnsavedChanges());
  }

  changeFilters(value: CommentFilterOptions) {
    this.filterOptions.set(value);
  }

  onCommentChanged(){
    this.reload()
    this.commentsChanged.emit()
  }

  reload(){
    this.comments.reload()
  }
}
