import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../user';
import { ConsumerFilter } from '../../models/user.model';

const FILTRO_VACIO: ConsumerFilter = { firstname: null, lastname: null, email: null, phone: null, username: null };

@Component({
  imports: [RouterLink],
  selector: 'app-admin-users',
  styleUrl: './admin-users.css',
  templateUrl: './admin-users.html',
})
export class AdminUsers {
  private readonly userService = inject(User);

  //Lo que se está escribiendo en los inputs (no dispara requests)
  readonly borrador = signal<ConsumerFilter>(FILTRO_VACIO);
  //Filtro aplicado: cada cambio dispara una nueva búsqueda en el back. Vacío = trae todos
  private readonly filtro = signal<ConsumerFilter>(FILTRO_VACIO);
  readonly usuarios = this.userService.searchUsers(this.filtro);

  //El back no filtra por estado, así que este filtro se aplica sobre los resultados
  readonly estado = signal<'Todos' | 'Activos' | 'Inactivos'>('Todos');

  readonly usuariosFiltrados = computed(() =>
    (this.usuarios.value() ?? []).filter(u =>
      this.estado() === 'Todos' || u.credentials?.isActive === (this.estado() === 'Activos')
    )
  );

  readonly cantidadInactivos = computed(() =>
    (this.usuarios.value() ?? []).filter(u => !u.credentials?.isActive).length
  );

  readonly hayFiltros = computed(() => Object.values(this.filtro()).some(v => v != null));

  actualizarCampo(campo: keyof ConsumerFilter, valor: string) {
    this.borrador.update(b => ({ ...b, [campo]: valor }));
  }

  buscar() {
    //Los vacíos van como null: el back los ignora (si phone fuera '' no matchearía nada)
    const limpio = (v: string | null) => v?.trim() || null;
    const b = this.borrador();
    this.filtro.set({
      firstname: limpio(b.firstname),
      lastname: limpio(b.lastname),
      email: limpio(b.email),
      phone: limpio(b.phone),
      username: limpio(b.username),
    });
  }

  limpiar() {
    this.borrador.set(FILTRO_VACIO);
    this.filtro.set(FILTRO_VACIO);
  }
}
