import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Spaceservice } from '../spaceservice';
import { Spacescard } from '../spacescard/spacescard';

@Component({
  imports: [Spacescard, RouterLink],
  selector: 'app-spaceslist',
  styleUrl: './spaceslist.css',
  templateUrl: './spaceslist.html',
})
export class Spaceslist {
  private readonly spaceService = inject(Spaceservice)
  private readonly spacesResource = this.spaceService.getSpaces();

  readonly spaces = computed(() => this.spacesResource.value() ?? []);

  readonly loading = this.spacesResource.isLoading;
  readonly error = computed(() =>
    this.spacesResource.error()
      ? 'No se pudieron cargar los espacios'
      : null,
  );
}
