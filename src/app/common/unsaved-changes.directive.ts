import { Directive, input } from '@angular/core';

@Directive({
  selector: '[appUnsavedChanges]',
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class UnsavedChangesDirective {
  readonly hasUnsavedChanges = input(false, { alias: 'appUnsavedChanges' });

  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedChanges()) {
      return;
    }

    event.preventDefault();
    event.returnValue = 'true'; // respaldo para navegadores antiguos
  }
}
