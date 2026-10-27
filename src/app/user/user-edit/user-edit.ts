import { Component, inject, linkedSignal, signal } from '@angular/core';
import { User } from '../user';
import { Router, RouterLink } from '@angular/router';
import { UserUpdate } from '../../models/user.model';
import { email, form, FormField, required } from '@angular/forms/signals';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';


@Component({
  imports: [FormField, FormErrorMessage, RouterLink],
  selector: 'app-user-edit',
  styleUrl: './user-edit.css',
  templateUrl: './user-edit.html',
})
export class UserEdit {
  private servicioUsuario = inject(User);
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

  formEdit = form(this.model, (path) => {
    required(path.firstname, {message: 'El primer nombre es requerido'});
    required(path.lastname, {message: 'El apellido es requerido'});
    required(path.email, {message: 'El correo electrónico es requerido'});
    required(path.phone, {message: 'El teléfono es requerido'});
    email(path.email, {message: 'El correo electrónico no es válido'});
  });

  error = signal('');
  guardando = signal(false);

  onSubmit(event: Event) {
    event.preventDefault();
    this.guardando.set(true);
    this.servicioUsuario.updateLoggedUser(this.model()).subscribe({
      next: () => this.router.navigate(['/perfil']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo actualizar el perfil');
        this.guardando.set(false);
      },
    });
  }
}

