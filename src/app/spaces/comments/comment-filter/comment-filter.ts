import { Component, inject, input, output } from '@angular/core';
import { Session } from '../../../auth/session/session';

export type CommentScoreOrder = 'none' | 'asc' | 'desc';
export type CommentStatusFilter = 'all' | 'active' | 'inactive';

export interface CommentFilterOptions {
  score: number | null;
  username: string;
  scoreOrder: CommentScoreOrder;
  status: CommentStatusFilter;
}

@Component({
  imports: [],
  selector: 'app-comment-filter',
  styleUrl: './comment-filter.css',
  templateUrl: './comment-filter.html',
})
export class CommentFilter {
  readonly sessionService = inject(Session);
  filtersChanged = output<CommentFilterOptions>();
  private filters: CommentFilterOptions = {
    score: null,
    username: '',
    scoreOrder: 'none',
    status: 'all',
  };

  isAdminFilter = input<boolean>(false)

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

  onStatusChange(value: string) {
    const status = value === 'active' || value === 'inactive' ? value : 'all';
    this.updateFilters({ status });
  }

  private updateFilters(changes: Partial<CommentFilterOptions>) {
    this.filters = { ...this.filters, ...changes };
    this.filtersChanged.emit(this.filters);
  }
}
