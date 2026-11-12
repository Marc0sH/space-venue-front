import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommentComplete } from '../../../models/comment.model';

@Component({
  imports: [DatePipe],
  selector: 'app-comment-view-card',
  styleUrl: './comment-view-card.css',
  templateUrl: './comment-view-card.html',
})
export class CommentViewCard {
  comment = input.required<CommentComplete>()
}
