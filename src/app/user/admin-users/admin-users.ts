import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../user';
import { Session } from '../../auth/session/session';
import { ConsumerFilter, ImpactoCuenta, Rol, etiquetaEstadoCuenta, etiquetaRol } from '../../models/user.model';
import { mensajeDeError } from '../../common/http-error';

//Operación esperando confirmación del admin. impacto es null mientras carga (o si no hace falta, como al pasar a oferente)
interface Pendiente {
  id: number;
  tipo: 'DESACTIVAR' | 'ROL';
  rol?: Rol;
  impacto: ImpactoCuenta | null;
  cargando: boolean;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

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
  //Desactivar y cambiar el rol se confirman antes, mostrando qué va a pasar (espacios, reservas)
  readonly pendiente = signal<Pendiente | null>(null);
  readonly actualizando = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  //Fila a la que se le está cambiando el rol y mensaje de confirmación del back
  readonly cambiandoRol = signal<number | null>(null);
  readonly aviso = signal<string | null>(null);

  //Lo que se está escribiendo en los inputs (no dispara requests)
  readonly borrador = signal<ConsumerFilter>(FILTRO_VACIO);
  //Filtro aplicado: cada cambio dispara una nueva búsqueda en el back. Vacío = trae todos
  private readonly filtro = signal<ConsumerFilter>(FILTRO_VACIO);
  readonly usuarios = this.userService.searchUsers(this.filtro);

  readonly etiquetaEstado = etiquetaEstadoCuenta;
  readonly etiquetaRol = etiquetaRol;

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

  pedirDesactivar(id: number) {
    this.abrirConfirmacion({ id, tipo: 'DESACTIVAR', impacto: null, cargando: true });
  }

  //El select no cambia hasta que se confirma: vuelve al rol actual y se abre la confirmación
  pedirCambioRol(id: number, select: HTMLSelectElement) {
    const rol = select.value as Rol;
    const actual = this.usuarios.value()?.find(u => u.idConsumer === id)?.credentials?.rol;
    if (actual) select.value = actual;
    if (rol === actual) return;
    //Pasar a oferente no tiene consecuencias sobre espacios ni reservas: no hace falta calcular el impacto
    this.abrirConfirmacion({ id, tipo: 'ROL', rol, impacto: null, cargando: rol === 'ROLE_CLIENT' });
  }

  private abrirConfirmacion(p: Pendiente) {
    this.error.set(null);
    this.aviso.set(null);
    this.pendiente.set(p);
    if (!p.cargando) return;
    this.userService.getImpacto(p.id, p.tipo === 'DESACTIVAR' ? 'DESACTIVAR' : 'CAMBIAR_A_CLIENTE').subscribe({
      next: (impacto) => {
        //Si mientras cargaba se abrió otra confirmación, esta respuesta ya no importa
        if (this.pendiente() === p) this.pendiente.set({ ...p, impacto, cargando: false });
      },
      error: (err) => {
        if (this.pendiente() !== p) return;
        this.error.set(mensajeDeError(err, 'No se pudo calcular qué cambiaría'));
        this.pendiente.set(null);
      },
    });
  }

  cancelarConfirmacion() {
    this.pendiente.set(null);
  }

  confirmar() {
    const p = this.pendiente();
    if (!p || p.cargando || p.impacto?.bloqueado) return;
    if (p.tipo === 'DESACTIVAR') this.cambiarEstado(p.id, false);
    else if (p.rol) this.cambiarRol(p.id, p.rol);
  }

  //Texto de la confirmación: qué se hace y qué consecuencias tiene
  lineasConfirmacion(p: Pendiente): string[] {
    const usuario = this.usuarios.value()?.find(u => u.idConsumer === p.id);
    const nombre = usuario ? `${usuario.firstname} ${usuario.lastname}`.trim() || usuario.credentials?.username : 'el usuario';
    if (p.tipo === 'ROL' && p.rol === 'ROLE_OFFERER') {
      return [`¿Pasar a ${nombre} a oferente? Va a poder publicar espacios.`];
    }
    const lineas = [p.tipo === 'DESACTIVAR'
      ? `¿Desactivar la cuenta de ${nombre}?`
      : `¿Pasar a ${nombre} a cliente? Ya no va a poder publicar espacios.`];
    const i = p.impacto;
    if (!i) return lineas;
    if (i.espaciosOcultos > 0) {
      lineas.push(`${plural(i.espaciosOcultos, 'espacio publicado deja', 'espacios publicados dejan')} de verse.`);
    }
    if (i.reservasACancelar > 0) {
      lineas.push(`Se ${i.reservasACancelar === 1 ? 'cancela' : 'cancelan'} ${plural(i.reservasACancelar, 'reserva futura', 'reservas futuras')} y se avisa a cada persona afectada.`);
    }
    if (i.reservasPagadas > 0) {
      lineas.push(`${plural(i.reservasPagadas, 'está pagada y queda', 'están pagadas y quedan')} pendiente${i.reservasPagadas === 1 ? '' : 's'} de reintegro.`);
    }
    if (i.espaciosOcultos === 0 && i.reservasACancelar === 0) {
      lineas.push(p.tipo === 'DESACTIVAR' ? 'No tiene espacios publicados ni reservas futuras.' : 'No tiene espacios publicados ni reservas futuras en ellos.');
    }
    if (i.espaciosOcultos > 0 || i.reservasACancelar > 0) {
      lineas.push(p.tipo === 'DESACTIVAR'
        ? 'Si se reactiva la cuenta, los espacios vuelven a verse, pero las reservas canceladas no se recuperan.'
        : 'Si vuelve a ser oferente, los espacios vuelven a verse, pero las reservas canceladas no se recuperan.');
    }
    return lineas;
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
        this.pendiente.set(null);
        this.actualizando.set(null);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, `No se pudo ${active ? 'activar' : 'desactivar'} el usuario`));
        this.actualizando.set(null);
      },
    });
  }

  //Pasa un usuario de cliente a oferente (puede publicar espacios) o al revés. Se llama al confirmar.
  //Al pasar a cliente, el back oculta sus espacios y cancela sus reservas futuras.
  //Si lo rechaza (por ej. tiene una reserva en curso) el select sigue en el rol actual
  private cambiarRol(id: number, rol: Rol) {
    this.cambiandoRol.set(id);
    this.error.set(null);
    this.aviso.set(null);
    this.userService.setUserRol(id, rol).subscribe({
      next: (res) => {
        this.usuarios.value.update(lista =>
          lista?.map(u => u.idConsumer === id ? { ...u, credentials: { ...u.credentials, rol } } : u)
        );
        this.aviso.set(res?.mensaje ?? 'Rol actualizado');
        this.pendiente.set(null);
        this.cambiandoRol.set(null);
      },
      error: (err) => {
        this.pendiente.set(null);
        this.error.set(mensajeDeError(err, 'No se pudo cambiar el rol del usuario'));
        this.cambiandoRol.set(null);
      },
    });
  }

  limpiar() {
    this.borrador.set(FILTRO_VACIO);
    this.filtro.set(FILTRO_VACIO);
  }
}
