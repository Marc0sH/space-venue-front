import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { UnsavedChangesDialogService } from '../common/unsaved-changes-dialog';

export interface FormularioConCambiosPendientes {
  hasUnsavedChanges(): boolean;
}

export const formularioGuard: CanDeactivateFn<FormularioConCambiosPendientes> = (formulario) => {
  if (!formulario.hasUnsavedChanges()) {
    return true;
  }

  return inject(UnsavedChangesDialogService).confirm();
};
