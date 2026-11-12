import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../user';
import { Session } from '../../auth/session/session';
import { ConsumerFilter, etiquetaEstadoCuenta } from '../../models/user.model';
import { mensajeDeError } from '../../common/http-error';

const FILTRO_VACIO: ConsumerFilter = { firstname: null, lastname: null, email: null, phone: null, username: null };

@Component({
  imports: [RouterLink],
  selector: 'app-admin-users',
  styleUrl: './admin-users.css',
  templateUrl: './admin-users.html',
})
export class AdminUsers {
  private readonly userService = inject(User);
  private readonly sessionService = inject(Session);

  //El admin no puede desactivarse a sí mismo desde acá
  readonly miId = computed(() => this.sessionService.session()?.consumerId);
  //Fila en la que se pidió confirmación y fila que se está procesando
  readonly confirmando = signal<number | null>(null);
  readonly actualizando = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  //Lo que se está escribiendo en los inputs (no dispara requests)
  readonly borrador = signal<ConsumerFilter>(FILTRO_VACIO);
  //Filtro aplicado: cada cambio dispara una nueva búsqueda en el back. Vacío = trae todos
  private readonly filtro = signal<ConsumerFilter>(FILTRO_VACIO);
  readonly usuarios = this.userService.searchUsers(this.filtro);

  readonly etiquetaEstado = etiquetaEstadoCuenta;

  //El back no filtra por estado, así que este filtro se aplica sobre los resultados.
  //Los motivos de baja (USER_REQUEST, ADMIN) también se pueden elegir como filtro
  readonly estado = signal<string>('Todos');

  readonly usuariosFiltrados = computed(() =>
    (this.usuarios.value() ?? []).filter(u => {
      const c = u.credentials;
      switch (this.estado()) {
        case 'Todos': return true;
        case 'Activos': return c?.isActive;
        case 'Inactivos': return !c?.isActive;
        default: return !c?.isActive && c?.deactivationReason === this.estado();
      }
    })
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

  cambiarEstado(id: number, active: boolean) {
    this.actualizando.set(id);
    this.error.set(null);
    this.userService.setUserStatus(id, active).subscribe({
      next: () => {
        //Actualizamos la lista local en vez de volver a buscar (mismo criterio que el back para el motivo)
        this.usuarios.value.update(lista =>
          lista?.map(u => u.idConsumer === id
            ? { ...u, credentials: { ...u.credentials, isActive: active, deactivationReason: active ? null : 'ADMIN' } }
            : u)
        );
        this.confirmando.set(null);
        this.actualizando.set(null);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, `No se pudo ${active ? 'activar' : 'desactivar'} el usuario`));
        this.actualizando.set(null);
      },
    });
  }

  limpiar() {
    this.borrador.set(FILTRO_VACIO);
    this.filtro.set(FILTRO_VACIO);
  }
}
