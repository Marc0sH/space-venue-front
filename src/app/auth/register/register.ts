import { Component, inject, signal } from '@angular/core';
import { CredentialRegister } from '../../models/user.model';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Router, RouterLink } from '@angular/router';
import { Session } from '../session/session';
import { mensajeDeError } from '../../common/http-error';
import { hasChangedFrom } from '../../common/unsaved-changes';
import { UnsavedChangesDirective } from '../../common/unsaved-changes.directive';

const INITIAL_REGISTER_MODEL: CredentialRegister = {
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  username: '',
  password: '',
};

@Component({
  imports: [FormField, FormErrorMessage, RouterLink, UnsavedChangesDirective],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  model = signal<CredentialRegister>({ ...INITIAL_REGISTER_MODEL });
  formRegister = form(this.model, (path) => {
    required(path.firstname, {message: 'El primer nombre es requerido'});
    required(path.lastname, {message: 'El apellido es requerido'});
    required(path.email, {message: 'El correo electrónico es requerido'});
    required(path.phone, {message: 'El teléfono es requerido'});
    required(path.username, {message: 'El nombre de usuario es requerido'});
    required(path.password, {message: 'La contraseña es requerida'});

    email(path.email, {message: 'El correo electrónico no es válido'});
    minLength(path.password, 8, {message: 'La contraseña debe tener al menos 8 caracteres'});
  })

  private sessionProvider = inject(Session);
  private router = inject(Router)

  error = signal("")
  private readonly savedModel = signal<CredentialRegister>({ ...INITIAL_REGISTER_MODEL })

  hasUnsavedChanges(): boolean {
    return hasChangedFrom(this.model(), this.savedModel());
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const submittedModel = { ...this.model() };

    this.sessionProvider.registerUser(submittedModel).subscribe({
      next: (response) => {
        this.error.set("");
        this.savedModel.set(submittedModel);
        console.log('Usuario registrado con éxito:', response);
        this.router.navigate(['/login']);

      },
      error: (error) => {
        this.error.set(mensajeDeError(error, "No se pudo completar el registro"));
        console.error('Error ' + error.status + ' al registrar usuario:', error);
      }
    });
  }
}
