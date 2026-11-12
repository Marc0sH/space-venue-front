import { Component, output } from '@angular/core';

export type CommentScoreOrder = 'none' | 'asc' | 'desc';

export interface CommentFilterOptions {
  score: number | null;
  username: string;
  scoreOrder: CommentScoreOrder;
}

@Component({
  imports: [],
  selector: 'app-comment-filter',
  styleUrl: './comment-filter.css',
  templateUrl: './comment-filter.html',
})
export class CommentFilter {
  filtersChanged = output<CommentFilterOptions>();
  private filters: CommentFilterOptions = {
    score: null,
    username: '',
    scoreOrder: 'none',
  };

  onScoreChange(value: string) {
    this.updateFilters({ score: value === '' ? null : Number(value) });
  }

  onScoreOrderChange(value: string) {
    const scoreOrder = value === 'asc' || value === 'desc' ? value : 'none';
    this.updateFilters({ scoreOrder });
  }

  onUsernameChange(username: string) {
    this.updateFilters({ username });
  }

  private updateFilters(changes: Partial<CommentFilterOptions>) {
    this.filters = { ...this.filters, ...changes };
    this.filtersChanged.emit(this.filters);
  }
}
