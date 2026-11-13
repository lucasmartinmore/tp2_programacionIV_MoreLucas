import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auth } from '../../servicios/auth';
import { UsuariosService } from '../../servicios/usuarios';
import { ModalService } from '../../servicios/modal';
import { mensajesDeError, tituloDeError } from '../../utils/errores';
import { Usuario } from '../../models/usuario';
import { ResaltarDirective } from '../../directives/resaltar.directive';
import { FormularioUsuario } from '../formulario-usuario/formulario-usuario';

// Los tres filtros posibles de la lista
type Filtro = 'todos' | 'activos' | 'inactivos';

@Component({
  imports: [FormularioUsuario, ResaltarDirective],
  selector: 'app-dashboard-usuarios',
  styleUrl: './dashboard-usuarios.css',
  templateUrl: './dashboard-usuarios.html',
})
export class DashboardUsuarios implements OnInit {
  private service = inject(UsuariosService);
  private modal = inject(ModalService);
  protected auth = inject(Auth);

  // Ref al form compartido 
  // (para limpiarlo despues de crear un usuario)
  private formulario = viewChild(FormularioUsuario);

  // Lista de usuarios y estados de carga
  usuarios = signal<Usuario[]>([]);
  cargando = signal(false);
  enviando = signal(false);

  // Texto del buscador y filtro de estado elegido
  busqueda = signal('');
  filtro = signal<Filtro>('todos');

  // Lista que realmente se muestra
  // aplica el filtro de estado y la busqueda 
  // (computed: se recalcula sola si cambia algo)
  visibles = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const estado = this.filtro();
    return this.usuarios().filter((u) => {
      if (estado === 'activos' && !u.activo) return false;
      if (estado === 'inactivos' && u.activo) return false;
      if (!texto) return true;
      // Buscamos en nombre, apellido, usuario y correo a la vez
      return `${u.nombre} ${u.apellido} ${u.username} ${u.email}`.toLowerCase().includes(texto);
    });
  });
  // Contadores para los botones del filtro
  cantActivos = computed(() => this.usuarios().filter((u) => u.activo).length);
  cantInactivos = computed(() => this.usuarios().filter((u) => !u.activo).length);

  // Al abrir la pantalla, traigo la lista
  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }

  // soy yo?
  //(no me puedo auto deshabilitar ni cambiar mi propio perfil)
  esYo(u: Usuario) {
    return u._id === this.auth.usuario()?._id;
  }

  // Habilita o deshabilita
  // Para deshabilitar pido confirmacion
  alternar(u: Usuario) {
    if (u.activo) {
      this.modal.confirmar('Deshabilitar usuario', `¿Deshabilitar a @${u.username}? No podrá ingresar.`, () =>
        this.cambiar(this.service.deshabilitar(u._id)),
      );
    } else {
      this.cambiar(this.service.habilitar(u._id));
    }
  }

  // Pasa a un usuario de comun a administrador, o al viceversa.
  // Siempre pide confirmación
  alternarPerfil(u: Usuario) {
    const nuevo = u.perfil === 'administrador' ? 'usuario' : 'administrador';
    const mensaje =
      nuevo === 'administrador'
        ? `¿Hacer administrador a @${u.username}? Va a poder gestionar usuarios y ver las estadísticas.`
        : `¿Quitarle el rol de administrador a @${u.username}?`;
    this.modal.confirmar('Cambiar perfil', mensaje, () => this.cambiar(this.service.cambiarPerfil(u._id, nuevo)));
  }

  // Ejecuta la peticion y reemplaza esa fila con el usuario actualizado que devuelve el back
  private cambiar(peticion: ReturnType<UsuariosService['habilitar']>) {
    peticion.subscribe({
      next: (actualizado) =>
        this.usuarios.update((lista) => lista.map((x) => (x._id === actualizado._id ? actualizado : x))),
      error: (err: HttpErrorResponse) => this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err)),
    });
  }

  // Crea un usuario nuevo. El FormData llega ya validado desde el formulario compartido
  crear(formData: FormData) {
    this.enviando.set(true);
    this.service.crear(formData).subscribe({
      next: (nuevo) => {
        this.enviando.set(false);
        // Lo pongo arriba de la lista
        //  y limpio el form
        this.usuarios.update((lista) => [nuevo, ...lista]);
        this.formulario()?.reiniciar();
        this.modal.mostrar('exito', 'Usuario creado', `@${nuevo.username} ya puede ingresar.`);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.modal.mostrar('error', tituloDeError(err.status), mensajesDeError(err));
      },
    });
  }
}