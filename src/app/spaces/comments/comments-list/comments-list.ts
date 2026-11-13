import { Component, inject, input } from '@angular/core';
import { Comment } from '../comment';
import { CommentViewCard } from '../comment-view-card/comment-view-card';

@Component({
  imports: [CommentViewCard],
  selector: 'app-comments-list',
  styleUrl: './comments-list.css',
  templateUrl: './comments-list.html',
})
export class CommentsList {
  private commentService = inject(Comment)
  readonly idSpace = input.required<string>()
  comments = this.commentService.getCommentsOfSpace(this.idSpace)

  onCommentChanged(){
    this.comments.reload()
  }
}
