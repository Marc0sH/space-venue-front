import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Session } from '../../auth/session/session';

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected sessionService = inject(Session);
}
