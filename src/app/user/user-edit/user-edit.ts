import { Component, inject, linkedSignal, signal } from '@angular/core';
import { User } from '../user';
import { Router, RouterLink } from '@angular/router';
import { UserUpdate } from '../../models/user.model';
import { email, form, FormField, required } from '@angular/forms/signals';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { mensajeDeError } from '../../common/http-error';
import { hasChangedFrom } from '../../common/unsaved-changes';
import { UnsavedChangesDirective } from '../../common/unsaved-changes.directive';
import { ToastService } from '../../common/toast-service';


@Component({
  imports: [FormField, FormErrorMessage, RouterLink, UnsavedChangesDirective],
  selector: 'app-user-edit',
  styleUrl: './user-edit.css',
  templateUrl: './user-edit.html',
})
export class UserEdit {
  private servicioUsuario = inject(User);
  private readonly toastService = inject(ToastService);
  private router = inject(Router);

  protected readonly perfil = this.servicioUsuario.getLoggedProfile();

  model = linkedSignal<UserUpdate>(() => {
    const p = this.perfil.value();
    return {
      firstname: p?.firstname ?? '',
      lastname: p?.lastname ?? '',
      email: p?.email ?? '',
      phone: p?.phone ?? '',
    };
  });
  private readonly savedModel = linkedSignal<UserUpdate | null>(() => {
    const p = this.perfil.value();
    return p ? {
      firstname: p.firstname ?? '',
      lastname: p.lastname ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
    } : null;
  });

  formEdit = form(this.model, (path) => {
    required(path.firstname, {message: 'El primer nombre es requerido'});
    required(path.lastname, {message: 'El apellido es requerido'});
    required(path.email, {message: 'El correo electrónico es requerido'});
    required(path.phone, {message: 'El teléfono es requerido'});
    email(path.email, {message: 'El correo electrónico no es válido'});
  });

  error = signal('');
  guardando = signal(false);

  hasUnsavedChanges(): boolean {
    const savedModel = this.savedModel();
    if (!savedModel) {
      return false;
    }

    return hasChangedFrom(this.model(), savedModel);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const submittedModel = { ...this.model() };
    this.guardando.set(true);
    this.servicioUsuario.updateLoggedUser(submittedModel).subscribe({
      next: () => {
        this.savedModel.set(submittedModel);
        this.toastService.success('Tu perfil se actualizó correctamente.');
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudo actualizar el perfil'));
        this.guardando.set(false);
      },
    });
  }
}

