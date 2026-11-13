import { Component, computed, inject, input, signal } from '@angular/core';
import { Comment } from '../../spaces/comments/comment';
import { CommentViewCard } from '../../spaces/comments/comment-view-card/comment-view-card';
import { CommentFilter, CommentFilterOptions } from '../../spaces/comments/comment-filter/comment-filter';

@Component({
  imports: [CommentViewCard, CommentFilter],
  selector: 'app-user-comments-list',
  styleUrl: './user-comments-list.css',
  templateUrl: './user-comments-list.html',
})
export class UserCommentsList {
  protected commentService = inject(Comment)
  readonly idUser = input.required<string>()

  filterOptions = signal<CommentFilterOptions>({
    score: null,
    username: '',
    scoreOrder: 'none',
  })

  readonly comments = this.commentService.getCommentsOfUser(this.idUser)

  commentsListFiltered = computed(() => {
    const comments = this.comments.value() ?? [];
    const { score, username, scoreOrder } = this.filterOptions();
    const usernameQuery = username.trim().toLocaleLowerCase();
    const filtered = comments.filter((comment) =>
      (score === null || comment.score === score) &&
      (!usernameQuery || (comment.username ?? '').toLocaleLowerCase().includes(usernameQuery))
    );

    if (scoreOrder === 'none') {
      return filtered;
    }

    return [...filtered].sort((a, b) =>
      scoreOrder === 'asc' ? a.score - b.score : b.score - a.score
    );
  })

  changeFilters(value: CommentFilterOptions) {
    this.filterOptions.set(value);
  }

  onCommentChanged(){
    this.comments.reload()
  }
}
