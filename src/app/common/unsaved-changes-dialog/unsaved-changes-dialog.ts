import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { UnsavedChangesDialogService } from '../unsaved-changes-dialog';

@Component({
  selector: 'app-unsaved-changes-dialog',
  templateUrl: './unsaved-changes-dialog.html',
  styleUrl: './unsaved-changes-dialog.css',
})
export class UnsavedChangesDialog {
  readonly dialogService = inject(UnsavedChangesDialogService);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) {
        return;
      }

      if (this.dialogService.isOpen() && !element.open) {
        element.showModal();
      } else if (!this.dialogService.isOpen() && element.open) {
        element.close();
      }
    });
  }

  cancel(event: Event): void {
    event.preventDefault();
    this.dialogService.answer(false);
  }
}
