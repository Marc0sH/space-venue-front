import { Service, signal } from '@angular/core';

@Service()
export class UnsavedChangesDialogService {
  readonly isOpen = signal(false);

  private pendingDecision: Promise<boolean> | null = null;
  private resolveDecision: ((leave: boolean) => void) | null = null;

  confirm(): Promise<boolean> {
    if (this.pendingDecision) {
      return this.pendingDecision;
    }

    this.pendingDecision = new Promise<boolean>((resolve) => {
      this.resolveDecision = resolve;
      this.isOpen.set(true);
    });

    return this.pendingDecision;
  }

  answer(leave: boolean): void {
    const resolve = this.resolveDecision;
    this.resolveDecision = null;
    this.pendingDecision = null;
    this.isOpen.set(false);
    resolve?.(leave);
  }
}
