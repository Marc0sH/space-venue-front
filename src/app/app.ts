import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Session } from './auth/user/session';
import { Header } from './common/header/header';


@Component({
  imports: [RouterOutlet, Header],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected sessionService = inject(Session);
}
