import { Component, inject } from '@angular/core';
import { Session } from '../../auth/session/session';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected sessionService = inject(Session);
}
