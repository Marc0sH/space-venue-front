import { Component, inject, signal } from '@angular/core';
import { CredentialRegister } from '../../models/user.model';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { Session } from '../session/session';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [FormField, FormErrorMessage, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  model = signal<CredentialRegister>({ firstname: "", lastname: "", email: "", phone: "", username: "", password: "" });
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

  onSubmit(event: Event) {
    event.preventDefault();

    this.sessionProvider.registerUser(this.model()).subscribe({
      next: (response) => {
        this.error.set("");
        console.log('Usuario registrado con éxito:', response);
        this.router.navigate(['/login']);

      },
      error: (error) => {
        this.error.set("Error al registrar usuario: " + error.message);
        console.error('Error ' + error.status + ' al registrar usuario:', error);
      }
    });
  }
}
