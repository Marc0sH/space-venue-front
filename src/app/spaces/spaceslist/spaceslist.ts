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
  private readonly spaceService = inject(Spaceservice);
  private readonly spacesResource = this.spaceService.getSpaces();

  readonly spaces = computed(() => this.spacesResource.value() ?? []);

  // Espacios que superan 4.5 de valoración, ordenados de mayor a menor rating
  readonly featuredSpaces = computed(() =>
    this.spaces()
      .filter((s) => s.rating > 4.5)
      .sort((a, b) => b.rating - a.rating)
  );

  readonly loading = this.spacesResource.isLoading;
  readonly error = computed(() =>
    this.spacesResource.error()
      ? 'No se pudieron cargar los espacios'
      : null,
  );
}