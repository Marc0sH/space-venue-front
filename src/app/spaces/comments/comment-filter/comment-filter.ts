import { Component, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-comment-filter',
  styleUrl: './comment-filter.css',
  templateUrl: './comment-filter.html',
})
export class CommentFilter {
  scoreSelected = output<number | null>()

  onChangeSelected(event: any){
    const value = event.target.value !== "" ? Number(event.target.value) : null
    this.scoreSelected.emit(value)
  }
}
