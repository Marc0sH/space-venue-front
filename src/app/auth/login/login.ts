import { Component, inject, signal } from '@angular/core';
import { Session } from '../user/session';
import { LoginRequest } from '../../models/user.model';
import { form, required, FormField, minLength } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';

@Component({
  imports: [FormField, FormErrorMessage, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private loginServiceProvider = inject(Session);
  error = signal<string>("");
  private router = inject(Router);
  loading = signal<boolean>(false);

  model = signal<LoginRequest>({username: "", password: ""});
  loginForm = form(this.model, (path) => {
    required(path.username, {message: "El nombre de usuario es requerido"})
    required(path.password, {message: "La contrseña es equerida"})
    //Por el momento no voy a incluir mas restricciones, no vaya a ser que no coincidan con las de registro
  })

  onSubmit(event: Event) {
    event.preventDefault();
    this.loading.set(true);

    this.loginServiceProvider.loginUser(this.model()).subscribe({
      next: (response) => {
        this.error.set("");
        console.log('Login exitoso:', response);
        this.router.navigate(['/espacios']);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set("Error al iniciar sesion usuario: " + error.message);
        console.error('Error ' + error.status + ' al iniciar sesion:', error);
        this.loading.set(false);
      }
    });
  }
}
